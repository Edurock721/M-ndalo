import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localStore } from '../../lib/supabase';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
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
    if (user?.id && isSupabaseConfigured()) {
      supabase
        .from('merchants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()
        .then(async ({ data, error }) => {
          if (error) console.error('No se pudo cargar la tienda del comercio:', error);
          if (data) {
            localStore.upsertMerchant(data);
            const { data: products, error: productsError } = await supabase
              .from('products')
              .select('*')
              .eq('merchant_id', data.id);
            if (productsError) console.error('No se pudo cargar el catálogo del comercio:', productsError);
            else if (products) localStore.upsertProducts(products);
          }
        });
    }

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
  }, [user?.id]);

  const activeMerchantUser = {
    id: user?.id || 'merchant-1',
    name: profile?.full_name || user?.user_metadata?.full_name || 'Comercio Mándalo',
    phone: profile?.phone || user?.user_metadata?.phone || '0414-0000000',
    role: 'merchant',
    isVerified: profile?.is_verified ?? true
  };

  const currentMerchant = storeState.merchants.find(merchant => merchant.owner_id === user?.id)
    || storeState.merchants.find(merchant => merchant.owner_id === 'user-merchant-1')
    || {
    id: 'merch-1',
    owner_id: user?.id,
    name: activeMerchantUser.name,
    category: 'Comida Rápida',
    address: 'Av. Bolívar, Centro Comercial Mándalo',
    rating: 4.9,
    delivery_time: '25-35 min',
    plan: 'trial',
    subscription_status: 'active',
    verified: activeMerchantUser.isVerified,
    is_active: activeMerchantUser.isVerified
  };

  const currentRate = rateData.rate;

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    localStore.updateOrderStatus(orderId, newStatus);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-white pb-12">
      {/* 1. Header superior del Comercio con Tasa BCV Visible */}
      <header className="sticky top-0 z-30 bg-[#0B101E]/95 backdrop-blur-md border-b border-gray-800/80 px-4 sm:px-8 py-3.5 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center font-black text-white shadow-lg shadow-orange-500/25 flex-shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs text-orange-400 font-extrabold uppercase tracking-wider">Comercio</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <h2 className="text-sm sm:text-lg font-black text-white tracking-tight truncate max-w-[130px] sm:max-w-xs">
                {currentMerchant.name}
              </h2>
            </div>
          </div>

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

      {/* 2. Resumen del Comercio con Distribución Ejecutiva */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-4 sm:pt-8 sm:pb-6">
        <div className="bg-gradient-to-r from-[#17233D] via-[#141E34] to-[#101728] border border-orange-500/25 rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 flex-shrink-0">
              <UtensilsCrossed className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-extrabold text-orange-400 uppercase tracking-wider">
                  {currentMerchant.category || 'Restaurante / Tienda Aliada'}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-bold">
                  ★ {currentMerchant.rating || '5.0'}
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-white">
                {currentMerchant.address}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-emerald-300 mt-1">Quédate con el 100% de tus ventas.</p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800">
            <div className="bg-[#0D1322] border border-gray-800 px-4 py-2.5 rounded-2xl">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Plan actual</span>
              <div className="text-lg font-black text-white">{(currentMerchant.plan || 'trial').toUpperCase()}</div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>{(currentMerchant.verified ?? currentMerchant.is_active) ? 'Comercio aprobado' : 'Pendiente de validación'}</span>
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
          onUpdateMerchant={(id, updates) => localStore.updateMerchant(id, updates)}
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
