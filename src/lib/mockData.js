import { exchangeRateService } from './exchangeRate';

export const BCV_EXCHANGE_RATE = 884.75; // Real official BCV rate (auto-updated via DolarAPI)

export const INITIAL_PROFILES = [
  {
    id: "user-client-1",
    full_name: "Carlos Mendoza",
    phone: "0414-5551234",
    role: "client",
    wallet_balance: 15.00,
    is_verified: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: "user-merchant-1",
    full_name: "Roberto Da Silva (El Rincón Llanero)",
    phone: "0424-9876543",
    role: "merchant",
    wallet_balance: 85.50,
    is_verified: true,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: "user-rider-1",
    full_name: "Yordanis 'Flash' Gómez (Bera SBR 150)",
    phone: "0412-3334455",
    role: "rider",
    wallet_balance: 32.50,
    is_verified: true,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString()
  },
  {
    id: "user-admin-1",
    full_name: "Admin Central MÁNDALO!",
    phone: "0416-0001122",
    role: "admin",
    wallet_balance: 245.00,
    is_verified: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString()
  }
];

export const INITIAL_MERCHANTS = [
  {
    id: "merch-1",
    owner_id: "user-merchant-1",
    name: "El Rincón Llanero - Burgers & Grill",
    category: "Comida Rápida",
    address: "Av. Bolívar c/c Calle 4, Centro",
    phone: "0424-9876543",
    banner_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=900&auto=format&fit=crop&q=80",
    rating: 4.9,
    delivery_time: "20-30 min",
    delivery_fee: 1.50,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: "merch-2",
    owner_id: "user-merchant-2",
    name: "Farmacia San José Express",
    category: "Salud & Farmacia",
    address: "Calle Comercio frente a la Plaza Mayor",
    phone: "0412-7778899",
    banner_url: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=900&auto=format&fit=crop&q=80",
    rating: 4.8,
    delivery_time: "15-25 min",
    delivery_fee: 1.20,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 9).toISOString()
  },
  {
    id: "merch-3",
    owner_id: "user-merchant-3",
    name: "Bodegón & Licorería Los Médanos",
    category: "Licores & Snacks",
    address: "Sector El Silencio, local 2B",
    phone: "0414-1112233",
    banner_url: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=900&auto=format&fit=crop&q=80",
    rating: 4.7,
    delivery_time: "15-20 min",
    delivery_fee: 1.50,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: "merch-4",
    owner_id: "user-merchant-4",
    name: "Panadería y Pastelería La Espiga Real",
    category: "Panadería & Café",
    address: "Av. Independencia, diagonal a la Alcaldía",
    phone: "0426-4445566",
    banner_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&auto=format&fit=crop&q=80",
    rating: 4.9,
    delivery_time: "20-35 min",
    delivery_fee: 1.50,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString()
  }
];

