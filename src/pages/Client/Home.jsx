import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localStore } from '../../lib/supabase';
import { exchangeRateService } from '../../lib/exchangeRate';
import { ClientView } from '../../components/ClientView';
import { CartModal } from '../../components/CartModal';
import { ContextualChatModal } from '../../components/ContextualChatModal';
import { 
  ShoppingBag, 
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
      {/* 1. Header superior del Cliente */}
      <header className="sticky top-0 z-30 bg-[#0D1322]/95 backdrop-blur-md border-b border-gray-800 px-5 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-black text-white shadow-lg shadow-orange-500/20">
              M!
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Panel del Cliente</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                ¡Hola, {activeUser.name.split(' ')[0]}! 👋
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tasa BCV */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-800/60 border border-gray-700/60 text-xs">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-gray-400">BCV:</span>
              <span className="font-mono font-bold text-emerald-400">{currentRate.toFixed(2)} Bs/$</span>
            </div>

            {/* Carrito flotante en header */}
            <button
              onClick={() => setShowCartModal(true)}
              className="relative p-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25 transition-all cursor-pointer"
              title="Ver Carrito de Compras"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[11px] font-black flex items-center justify-center animate-pulse">
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* Cerrar sesión */}
            <button
              onClick={() => signOut()}
              className="p-2.5 rounded-xl bg-gray-800/60 hover:bg-red-500/20 border border-gray-700 hover:border-red-500/40 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero con Saldo y Tarjeta de Bienvenida */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-8 pb-6">
        <div className="bg-gradient-to-r from-[#17233D] to-[#121A2D] border border-orange-500/20 rounded-[28px] p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
                <Wallet className="w-4 h-4" /> Tu Billetera Mándalo
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                  ${balanceUSD.toFixed(2)}
                </span>
                <span className="text-sm sm:text-base text-gray-400 font-mono">
                  ≈ {balanceBs} Bs.
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                Disponible para compras en comercios, mandaditos express y carreras.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
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
