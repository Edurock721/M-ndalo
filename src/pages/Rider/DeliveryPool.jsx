import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localStore } from '../../lib/supabase';
import { exchangeRateService } from '../../lib/exchangeRate';
import { RiderView } from '../../components/RiderView';
import { ContextualChatModal } from '../../components/ContextualChatModal';
import { 
  Bike, 
  Car, 
  Power, 
  CheckCircle, 
  LogOut, 
  TrendingUp, 
  ShieldCheck,
  Filter,
  Navigation
} from 'lucide-react';

export function DeliveryPool() {
  const { user, profile, signOut } = useAuth();

  const [storeState, setStoreState] = useState(() => ({
    orders: localStore.orders,
    messages: localStore.messages
  }));

  const [rateData, setRateData] = useState(() => ({
    rate: exchangeRateService.rate,
    lastUpdated: exchangeRateService.lastUpdated
  }));

  const [isOnline, setIsOnline] = useState(true);
  const [activeChatOrder, setActiveChatOrder] = useState(null);

  useEffect(() => {
    const unsubStore = localStore.subscribe(() => {
      setStoreState({
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

  const activeDriver = {
    id: user?.id || 'rider-1',
    name: profile?.full_name || user?.user_metadata?.full_name || 'Conductor Mándalo',
    phone: profile?.phone || user?.user_metadata?.phone || '0414-0000000',
    role: 'rider',
    vehicleType: profile?.vehicle_type || user?.user_metadata?.vehicle_type || 'moto',
    vehiclePlate: profile?.vehicle_plate || user?.user_metadata?.vehicle_plate || 'AB123CD',
    vehicleModel: profile?.vehicle_model || user?.user_metadata?.vehicle_model || 'Bera SBR 150',
    walletBalance: Number(profile?.wallet_balance ?? 18.00),
    isVerified: profile?.is_verified ?? true
  };

  const currentRate = rateData.rate;

  const handleAcceptOrder = (orderId) => {
    localStore.updateOrderStatus(orderId, 'accepted', activeDriver.id);
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    localStore.updateOrderStatus(orderId, newStatus);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-white pb-12">
      {/* 1. Header superior del Conductor con Tasa BCV Visible */}
      <header className="sticky top-0 z-30 bg-[#0B101E]/95 backdrop-blur-md border-b border-gray-800/80 px-4 sm:px-8 py-3.5 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-black text-white shadow-lg shadow-orange-500/25 flex-shrink-0">
              {activeDriver.vehicleType === 'car' ? <Car className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs text-amber-400 font-extrabold uppercase tracking-wider">
                  {activeDriver.vehicleType === 'car' ? 'Taxista' : 'Repartidor'}
                </span>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></span>
              </div>
              <h2 className="text-sm sm:text-lg font-black text-white tracking-tight truncate max-w-[130px] sm:max-w-xs">
                {activeDriver.name}
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

            {/* Toggle Activo / Inactivo */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border transition-all cursor-pointer min-h-[44px] ${
                isOnline
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/15'
                  : 'bg-gray-800/80 border-gray-700 text-gray-400'
              }`}
            >
              <Power className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.3} />
              <span>{isOnline ? 'En línea' : 'Pausado'}</span>
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

      {/* 2. Resumen del Conductor y Vehículo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-4 sm:pt-8 sm:pb-6">
        <div className="bg-gradient-to-r from-[#17233D] via-[#141E34] to-[#101728] border border-amber-500/25 rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              {activeDriver.vehicleType === 'car' ? <Car className="w-6 h-6 sm:w-7 sm:h-7" /> : <Bike className="w-6 h-6 sm:w-7 sm:h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                  {activeDriver.vehicleType === 'car' ? 'Carro / Taxi Particular' : 'Moto Taxi / Reparto'}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-gray-800/90 border border-gray-700 text-xs font-mono font-bold text-gray-200">
                  {activeDriver.vehiclePlate}
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-white">
                {activeDriver.vehicleModel}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800">
            <div className="bg-[#0D1322] border border-gray-800 px-4 py-2.5 rounded-2xl">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Tu Saldo</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-white font-mono">${activeDriver.walletBalance.toFixed(2)}</span>
                <span className="text-xs text-amber-400 font-mono font-bold">≈ Bs. {(activeDriver.walletBalance * currentRate).toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Verificado</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bolsa de Viajes y Mandaditos (RiderView) */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-16">
        {!isOnline ? (
          <div className="bg-[#131B2E] border border-gray-800 rounded-3xl p-8 text-center mt-4">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-800/60 border border-gray-700 flex items-center justify-center text-gray-400">
              <Power className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Te encuentras fuera de línea</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
              Activa tu estado "En línea" en la parte superior para recibir notificaciones y tomar carreras o encomiendas en tiempo real.
            </p>
            <button
              onClick={() => setIsOnline(true)}
              className="py-2.5 px-6 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              Conectarme ahora
            </button>
          </div>
        ) : (
          <RiderView
            orders={storeState.orders}
            currentUser={activeDriver}
            onAcceptOrder={handleAcceptOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onOpenChat={(order) => setActiveChatOrder(order)}
            exchangeRate={currentRate}
          />
        )}
      </div>

      {/* Modal de Chat Contextual */}
      {activeChatOrder && (
        <ContextualChatModal
          order={activeChatOrder}
          currentUser={activeDriver}
          messages={storeState.messages}
          onSendMessage={(msg) => localStore.sendMessage(msg)}
          onClose={() => setActiveChatOrder(null)}
        />
      )}
    </div>
  );
}

export default DeliveryPool;