export const INITIAL_PRODUCTS = [
  // El Rincón Llanero
  {
    id: "prod-1",
    merchant_id: "merch-1",
    name: "Hamburguesa Doble Especial Llanera",
    description: "Carne artesanal 300g, queso de mano fundido, tocineta crujiente, vegetales frescos y salsa especial de la casa.",
    price: 6.50,
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
    is_available: true
  },
  {
    id: "prod-2",
    merchant_id: "merch-1",
    name: "Pepito Mixto Gratinado 30cm",
    description: "Lomito de res y pechuga de pollo salteada al grill, queso amarillo fundido y lluvia de papitas crujientes.",
    price: 8.00,
    image_url: "https://images.unsplash.com/photo-1627042633706-0150c083d849?w=600&auto=format&fit=crop&q=80",
    is_available: true
  },
  {
    id: "prod-3",
    merchant_id: "merch-1",
    name: "Papas Rústicas con Queso Cheddar & Bacon",
    description: "Porción generosa de papas fritas crocantes bañadas en cheddar líquido y tocineta picadita.",
    price: 3.50,
    image_url: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80",
    is_available: true
  },
  {
    id: "prod-4",
    merchant_id: "merch-1",
    name: "Refresco 1.5L (Coca Cola / Pepsi)",
    description: "Bien frío para compartir.",
    price: 2.00,
    image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
    is_available: true
  },

  // Farmacia San José
  {
    id: "prod-5",
    merchant_id: "merch-2",
    name: "Acetaminofén 500mg (Caja 10 tabletas)",
    description: "Alivio rápido para dolor de cabeza y fiebre.",
    price: 1.80,
    image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
    is_available: true
  },
  {
    id: "prod-6",
    merchant_id: "merch-2",
    name: "Suero Oral Electrolitos Sabor Manzana",
    description: "Hidratación inmediata formulada por la OMS.",
    price: 2.20,
    image_url: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=600&auto=format&fit=crop&q=80",
    is_available: true
  },
  {
    id: "prod-7",
    merchant_id: "merch-2",
    name: "Alcohol Antiséptico 70% 500ml",
    description: "Desinfectante multiuso de grado médico.",
    price: 2.50,
    image_url: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=600&auto=format&fit=crop&q=80",
    is_available: true
  },

  // Bodegón Los Médanos
  {
    id: "prod-8",
    merchant_id: "merch-3",
    name: "Pack 6 Cervezas Polar Pilsen Lata 355ml",
    description: "La popular Polar Negra bien fría con bolsa de hielo.",
    price: 6.00,
    image_url: "https://images.unsplash.com/photo-1608270546103-9755490a1841?w=600&auto=format&fit=crop&q=80",
    is_available: true
  },
  {
    id: "prod-9",
    merchant_id: "merch-3",
    name: "Ron Santa Teresa Gran Reserva 0.75L",
    description: "Ron añejo venezolano de categoría mundial.",
    price: 9.50,
    image_url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80",
    is_available: true
  },

  // Panadería La Espiga Real
  {
    id: "prod-10",
    merchant_id: "merch-4",
    name: "Combo 2 Canillas + 1 Pan Campesino",
    description: "Recién salido del horno a leña, corteza crujiente y miga suave.",
    price: 2.50,
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
    is_available: true
  },
  {
    id: "prod-11",
    merchant_id: "merch-4",
    name: "Golfeados con Queso de Mano (2 unidades)",
    description: "Bañados con melao de papelón auténtico y anís dulce.",
    price: 3.50,
    image_url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80",
    is_available: true
  }
];

