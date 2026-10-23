-- ==============================================================================
-- SISTEMA INTEGRAL DE BASE DE DATOS Y AUTENTICACIÓN (RBAC) - "MÁNDALO!"
-- Supabase PostgreSQL 15+ compatible con Auth, RLS y Realtime
-- ==============================================================================

-- 0. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA PÚBLICA DE PERFILES (RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  identity_doc TEXT,
  role TEXT CHECK (role IN ('client', 'merchant', 'rider', 'admin')) NOT NULL DEFAULT 'client',
  
  -- Campos para Taxistas / Repartidores
  cooperative TEXT,
  vehicle_type TEXT CHECK (vehicle_type IN ('moto', 'car', 'none')) DEFAULT 'none',
  vehicle_plate TEXT,
  vehicle_model TEXT,
  
  -- Campos para Comercios
  merchant_name TEXT,
  manager_name TEXT,
  merchant_rif TEXT,
  merchant_category TEXT,

  -- Validación administrativa
  is_verified BOOLEAN DEFAULT FALSE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya había sido creada previamente
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cooperative TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS merchant_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS merchant_rif TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS merchant_category TEXT;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wallet_balance;

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.id
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.is_verified IS DISTINCT FROM OLD.is_verified) THEN
    RAISE EXCEPTION 'No puedes cambiar tu rol o estado de verificación.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 2. FUNCIÓN Y TRIGGER AUTOMÁTICO AL REGISTRAR EN AUTH.USERS
-- Extrae los metadatos completos pasados en supabase.auth.signUp({ options: { data: { ... } } })
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_vehicle_type TEXT;
  v_is_verified BOOLEAN;
  v_full_name TEXT;
