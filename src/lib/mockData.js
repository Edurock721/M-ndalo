import { exchangeRateService } from './exchangeRate';

export const BCV_EXCHANGE_RATE = 884.75; // Real official BCV rate (auto-updated via DolarAPI)

export const INITIAL_PROFILES = [
  {
    id: "user-client-1",
    full_name: "Carlos Mendoza",
    phone: "0414-5551234",
    role: "client",
    is_verified: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: "user-merchant-1",
    full_name: "Roberto Da Silva (El Rincón Llanero)",
    phone: "0424-9876543",
    role: "merchant",
    is_verified: true,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: "user-rider-1",
    full_name: "Yordanis 'Flash' Gómez (Bera SBR 150)",
    phone: "0412-3334455",
    role: "rider",
    is_verified: true,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString()
  },
  {
    id: "user-admin-1",
    full_name: "Admin Central MÁNDALO!",
    phone: "0416-0001122",
    role: "admin",
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
    verified: true,
    plan: "pro",
    subscription_status: "active",
    subscription_end: new Date(Date.now() + 86400000 * 30).toISOString(),
    payment_methods: { cash: true, pagoMovil: true, transferencia: true, divisas: true, contraEntrega: true },
    payment_config: { titular: "Roberto Da Silva", cedula: "V-12345678", telefonoPagoMovil: "0424-9876543", banco: "Banesco", numeroCuenta: "", aceptaDivisas: true },
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
    verified: true,
    plan: "trial",
    subscription_status: "active",
    trial_start: new Date(Date.now() - 86400000 * 5).toISOString(),
    trial_end: new Date(Date.now() + 86400000 * 25).toISOString(),
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
    verified: true,
    plan: "free",
    subscription_status: "active",
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
    verified: true,
    plan: "pro",
    subscription_status: "active",
    subscription_end: new Date(Date.now() + 86400000 * 30).toISOString(),
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
    total: 13.50,
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
    total: 2.00,
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
    total: 3.50,
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
    total: 6.00,
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