export const INITIAL_ORDERS = [
  {
    id: "ord-101",
    order_type: "store_purchase",
    client_id: "user-client-1",
    client_name: "Carlos Mendoza",
    client_phone: "0414-5551234",
    merchant_id: "merch-1",
    merchant_name: "El Rincón Llanero",
    merchant_address: "Av. Bolívar c/c Calle 4, Centro",
    rider_id: "user-rider-1",
    rider_name: "Yordanis 'Flash' Gómez",
    rider_phone: "0412-3334455",
    status: "preparing",
    items: [
      {
        id: "prod-1",
        name: "Hamburguesa Doble Especial Llanera",
        price: 6.50,
        quantity: 1,
        note: "Sin cebolla, salsa tártara extra"
      },
      {
        id: "prod-3",
        name: "Papas Rústicas con Queso Cheddar & Bacon",
        price: 3.50,
        quantity: 1
      },
      {
        id: "prod-4",
        name: "Refresco 1.5L (Coca Cola)",
        price: 2.00,
        quantity: 1
      }
    ],
    subtotal: 12.00,
    delivery_address: "Urb. Las Acacias, Manzana D, Casa #24 (portón verde)",
    delivery_fee: 1.50,
    platform_fee: 0.50,
    total: 14.00,
    payment_method: "pago_movil",
    payment_receipt_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    pago_movil_ref: "REF-849201",
    passenger_count: 0,
    cargo_size: "small",
    notes: "Entregar en puerta principal",
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  },
  {
    id: "ord-102",
    order_type: "mandadito",
    client_id: "user-client-1",
    client_name: "Carlos Mendoza",
    client_phone: "0414-5551234",
    merchant_id: null,
    merchant_name: null,
    merchant_address: null,
    rider_id: null, // Available in rider radar!
    rider_name: null,
    status: "pending",
    pickup_address: "Agencia MRW Casco Central, taquilla 3 (Preguntar por guía #44921)",
    delivery_address: "Edificio Don Pedro, Piso 3, Apto 3-B",
    task_description: "Retirar encomienda pequeña pagada a nombre de Carlos Mendoza y traerla al apartamento.",
    passenger_count: 0,
    cargo_size: "small",
    notes: "Sobre de manila ligero",
    purchase_budget: 0.00,
    subtotal: 0.00,
    delivery_fee: 2.00,
    platform_fee: 0.50,
    total: 2.50,
    payment_method: "cash_usd",
    payment_receipt_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 7).toISOString()
  },
  {
    id: "ord-103",
    order_type: "ride",
    client_id: "user-client-1",
    client_name: "Carlos Mendoza",
    client_phone: "0414-5551234",
    merchant_id: null,
    merchant_name: null,
    merchant_address: null,
    rider_id: null, // Available in radar!
    rider_name: null,
    status: "pending",
    pickup_address: "Plaza Bolívar, Casco Central frente a la Catedral",
    delivery_address: "Centro Comercial Las Américas, Entrada Principal",
    task_description: "Traslado de 2 pasajeros hacia el Centro Comercial",
    passenger_count: 2,
    cargo_size: "small",
    notes: "Vamos 2 personas con morral ligero",
    purchase_budget: 0.00,
    subtotal: 0.00,
    delivery_fee: 3.50,
    platform_fee: 0.50,
    total: 4.00,
    payment_method: "cash_usd",
    payment_receipt_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString()
  },
  {
    id: "ord-104",
    order_type: "mandadito",
    client_id: "user-client-1",
    client_name: "Carlos Mendoza",
    client_phone: "0414-5551234",
    merchant_id: null,
    merchant_name: null,
    merchant_address: null,
    rider_id: null, // Available in radar!
    rider_name: null,
    status: "pending",
    pickup_address: "Distribuidora de Repuestos El Éxito, Galpón 4",
    delivery_address: "Taller Mecánico Hermanos Díaz, Calle 8 con Av. 3",
    task_description: "Traslado de 2 baterías pesadas y repuestos mecánicos en caja grande",
    passenger_count: 0,
    cargo_size: "heavy",
    notes: "Caja pesada aprox 25kg, recomendado para carro o maletero espacioso",
    purchase_budget: 0.00,
    subtotal: 0.00,
    delivery_fee: 6.00,
    platform_fee: 0.50,
    total: 6.50,
    payment_method: "pago_movil",
    payment_receipt_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 1).toISOString()
  }
];

export const INITIAL_MESSAGES = [
  {
    id: "msg-1",
    order_id: "ord-101",
    sender_id: "user-client-1",
    sender_name: "Carlos Mendoza",
    sender_role: "client",
    channel: "client_merchant",
    message: "¡Hola! Por favor recuerden enviar salsa tártara extra en un envase aparte.",
    media_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: "msg-2",
    order_id: "ord-101",
    sender_id: "user-merchant-1",
    sender_name: "El Rincón Llanero",
    sender_role: "merchant",
    channel: "client_merchant",
    message: "¡Buenas noches Carlos! Claro que sí, ya lo anotamos en cocina. En 10 minutos sale con el rider.",
    media_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 13).toISOString()
  },
  {
    id: "msg-3",
    order_id: "ord-101",
    sender_id: "user-rider-1",
    sender_name: "Yordanis 'Flash' Gómez",
    sender_role: "rider",
    channel: "merchant_rider",
    message: "Hermano, estoy en la esquina del banco. Llego al local en 2 minutos para retirar la orden #101.",
    media_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 6).toISOString()
  },
  {
    id: "msg-4",
    order_id: "ord-101",
    sender_id: "user-merchant-1",
    sender_name: "El Rincón Llanero",
    sender_role: "merchant",
    channel: "merchant_rider",
    message: "Listo Yordanis, ya está empacada en la bolsa térmica. Te esperamos.",
    media_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString()
  },
  {
    id: "msg-5",
    order_id: "ord-101",
    sender_id: "user-rider-1",
    sender_name: "Yordanis 'Flash' Gómez",
    sender_role: "rider",
    channel: "client_rider",
    message: "¡Hola Carlos! Ya voy a retirar tu pedido en El Rincón Llanero. ¿Tu casa tiene algún timbre o referencia?",
    media_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString()
  }
];

