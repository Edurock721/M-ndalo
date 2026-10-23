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

  -- Validación y saldo
  is_verified BOOLEAN DEFAULT FALSE,
  wallet_balance NUMERIC(12, 2) DEFAULT 0.00,
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
    wallet_balance,
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
    0.00,
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
      is_active
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'merchant_name', v_full_name),
      COALESCE(new.raw_user_meta_data->>'merchant_category', 'Comercio General'),
      COALESCE(new.raw_user_meta_data->>'address', 'Sin dirección especificada'),
      COALESCE(new.raw_user_meta_data->>'phone', 'Sin teléfono'),
      FALSE -- Se activa cuando el administrador valida y aprueba el comercio
    )
    ON CONFLICT DO NOTHING;
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  platform_fee NUMERIC(10, 2) DEFAULT 0.50,
  total NUMERIC(10, 2) NOT NULL,

  -- Pagos y comprobantes
  payment_method TEXT CHECK (payment_method IN ('pago_movil', 'cash_usd', 'cash_bs')) NOT NULL DEFAULT 'pago_movil',
  payment_receipt_url TEXT,
  pago_movil_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('merchant', 'admin'))
  );

DROP POLICY IF EXISTS "Comerciantes y Admins pueden actualizar productos" ON public.products;
CREATE POLICY "Comerciantes y Admins pueden actualizar productos" ON public.products
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('merchant', 'admin'))
  );

DROP POLICY IF EXISTS "Comerciantes y Admins pueden eliminar productos" ON public.products;
CREATE POLICY "Comerciantes y Admins pueden eliminar productos" ON public.products
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('merchant', 'admin'))
  );

-- 8. PERMISOS Y PRIVILEGIOS GLOBALES
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

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
END $$;

-- ==============================================================================
-- 10. CREACIÓN / ACTUALIZACIÓN AUTOMÁTICA DEL ADMINISTRADOR (edurock721@gmail.com)
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  v_admin_id UUID;
  v_pass TEXT := 'Admin123456*'; -- Clave asignada para el administrador
BEGIN
  -- Buscar si el usuario ya existe en auth.users
  SELECT id INTO v_admin_id FROM auth.users WHERE LOWER(email) = 'edurock721@gmail.com';

  IF v_admin_id IS NULL THEN
    v_admin_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id,
      'authenticated',
      'authenticated',
      'edurock721@gmail.com',
      crypt(v_pass, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Eduardo Administrador","role":"admin"}',
      NOW(),
      NOW()
    );
  ELSE
    -- Si ya existe, actualizarle la contraseña y confirmar email
    UPDATE auth.users
    SET encrypted_password = crypt(v_pass, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"admin"')
    WHERE id = v_admin_id;
  END IF;

  -- Asegurar el registro en public.profiles con rol 'admin' y verificado
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    phone,
    role,
    is_verified,
    wallet_balance,
    created_at,
    updated_at
  ) VALUES (
    v_admin_id,
    'edurock721@gmail.com',
    'Eduardo Administrador',
    'Eduardo',
    'Administrador',
    '0414-0000000',
    'admin',
    TRUE,
    1000.00,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = 'edurock721@gmail.com',
    role = 'admin',
    is_verified = TRUE,
    updated_at = NOW();

END $$;


