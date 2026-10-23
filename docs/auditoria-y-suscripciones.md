# Auditoría técnica y modelo de suscripciones de Mandalo

## Resumen

Mandalo es una SPA React/Vite que usa Supabase Auth cuando está configurado y `localStorage` como almacén demo. El registro de comercio pasa por `auth.users`, inserta un perfil y crea su tienda en `public.merchants` mediante el trigger `handle_new_user`.

El bug de Admin ocurría porque la consulta remota sí obtenía los perfiles, pero `localStore.updateProfile` solo actualizaba IDs existentes; los perfiles nuevos no se insertaban. Admin derivaba sus listas de ese almacén local. Ahora `updateProfile` hace upsert y Admin sincroniza perfiles/tiendas tanto al montar como por Realtime.

## Flujos actuales

- **Usuarios y clientes:** `Register` llama `AuthContext.signUp`, que crea el usuario de Supabase y guarda los datos del rol en metadata. El trigger crea `profiles`. `App.jsx` enruta por rol. Los clientes se verifican automáticamente.
- **Comercios:** el trigger crea `profiles.role='merchant'`, `is_verified=false` y una fila `merchants` por `owner_id`, con `plan='trial'`, estado `active`, `verified=false` y trial de 30 días. Admin filtra perfiles merchant pendientes y sincroniza aprobación con la tienda mediante `admin_set_merchant_verified`. El Dashboard busca la tienda del usuario actual por `owner_id`.
- **Repartidores:** el trigger registra datos del perfil y los deja pendientes. `ProtectedRoute` muestra revisión hasta la aprobación. El flujo operativo consume el almacén local.
- **Pedidos:** carrito y formularios crean pedidos con `localStore.createOrder`; vistas de comercio y rider actualizan `localStorage`. Aunque existe `public.orders`, el flujo actual no inserta/actualiza allí.
- **Pagos:** ya no hay procesamiento de pagos, referencias, comprobantes, comisión de plataforma ni saldos. El comercio configura medios/datos en `merchants.payment_methods/payment_config`; la app los muestra y avisa que el pago se coordina directamente.

## Estados y planes

`pending/pendiente` significa que falta aprobación: perfil `is_verified=false`, tienda `verified=false`. `approved/aprobado/verified` significa aprobación administrativa. `active/activo` se separa en `merchants.is_active` (habilitación operativa) y `subscription_status` (vigencia del plan). No deben confundirse.

Planes: Trial de 30 días con funciones completas y destacados; Free con hasta 10 productos; Pro sugerido a USD $9.99/mes con catálogo ilimitado, prioridad y estadísticas avanzadas. Free no expira. Al vencer Trial/Pro, comercio y catálogo siguen visibles, pero se bloquean nuevos pedidos y se muestra el aviso de renovación. La renovación Pro se gestiona fuera de Mandalo.

## Esquema y relaciones

- `auth.users` 1:1 `public.profiles`.
- `profiles` 1:0..1 `merchants` por `owner_id` único.
- `merchants` 1:N `products`.
- `profiles` (cliente/rider) y `merchants` se referencian desde `orders`.
- `orders` 1:N `order_messages`.

Estados de orden: `pending`, `accepted`, `preparing`, `ready_for_pickup`, `on_way`, `delivered`, `cancelled`.

El esquema agrega plan, fechas, medios/configuración de pago, trial, validación administrativa, RPC de aprobación, protección contra autoasignación de rol, límite SQL de 10 productos Free, bloqueo SQL de pedidos vencidos, publicación Realtime de `merchants` y restricciones RLS del catálogo. Elimina `wallet_balance`, `platform_fee`, `payment_method`, `payment_receipt_url` y `pago_movil_ref`. Se quitó la contraseña fija del administrador; el SQL no crea ni resetea credenciales.

## Riesgos y siguientes pasos

1. Aplicar `supabase/schema.sql` en Supabase con backup. El índice único de propietario puede fallar si existen dueños duplicados.
2. Migrar órdenes del `localStorage` a Supabase. Mientras las vistas no escriban allí, el trigger SQL de vencimiento no se ejecuta sobre sus pedidos.
3. La política de `UPDATE` de órdenes aún permite cambios demasiado amplios; debe limitarse por participante y transición antes de persistir pedidos.
4. `payment_config` incluye cédula y datos bancarios mostrados al público; publicar solo con consentimiento expreso del comercio.
5. Suscripciones Pro no se cobran desde Mandalo y su renovación es externa por diseño.

## Cambios

Modificados: `src/components/CartModal.jsx`, `src/components/ClientView.jsx`, `src/components/ContextualChatModal.jsx`, `src/components/ImageCompressorModal.jsx`, `src/components/MerchantView.jsx`, `src/components/RoleSwitcher.jsx`, `src/components/RiderView.jsx`, `src/components/SupabaseConfigModal.jsx`, `src/context/AuthContext.jsx`, `src/lib/mockData.js`, `src/lib/supabase.js`, `src/pages/Admin/AdminPortal.jsx`, `src/pages/Client/Home.jsx`, `src/pages/Merchant/Dashboard.jsx`, `src/pages/Rider/DeliveryPool.jsx`, `supabase/schema.sql`.

Nuevo: `src/lib/merchantSubscription.js`.

Eliminado: `src/components/AdminView.jsx` (recargas, comisiones y saldos).
