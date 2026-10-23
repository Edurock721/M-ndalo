import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localStore } from '../../lib/supabase';
import { exchangeRateService } from '../../lib/exchangeRate';
import { ClientView } from '../../components/ClientView';
import { CartModal } from '../../components/CartModal';
import { ContextualChatModal } from '../../components/ContextualChatModal';
import { 
  ShoppingCart, 
  Package, 
  Car, 
  Wallet, 
  LogOut, 
  Sparkles, 
  TrendingUp,
  MapPin,
  Bell
} from 'lucide-react';

export function Home() {
  const { user, profile, signOut } = useAuth();

  // Suscribirse al store reactivo de órdenes y productos
  const [storeState, setStoreState] = useState(() => ({
    merchants: localStore.merchants,
    products: localStore.products,
    orders: localStore.orders,
    messages: localStore.messages
  }));

  const [rateData, setRateData] = useState(() => ({
    rate: exchangeRateService.rate,
    lastUpdated: exchangeRateService.lastUpdated
  }));

  const [cart, setCart] = useState([]);
  const [activeCartMerchant, setActiveCartMerchant] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [activeChatOrder, setActiveChatOrder] = useState(null);

  useEffect(() => {
    const unsubStore = localStore.subscribe(() => {
      setStoreState({
        merchants: [...localStore.merchants],
        products: [...localStore.products],
        orders: [...localStore.orders],
        messages: [...localStore.messages]
      });
    });

    const unsubRate = exchangeRateService.subscribe((data) => {
      setRateData({ ...data });
    });

    return () => {
      unsubStore();
      unsubRate();
    };
  }, []);

  // Adaptar usuario activo combinando Supabase Auth y profile
  const activeUser = {
    id: user?.id || 'client-1',
    name: profile?.full_name || user?.user_metadata?.full_name || 'Cliente Mándalo',
    phone: profile?.phone || user?.user_metadata?.phone || '0414-0000000',
    role: 'client',
    walletBalance: Number(profile?.wallet_balance ?? 25.50),
    isVerified: true
  };

  const currentRate = rateData.rate;
  const balanceUSD = activeUser.walletBalance;
  const balanceBs = (balanceUSD * currentRate).toFixed(2);

  // Funciones de Carrito
  const handleAddToCart = (product, merchant, note = '') => {
    if (activeCartMerchant && activeCartMerchant.id !== merchant.id && cart.length > 0) {
      if (!confirm(`Tienes productos de ${activeCartMerchant.name}. ¿Deseas vaciar el carrito para comprar en ${merchant.name}?`)) {
        return;
      }
      setCart([]);
    }
    setActiveCartMerchant(merchant);

    setCart((prev) => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1, note: note || i.note } : i);
      }
      return [...prev, { ...product, quantity: 1, note }];
    });
  };

  const handleUpdateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(i => i.id !== productId));
      return;
    }
    setCart(prev => prev.map(i => i.id === productId ? { ...i, quantity: newQuantity } : i));
  };

  const handleRemoveCartItem = (productId) => {
    setCart(prev => prev.filter(i => i.id !== productId));
  };

  const handleCheckout = (orderData) => {
    localStore.createOrder({
      ...orderData,
      client_id: activeUser.id,
      client_name: activeUser.name,
      client_phone: activeUser.phone
    });
    setCart([]);
    setShowCartModal(false);
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#090D16] text-white pb-12">
      {/* 1. Header superior del Cliente - Espaciado Profesional y Tasa BCV Visible */}
      <header className="sticky top-0 z-30 bg-[#0B101E]/95 backdrop-blur-md border-b border-gray-800/80 px-4 sm:px-8 py-3.5 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo y Saludo */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-black text-white shadow-lg shadow-orange-500/25 flex-shrink-0">
              M!
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs text-orange-400 font-extrabold uppercase tracking-wider">Cliente</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <h2 className="text-sm sm:text-lg font-black text-white tracking-tight truncate max-w-[130px] sm:max-w-xs">
                ¡Hola, {activeUser.name.split(' ')[0]}! 👋
              </h2>
            </div>
          </div>

          {/* Tasa BCV y Acciones Distribuidas con Ergonomía Amplia */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Tasa Oficial BCV - Diseñada para Móvil y PC */}
            <div 
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs sm:text-sm shadow-sm"
              title="Tasa Oficial del Banco Central de Venezuela auto-actualizada"
            >
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />
              <span className="text-gray-400 hidden md:inline font-medium text-xs">Tasa BCV:</span>
              <span className="font-mono font-black text-amber-400 text-xs sm:text-sm">
                Bs. {currentRate.toFixed(2)}
              </span>
            </div>

            {/* Botón Carrito Prominente y Fácil de Identificar en Móvil y PC */}
            <button
              onClick={() => setShowCartModal(true)}
              className="relative px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/35 hover:shadow-orange-500/50 hover:scale-[1.03] active:scale-95 transition-all cursor-pointer flex items-center gap-2 border border-white/20 min-h-[44px]"
              title="Ver Carrito de Compras"
            >
              <ShoppingCart className="w-5 h-5 flex-shrink-0 text-white" strokeWidth={2.4} />
              <span className="text-xs sm:text-sm font-black text-white tracking-tight">Carrito</span>
              {totalCartItems > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white text-orange-600 text-xs font-black flex items-center justify-center shadow-md animate-pulse min-w-[20px]">
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* Botón Salir Grande y Fácil de Tocar */}
            <button
              onClick={() => signOut()}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-red-300 hover:text-white text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 min-h-[44px]"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5 text-red-400 flex-shrink-0" strokeWidth={2.3} />
              <span className="text-xs sm:text-sm font-black">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero con Saldo y Tarjeta de Bienvenida con Distribución Ejecutiva */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-4 sm:pt-8 sm:pb-6">
        <div className="bg-gradient-to-r from-[#17233D] via-[#141E34] to-[#101728] border border-orange-500/25 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold text-orange-400 uppercase tracking-wider mb-2">
                <Wallet className="w-4 h-4" /> Tu Billetera Mándalo
              </div>
              <div className="flex items-baseline flex-wrap gap-2.5 sm:gap-3">
                <span className="text-2xl sm:text-4xl font-black text-white font-mono">
                  ${balanceUSD.toFixed(2)}
                </span>
                <span className="text-sm sm:text-base text-gray-300 font-mono font-bold">
                  ≈ {balanceBs} Bs.
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 mt-2 max-w-xl leading-relaxed">
                Disponible para compras en comercios locales aliados, mandaditos express y traslados particulares.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Tasa BCV: <strong>Bs. {currentRate.toFixed(2)}</strong></span>
              </div>
              <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Cuenta Verificada
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Vista Completa del Cliente */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-16">
        <ClientView
          merchants={storeState.merchants}
          products={storeState.products}
          orders={storeState.orders}
          currentUser={activeUser}
          onAddToCart={handleAddToCart}
          onCreateOrder={(data) => localStore.createOrder(data)}
          onOpenChat={(order) => setActiveChatOrder(order)}
          exchangeRate={currentRate}
        />
      </div>

      {/* Botón Flotante Inferior de Carrito para Móvil cuando hay productos */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden animate-slide-up">
          <button
            onClick={() => setShowCartModal(true)}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white font-black text-sm flex items-center justify-between px-4 shadow-2xl shadow-orange-500/60 border border-white/30 active:scale-98 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white text-orange-600 flex items-center justify-center shadow-sm flex-shrink-0">
                <ShoppingCart size={20} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black leading-tight text-white">Ver Carrito</span>
                <span className="block text-[11px] text-orange-100 font-medium">
                  {totalCartItems} {totalCartItems === 1 ? 'producto agregado' : 'productos agregados'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black font-mono text-white">
                ${cart.reduce((acc, it) => acc + it.price * it.quantity, 0).toFixed(2)}
              </span>
              <span className="text-xs bg-white/25 px-2.5 py-1 rounded-lg font-bold">Pagar →</span>
            </div>
          </button>
        </div>
      )}

      {/* Modales */}
      {showCartModal && (
        <CartModal
          cart={cart}
          merchant={activeCartMerchant}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onCheckout={handleCheckout}
          onClose={() => setShowCartModal(false)}
          currentUser={activeUser}
          exchangeRate={currentRate}
        />
      )}

      {activeChatOrder && (
        <ContextualChatModal
          order={activeChatOrder}
          currentUser={activeUser}
          messages={storeState.messages}
          onSendMessage={(msg) => localStore.sendMessage(msg)}
          onClose={() => setActiveChatOrder(null)}
        />
      )}
    </div>
  );
}

export default Home;