export const SUPABASE_SQL_SCHEMA = `-- =========================================================
-- ESPECIFICACIÓN MAESTRA DE BASE DE DATOS: "MÁNDALO!"
-- Supabase PostgreSQL 15+ compatible con RLS y Realtime
-- =========================================================

-- Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Perfiles de usuario vinculados al Auth de Supabase
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT CHECK (role IN ('client', 'merchant', 'rider', 'admin')) DEFAULT 'client',
  wallet_balance NUMERIC(10, 2) DEFAULT 0.00,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Comercios aliados
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  banner_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Catálogo de productos por comercio
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Órdenes unificadas: Compras en Comercios, Mandaditos y Carreras
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type TEXT CHECK (order_type IN ('store_purchase', 'mandadito', 'ride')) NOT NULL DEFAULT 'store_purchase',
  client_id UUID REFERENCES profiles(id) NOT NULL,
  merchant_id UUID REFERENCES merchants(id), -- NULL en mandaditos y carreras
  rider_id UUID REFERENCES profiles(id),     -- Asignado al aceptar
  status TEXT CHECK (status IN ('pending', 'accepted', 'preparing', 'ready_for_pickup', 'on_way', 'delivered', 'cancelled')) DEFAULT 'pending',
  
  -- Campos exclusivos de Compras en Comercios
  items JSONB, 
  subtotal NUMERIC(10, 2) DEFAULT 0.00,
  
  -- Campos de Mandaditos y Carreras
  pickup_address TEXT,
  task_description TEXT,
  purchase_budget NUMERIC(10, 2) DEFAULT 0.00,

  -- Especificaciones de carga y pasajeros (Decisión del conductor)
  passenger_count INT DEFAULT 1,
  cargo_size TEXT CHECK (cargo_size IN ('small', 'medium', 'heavy')) DEFAULT 'small',
  notes TEXT,
  
  -- Logística y cobros comunes
  delivery_address TEXT NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL,
  platform_fee NUMERIC(10, 2) DEFAULT 0.50,
  payment_method TEXT CHECK (payment_method IN ('pago_movil', 'cash_usd', 'cash_bs')) NOT NULL,
  payment_receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migración para bases de datos existentes:
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS passenger_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cargo_size TEXT CHECK (cargo_size IN ('small', 'medium', 'heavy')) DEFAULT 'small',
  ADD COLUMN IF NOT EXISTS notes TEXT;

GRANT ALL ON TABLE orders TO anon, authenticated;
GRANT ALL ON TABLE profiles TO anon, authenticated;

-- 5. Mensajería contextual por orden
CREATE TABLE IF NOT EXISTS order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  channel TEXT CHECK (channel IN ('client_merchant', 'client_rider', 'merchant_rider')) NOT NULL,
  message TEXT,
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar rendimiento de Realtime y consultas
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_rider ON orders(rider_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON order_messages(order_id);

-- Activar Realtime en tablas críticas
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- Políticas de Seguridad RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

-- Políticas públicas de lectura para catálogos y perfiles
CREATE POLICY "Public profiles can be viewed" ON profiles FOR SELECT USING (true);
CREATE POLICY "Active merchants can be viewed by all" ON merchants FOR SELECT USING (is_active = true);
CREATE POLICY "Available products can be viewed by all" ON products FOR SELECT USING (is_available = true);

-- Políticas de órdenes: Cliente ve sus órdenes, Rider ve asignadas y pendientes, Comercio ve las suyas
CREATE POLICY "Clients see their own orders" ON orders FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Merchants see their orders" ON orders FOR SELECT USING (
  merchant_id IN (SELECT id FROM merchants WHERE owner_id = auth.uid())
);
CREATE POLICY "Riders see assigned or available orders" ON orders FOR SELECT USING (
  rider_id = auth.uid() OR rider_id IS NULL
);

-- Mensajería: Solo participantes del canal de la orden pueden leer y escribir
CREATE POLICY "Order participants can read messages" ON order_messages FOR SELECT USING (
  order_id IN (
    SELECT id FROM orders WHERE 
      client_id = auth.uid() OR 
      rider_id = auth.uid() OR 
      merchant_id IN (SELECT id FROM merchants WHERE owner_id = auth.uid())
  )
);
`;
