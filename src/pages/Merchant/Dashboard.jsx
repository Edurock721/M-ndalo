import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localStore } from '../../lib/supabase';
import { exchangeRateService } from '../../lib/exchangeRate';
import { MerchantView } from '../../components/MerchantView';
import { ContextualChatModal } from '../../components/ContextualChatModal';
import { 
  Store, 
  Package, 
  Clock, 
  LogOut, 
  TrendingUp, 
  ShieldCheck, 
  UtensilsCrossed 
} from 'lucide-react';

export function Dashboard() {
  const { user, profile, signOut } = useAuth();

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

  const activeMerchantUser = {
    id: user?.id || 'merchant-1',
    name: profile?.full_name || user?.user_metadata?.full_name || 'Comercio Mándalo',
    phone: profile?.phone || user?.user_metadata?.phone || '0414-0000000',
    role: 'merchant',
    walletBalance: Number(profile?.wallet_balance ?? 142.50),
    isVerified: profile?.is_verified ?? true
  };

  const currentMerchant = storeState.merchants[0] || {
    id: 'merch-1',
    name: activeMerchantUser.name,
    category: 'Comida Rápida',
    address: 'Av. Bolívar, Centro Comercial Mándalo',
    rating: 4.9,
    delivery_time: '25-35 min'
  };

  const currentRate = rateData.rate;

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    localStore.updateOrderStatus(orderId, newStatus);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-white pb-12">
      {/* 1. Header superior del Comercio */}
      <header className="sticky top-0 z-30 bg-[#0D1322]/95 backdrop-blur-md border-b border-gray-800 px-5 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center font-black text-white shadow-lg shadow-orange-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Panel del Comercio</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                {currentMerchant.name}
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

      {/* 2. Resumen del Comercio */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-8 pb-6">
        <div className="bg-gradient-to-r from-[#17233D] to-[#121A2D] border border-orange-500/20 rounded-[28px] p-6 sm:p-7 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                  {currentMerchant.category || 'Restaurante / Tienda'}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-bold">
                  ★ {currentMerchant.rating || '5.0'}
                </span>
              </div>
              <p className="text-base font-semibold text-white">
                {currentMerchant.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#0D1322] border border-gray-800 px-4 py-2.5 rounded-2xl text-right">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Balance en Ventas</span>
              <span className="text-lg font-black text-white font-mono">${activeMerchantUser.walletBalance.toFixed(2)}</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              Afiliado Activo
            </div>
          </div>
        </div>
      </div>

      {/* 3. Panel de Pedidos y Catálogo (MerchantView) */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-16">
        <MerchantView
          merchant={currentMerchant}
          products={storeState.products}
          orders={storeState.orders}
          currentUser={activeMerchantUser}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onAddProduct={(data) => localStore.addProduct(data)}
          onUpdateProduct={(id, updates) => localStore.updateProduct(id, updates)}
          onDeleteProduct={(id) => localStore.deleteProduct(id)}
          onOpenChat={(order) => setActiveChatOrder(order)}
          exchangeRate={currentRate}
        />
      </div>

      {/* Modal de Chat Contextual */}
      {activeChatOrder && (
        <ContextualChatModal
          order={activeChatOrder}
          currentUser={activeMerchantUser}
          messages={storeState.messages}
          onSendMessage={(msg) => localStore.sendMessage(msg)}
          onClose={() => setActiveChatOrder(null)}
        />
      )}
    </div>
  );
}

export default Dashboard;