BEGIN
  -- Extraer rol de metadatos o asignar 'client' por defecto
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'client');
  
  -- Extraer tipo de vehículo
  v_vehicle_type := COALESCE(new.raw_user_meta_data->>'vehicle_type', 'none');
  
  -- Clientes verificados automáticamente; Taxistas/Repartidores y Comercios pasan a revisión
  IF v_role = 'client' THEN
    v_is_verified := TRUE;
  ELSE
    v_is_verified := FALSE;
  END IF;

  -- Asignación automática de Administrador para edurock721@gmail.com
  IF LOWER(new.email) = 'edurock721@gmail.com' THEN
    v_role := 'admin';
    v_is_verified := TRUE;
  END IF;

  -- Componer nombre completo
  v_full_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    TRIM(COALESCE(new.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data->>'last_name', '')),
    'Usuario Mándalo'
  );
  IF v_full_name = '' THEN
    v_full_name := 'Usuario Mándalo';
  END IF;

  -- Insertar o actualizar en public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    phone,
    address,
    identity_doc,
    role,
    cooperative,
    vehicle_type,
    vehicle_plate,
    vehicle_model,
    merchant_name,
    manager_name,
    merchant_rif,
    merchant_category,
    is_verified,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    v_full_name,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    COALESCE(new.raw_user_meta_data->>'phone', 'Sin teléfono'),
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'identity_doc',
    v_role,
    new.raw_user_meta_data->>'cooperative',
    v_vehicle_type,
    new.raw_user_meta_data->>'vehicle_plate',
    new.raw_user_meta_data->>'vehicle_model',
    new.raw_user_meta_data->>'merchant_name',
    new.raw_user_meta_data->>'manager_name',
    new.raw_user_meta_data->>'merchant_rif',
    new.raw_user_meta_data->>'merchant_category',
    v_is_verified,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    identity_doc = EXCLUDED.identity_doc,
    role = EXCLUDED.role,
    cooperative = EXCLUDED.cooperative,
    vehicle_type = EXCLUDED.vehicle_type,
    vehicle_plate = EXCLUDED.vehicle_plate,
    vehicle_model = EXCLUDED.vehicle_model,
    merchant_name = EXCLUDED.merchant_name,
    manager_name = EXCLUDED.manager_name,
    merchant_rif = EXCLUDED.merchant_rif,
    merchant_category = EXCLUDED.merchant_category,
    updated_at = NOW();

  -- Si es comercio, crear automáticamente su tienda en la tabla public.merchants
  IF v_role = 'merchant' THEN
    INSERT INTO public.merchants (
      owner_id,
      name,
      category,
      address,
      phone,
      is_active,
      verified,
      plan,
      subscription_status,
      trial_start,
      trial_end,
      payment_methods,
      payment_config
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'merchant_name', v_full_name),
      COALESCE(new.raw_user_meta_data->>'merchant_category', 'Comercio General'),
      COALESCE(new.raw_user_meta_data->>'address', 'Sin dirección especificada'),
      COALESCE(new.raw_user_meta_data->>'phone', 'Sin teléfono'),
      FALSE,
      FALSE,
      'trial',
      'active',
      NOW(),
      NOW() + INTERVAL '30 days',
      '{"cash":true,"pagoMovil":true,"transferencia":true,"divisas":true,"contraEntrega":true}'::jsonb,
      '{"titular":"","cedula":"","telefonoPagoMovil":"","banco":"","numeroCuenta":"","aceptaDivisas":true}'::jsonb
    )
    ON CONFLICT (owner_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Vincular trigger a auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. TABLA DE COMERCIOS
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Comida Rápida',
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  banner_url TEXT,
  delivery_time TEXT DEFAULT '20-30 min',
  delivery_fee NUMERIC(10, 2) DEFAULT 1.50,
  rating NUMERIC(3, 2) DEFAULT 5.00,
  is_active BOOLEAN DEFAULT TRUE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'free', 'pro')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired')),
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  payment_methods JSONB NOT NULL DEFAULT '{"cash":true,"pagoMovil":true,"transferencia":true,"divisas":true,"contraEntrega":true}'::jsonb,
  payment_config JSONB NOT NULL DEFAULT '{"titular":"","cedula":"","telefonoPagoMovil":"","banco":"","numeroCuenta":"","aceptaDivisas":true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.merchants ALTER COLUMN plan SET DEFAULT 'trial';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS trial_start TIMESTAMPTZ;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS payment_methods JSONB NOT NULL DEFAULT '{"cash":true,"pagoMovil":true,"transferencia":true,"divisas":true,"contraEntrega":true}'::jsonb;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS payment_config JSONB NOT NULL DEFAULT '{"titular":"","cedula":"","telefonoPagoMovil":"","banco":"","numeroCuenta":"","aceptaDivisas":true}'::jsonb;
ALTER TABLE public.merchants DROP CONSTRAINT IF EXISTS merchants_plan_check;
ALTER TABLE public.merchants ADD CONSTRAINT merchants_plan_check CHECK (plan IN ('trial', 'free', 'pro'));
ALTER TABLE public.merchants DROP CONSTRAINT IF EXISTS merchants_subscription_status_check;
ALTER TABLE public.merchants ADD CONSTRAINT merchants_subscription_status_check CHECK (subscription_status IN ('active', 'expired'));
UPDATE public.merchants SET verified = COALESCE((SELECT is_verified FROM public.profiles WHERE id = owner_id), FALSE);
ALTER TABLE public.merchants ALTER COLUMN is_active SET DEFAULT FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_merchants_owner_unique ON public.merchants(owner_id);

CREATE OR REPLACE FUNCTION public.admin_set_merchant_verified(p_owner_id UUID, p_verified BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Solo un administrador puede validar comercios.';
  END IF;
  
  -- Actualizar tabla de comercios
  UPDATE public.merchants
  SET verified = p_verified, is_active = p_verified
  WHERE owner_id = p_owner_id;

  -- Sincronizar también el perfil del propietario
  UPDATE public.profiles
  SET is_verified = p_verified, updated_at = NOW()
  WHERE id = p_owner_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_verified(p_user_id UUID, p_verified BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Solo un administrador puede cambiar la verificación.';
  END IF;

  -- Actualizar verificación en la tabla profiles (conductores, clientes, etc.)
  UPDATE public.profiles
  SET is_verified = p_verified, updated_at = NOW()
  WHERE id = p_user_id;

  -- Si el usuario resulta ser un comercio, sincronizar también la tienda
  UPDATE public.merchants
  SET verified = p_verified, is_active = p_verified
  WHERE owner_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_merchant_verified(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_verified(UUID, BOOLEAN) TO authenticated;

-- 4. TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.enforce_free_merchant_product_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_plan TEXT;
  v_product_count INTEGER;
BEGIN
  SELECT plan INTO v_plan FROM public.merchants WHERE id = NEW.merchant_id;
  IF v_plan = 'free' THEN
    SELECT COUNT(*) INTO v_product_count FROM public.products WHERE merchant_id = NEW.merchant_id;
    IF v_product_count >= 10 THEN
      RAISE EXCEPTION 'El plan gratuito permite publicar hasta 10 productos.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_free_merchant_product_limit ON public.products;
CREATE TRIGGER enforce_free_merchant_product_limit
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_merchant_product_limit();

-- 5. TABLA DE ÓRDENES Y SERVICIOS (Compras, Mandaditos y Carreras)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type TEXT CHECK (order_type IN ('store_purchase', 'mandadito', 'ride')) NOT NULL DEFAULT 'store_purchase',
  client_id UUID REFERENCES public.profiles(id) NOT NULL,
  merchant_id UUID REFERENCES public.merchants(id),
  rider_id UUID REFERENCES public.profiles(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'preparing', 'ready_for_pickup', 'on_way', 'delivered', 'cancelled')) DEFAULT 'pending',
  
  -- Especificaciones de carga y pasajeros (Decisión del conductor)
  passenger_count INT DEFAULT 1,
  cargo_size TEXT CHECK (cargo_size IN ('small', 'medium', 'heavy')) DEFAULT 'small',
  notes TEXT,

  -- Contenido de compras en comercios
  items JSONB,
  subtotal NUMERIC(10, 2) DEFAULT 0.00,

  -- Mandaditos y Carreras
  pickup_address TEXT,
  pickup_coords JSONB,
  task_description TEXT,
  purchase_budget NUMERIC(10, 2) DEFAULT 0.00,

  -- Entrega común y coordenadas GPS
  delivery_address TEXT NOT NULL,
  delivery_coords JSONB,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 2.00,
  total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders DROP COLUMN IF EXISTS platform_fee;
ALTER TABLE public.orders DROP COLUMN IF EXISTS payment_method;
ALTER TABLE public.orders DROP COLUMN IF EXISTS payment_receipt_url;
ALTER TABLE public.orders DROP COLUMN IF EXISTS pago_movil_ref;

CREATE OR REPLACE FUNCTION public.enforce_merchant_order_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_merchant public.merchants%ROWTYPE;
BEGIN
  IF NEW.order_type = 'store_purchase' THEN
    SELECT * INTO v_merchant FROM public.merchants WHERE id = NEW.merchant_id;
    IF NOT FOUND OR NOT v_merchant.verified OR NOT v_merchant.is_active THEN
      RAISE EXCEPTION 'El comercio todavía no está aprobado para recibir pedidos.';
    END IF;
    IF v_merchant.subscription_status = 'expired'
      OR (v_merchant.plan = 'trial' AND (v_merchant.trial_end IS NULL OR v_merchant.trial_end <= NOW()))
      OR (v_merchant.plan = 'pro' AND (v_merchant.subscription_end IS NULL OR v_merchant.subscription_end <= NOW())) THEN
      RAISE EXCEPTION 'La suscripción del comercio venció y no puede recibir pedidos.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_merchant_order_subscription ON public.orders;
CREATE TRIGGER enforce_merchant_order_subscription
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_merchant_order_subscription();

-- 6. TABLA DE MENSAJERÍA CONTEXTUAL POR ORDEN
CREATE TABLE IF NOT EXISTS public.order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  sender_name TEXT,
  sender_role TEXT,
  channel TEXT CHECK (channel IN ('client_merchant', 'client_rider', 'merchant_rider')) NOT NULL,
  message TEXT,
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. POLÍTICAS DE SEGURIDAD RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles:
DROP POLICY IF EXISTS "Perfiles legibles por usuarios autenticados" ON public.profiles;
CREATE POLICY "Perfiles legibles por usuarios autenticados" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Cada usuario puede actualizar su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios y Administradores pueden actualizar perfiles" ON public.profiles;
CREATE POLICY "Usuarios y Administradores pueden actualizar perfiles" ON public.profiles
  FOR UPDATE TO authenticated 
  USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Administradores pueden eliminar perfiles" ON public.profiles;
CREATE POLICY "Administradores pueden eliminar perfiles" ON public.profiles
  FOR DELETE TO authenticated 
  USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para orders:
DROP POLICY IF EXISTS "Ver órdenes participantes o disponibles" ON public.orders;
CREATE POLICY "Ver órdenes participantes o disponibles" ON public.orders
  FOR SELECT TO authenticated
  USING (
    auth.uid() = client_id OR 
    auth.uid() = rider_id OR 
    (rider_id IS NULL AND status = 'pending') OR
    merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Crear órdenes para usuarios autenticados" ON public.orders;
CREATE POLICY "Crear órdenes para usuarios autenticados" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Actualizar órdenes involucradas" ON public.orders;
CREATE POLICY "Actualizar órdenes involucradas" ON public.orders
  FOR UPDATE TO authenticated USING (true);

-- Políticas públicas para lectura y gestión de comercios
DROP POLICY IF EXISTS "Comercios públicos" ON public.merchants;
CREATE POLICY "Comercios públicos" ON public.merchants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Dueños y Administradores pueden actualizar comercios" ON public.merchants;
CREATE POLICY "Dueños y Administradores pueden actualizar comercios" ON public.merchants
  FOR UPDATE TO authenticated 
  USING (
    owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Administradores pueden eliminar comercios" ON public.merchants;
CREATE POLICY "Administradores pueden eliminar comercios" ON public.merchants
  FOR DELETE TO authenticated 
  USING (
    owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Productos públicos" ON public.products;
CREATE POLICY "Productos públicos" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Comerciantes y Admins pueden insertar productos" ON public.products;
CREATE POLICY "Comerciantes y Admins pueden insertar productos" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.merchants
      WHERE id = merchant_id AND (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

DROP POLICY IF EXISTS "Comerciantes y Admins pueden actualizar productos" ON public.products;
CREATE POLICY "Comerciantes y Admins pueden actualizar productos" ON public.products
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = products.merchant_id AND (m.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = products.merchant_id AND (m.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

DROP POLICY IF EXISTS "Comerciantes y Admins pueden eliminar productos" ON public.products;
CREATE POLICY "Comerciantes y Admins pueden eliminar productos" ON public.products
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = products.merchant_id AND (m.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

-- 8. PERMISOS Y PRIVILEGIOS GLOBALES
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
REVOKE UPDATE ON public.merchants FROM anon, authenticated;
GRANT UPDATE (name, category, address, phone, banner_url, delivery_time, delivery_fee, payment_methods, payment_config)
  ON public.merchants TO authenticated;

-- 9. HABILITAR PUBLICACIÓN REALTIME (Idempotente: verifica si ya están añadidas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'merchants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.merchants;
  END IF;
END $$;

-- 10. Promover una cuenta administradora existente sin crear ni resetear credenciales
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE LOWER(email) = 'edurock721@gmail.com';

  IF v_admin_id IS NOT NULL THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"admin"')
    WHERE id = v_admin_id;

    INSERT INTO public.profiles (id, email, full_name, first_name, last_name, phone, role, is_verified)
    VALUES (v_admin_id, 'edurock721@gmail.com', 'Eduardo Administrador', 'Eduardo', 'Administrador', '0414-0000000', 'admin', TRUE)
    ON CONFLICT (id) DO UPDATE SET role = 'admin', is_verified = TRUE, updated_at = NOW();
  END IF;
END $$;


