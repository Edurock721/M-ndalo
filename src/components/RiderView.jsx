import React, { useState } from 'react';
import { 
  Bike, 
  MapPin, 
  Navigation, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Phone, 
  ExternalLink,
  Store,
  PackageCheck,
  Zap,
  Check,
  SlidersHorizontal,
  AlertTriangle,
  User,
  Car,
  Package
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../lib/soundEffects';

export function RiderView({ 
  orders, 
  currentUser, 
  onAcceptOrder, 
  onUpdateOrderStatus, 
  onOpenChat,
  exchangeRate = 884.75
}) {
  const formatBs = (usd) => `Bs. ${(Number(usd || 0) * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatUSD = (usd) => `$${Number(usd || 0).toFixed(2)}`;

  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'my_deliveries' | 'history'

  // Driver Decision Filters: Quick toggles to filter pool by preference
  const [showRides, setShowRides] = useState(true); // Ver traslados de personas (Carreras)
  const [showPackages, setShowPackages] = useState(true); // Ver encomiendas / compras
  const [showHeavy, setShowHeavy] = useState(true); // Ver cargas pesadas

  // Radar: available orders with no rider assigned yet
  const availableOrders = orders.filter((o) => !o.rider_id && o.status !== 'cancelled' && o.status !== 'delivered');

  // Filtered available orders according to driver's active toggles
  const filteredAvailableOrders = availableOrders.filter((ord) => {
    const isRide = ord.order_type === 'ride';
    const isHeavy = ord.cargo_size === 'heavy';
    const isStandardPackage = !isRide && !isHeavy;

    if (isRide && !showRides) return false;
    if (isHeavy && !showHeavy) return false;
    if (isStandardPackage && !showPackages) return false;

    return true;
  });

  const ridesCount = availableOrders.filter(o => o.order_type === 'ride').length;
  const packagesCount = availableOrders.filter(o => o.order_type !== 'ride' && o.cargo_size !== 'heavy').length;
  const heavyCount = availableOrders.filter(o => o.cargo_size === 'heavy').length;

  // My active dispatches
  const myActiveOrders = orders.filter((o) => o.rider_id === currentUser.id && o.status !== 'delivered' && o.status !== 'cancelled');

  // Completed deliveries
  const myCompletedOrders = orders.filter((o) => o.rider_id === currentUser.id && o.status === 'delivered');

  // Total rider earnings
  const totalEarnings = myCompletedOrders.reduce((sum, o) => sum + (o.delivery_fee || 0), 0);

  // Delivery celebration trigger
  const handleCompleteDelivery = (orderId) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    onUpdateOrderStatus(orderId, 'delivered');
  };

  return (
    <div className="animate-fade-in">
      {/* Rider Header Bar */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        marginBottom: 20,
        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, #00F2FE, #4FACFE)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000000',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.3)'
          }}>
            <Bike size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>{currentUser.full_name}</h2>
              <span className="badge badge-mandadito">En Línea 🟢</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {currentUser.phone} • Saldo acumulado: <strong style={{ color: '#00F2FE' }}>${currentUser.walletBalance.toFixed(2)}</strong> <span style={{ color: '#FBBF24', fontWeight: 700 }}>· {formatBs(currentUser.walletBalance)}</span>
            </p>
          </div>
        </div>

        {/* Tab switch */}
        {/* Tab switcher con scroll horizontal suave en móvil */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.4)',
          padding: 6,
          borderRadius: 16,
          border: '1.5px solid rgba(255, 255, 255, 0.1)',
          overflowX: 'auto',
          maxWidth: '100%',
          WebkitOverflowScrolling: 'touch'
        }}>
          {[
            { id: 'radar', label: `Radar (${availableOrders.length})`, count: availableOrders.length },
            { id: 'my_deliveries', label: `Mis Despachos (${myActiveOrders.length})` },
            { id: 'history', label: `Historial (${myCompletedOrders.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundManager.playTap();
                setActiveTab(tab.id);
              }}
              style={{
                padding: '9px 18px',
                borderRadius: 12,
                fontSize: 13.5,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #00F2FE, #4FACFE)' : 'transparent',
                color: activeTab === tab.id ? '#000000' : '#CBD5E1',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && activeTab !== tab.id && (
                <span style={{
                  background: 'var(--brand-orange)',
                  color: '#FFFFFF',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900
                }} className="pulse-alert">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Radar (Available dispatches) */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, color: '#FFFFFF' }}>
              <Navigation size={22} style={{ color: '#00F2FE' }} />
              Bolsa de Servicios en la Zona ({availableOrders.length})
            </h3>
            <p style={{ fontSize: 13.5, color: '#94A3B8', marginTop: 4 }}>
              Elige con libertad según tu vehículo y disponibilidad. Tú decides qué servicio tomar.
            </p>
          </div>

          {/* Quick Filter Controls - Panel de Control y Filtros de Servicios con Espaciado Ejecutivo */}
          <div className="bg-[#0D1424] border border-[#233352] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-orange-400" />
                <span className="text-xs font-black uppercase tracking-wider text-gray-200">
                  Filtros Rápidos del Radar
                </span>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                Selecciona qué tipos de servicios deseas tomar en tu zona
              </span>
            </div>

            {/* 3 Botones de Filtro en Grid Responsivo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Toggle Carreras */}
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setShowRides(!showRides);
                }}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between sm:justify-center gap-3 ${
                  showRides
                    ? 'border-blue-500 bg-blue-500/20 text-blue-200 shadow-md shadow-blue-500/20 font-black'
                    : 'border-[#2B3D5D] bg-[#141F38] text-gray-400 hover:border-gray-600 font-bold'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{showRides ? '☑' : '☐'}</span>
                  <User size={16} className={showRides ? 'text-blue-400' : 'text-gray-400'} />
                  <span className="text-xs sm:text-sm">Carreras / Pasajeros</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-black ${showRides ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  {ridesCount}
                </span>
              </button>

              {/* Toggle Encomiendas / Compras */}
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setShowPackages(!showPackages);
                }}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between sm:justify-center gap-3 ${
                  showPackages
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200 shadow-md shadow-emerald-500/20 font-black'
                    : 'border-[#2B3D5D] bg-[#141F38] text-gray-400 hover:border-gray-600 font-bold'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{showPackages ? '☑' : '☐'}</span>
                  <Package size={16} className={showPackages ? 'text-emerald-400' : 'text-gray-400'} />
                  <span className="text-xs sm:text-sm">Encomiendas / Compras</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-black ${showPackages ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  {packagesCount}
                </span>
              </button>

              {/* Toggle Cargas Pesadas */}
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setShowHeavy(!showHeavy);
                }}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between sm:justify-center gap-3 ${
                  showHeavy
                    ? 'border-amber-500 bg-amber-500/20 text-amber-200 shadow-md shadow-amber-500/20 font-black'
                    : 'border-[#2B3D5D] bg-[#141F38] text-gray-400 hover:border-gray-600 font-bold'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{showHeavy ? '☑' : '☐'}</span>
                  <AlertTriangle size={16} className={showHeavy ? 'text-amber-400' : 'text-gray-400'} />
                  <span className="text-xs sm:text-sm">Cargas Pesadas</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-black ${showHeavy ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
                  {heavyCount}
                </span>
              </button>
            </div>
          </div>

          {filteredAvailableOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 24px', color: '#94A3B8' }} className="glass-panel">
              <Bike size={50} style={{ margin: '0 auto 14px', opacity: 0.4 }} />
              <p style={{ fontSize: 17, fontWeight: 700, color: '#FFFFFF' }}>No hay servicios que coincidan con tus filtros activos.</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Activa más filtros arriba o espera una nueva alerta sonora en la zona.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 20 }}>
              {filteredAvailableOrders.map((ord) => {
                const isRide = ord.order_type === 'ride';
                const isMandadito = ord.order_type === 'mandadito';
                const isHeavy = ord.cargo_size === 'heavy';
                const destinationParam = ord.delivery_coords
                  ? `${ord.delivery_coords.lat},${ord.delivery_coords.lng}`
                  : encodeURIComponent(ord.delivery_address);
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}`;

                return (
                  <div key={ord.id} className="glass-panel" style={{ padding: 18, background: 'var(--bg-surface)' }}>
                    {/* Header Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {/* Service Type Tag */}
                        {isRide ? (
                          <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.4)', fontWeight: 800 }}>
                            👤 Carrera / Pasajero
                          </span>
                        ) : isMandadito ? (
                          <span className="badge badge-mandadito">
                            📦 Mandadito Express
                          </span>
                        ) : (
                          <span className="badge badge-onway">
                            🛒 Compra Comercio
                          </span>
                        )}

                        {/* Heavy Load Warning */}
                        {isHeavy && (
                          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: 800 }}>
                            ⚠️ Carga pesada • Recomendado carro
                          </span>
                        )}

                        {/* Light package note */}
                        {!isHeavy && !isRide && (
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', fontSize: 11 }}>
                            📦 Ligero (Ideal moto)
                          </span>
                        )}

                        {/* Passenger Count Badge */}
                        {isRide && ord.passenger_count > 1 && (
                          <span className="badge" style={{ background: 'rgba(147, 51, 234, 0.2)', color: '#C084FC', border: '1px solid rgba(147, 51, 234, 0.4)' }}>
                            👥 {ord.passenger_count} Pasajeros
                          </span>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: 17, color: '#10B981' }}>
                          +${ord.delivery_fee?.toFixed(2)}
                        </strong>
                        <div style={{ fontSize: 11.5, color: '#FBBF24', fontWeight: 700 }}>
                          {formatBs(ord.delivery_fee)}
                        </div>
                      </div>
                    </div>

                    {/* Route Details */}
                    <div style={{
                      background: 'rgba(0,0,0,0.25)',
                      padding: 12,
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 12,
                      fontSize: 13
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                        <Store size={15} style={{ color: isRide ? '#60A5FA' : 'var(--brand-orange)', marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                            {isRide ? 'Punto de recogida (Origen):' : isMandadito ? 'Retiro en:' : 'Comercio:'}
                          </span>
                          <p style={{ fontWeight: 600 }}>{isRide || isMandadito ? ord.pickup_address : ord.merchant_name}</p>
                          {!isRide && !isMandadito && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ord.merchant_address}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <MapPin size={15} style={{ color: '#00F2FE', marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                            {isRide ? 'Destino del viaje:' : 'Entrega al cliente:'}
                          </span>
                          <p style={{ fontWeight: 600 }}>{ord.delivery_address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Passenger & Task Description */}
                    {isRide && (
                      <p style={{ fontSize: 12.5, color: '#93C5FD', marginBottom: 8, fontWeight: 600 }}>
                        👤 Pasajeros: <strong>{ord.passenger_count || 1}</strong> {ord.passenger_count > 1 ? '• Se recomienda vehículo 4 ruedas' : '• Apto mototaxi o carro'}
                      </p>
                    )}

                    {ord.task_description && (
                      <p style={{
                        fontSize: 12.5,
                        color: 'var(--text-main)',
                        marginBottom: 8,
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontStyle: 'italic'
                      }}>
                        &quot;{ord.task_description}&quot;
                      </p>
                    )}

                    {ord.notes && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                        📝 Nota: {ord.notes}
                      </p>
                    )}

                    {!isRide && ord.items && ord.items.length > 0 && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                        Artículos: {ord.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                    )}

                    {/* GPS Navigation preview */}
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '7px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        color: '#38BDF8',
                        fontWeight: 600,
                        fontSize: 12,
                        textDecoration: 'none',
                        marginBottom: 12
                      }}
                    >
                      <Navigation size={13} />
                      <span>Ver ruta exacta en GPS</span>
                      <ExternalLink size={12} />
                    </a>

                    <button
                      onClick={() => {
                        soundManager.playTap();
                        onAcceptOrder(ord.id);
                      }}
                      className="btn-brand"
                      style={{
                        width: '100%',
                        background: isRide
                          ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
                          : isHeavy
                          ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                          : 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
                        color: isRide || isHeavy ? '#FFFFFF' : '#000000',
                        fontWeight: 800,
                        padding: '12px'
                      }}
                    >
                      <Zap size={16} />
                      <span>Tomar servicio (+${ord.delivery_fee?.toFixed(2)} / {formatBs(ord.delivery_fee)})</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: My Active Deliveries */}
      {activeTab === 'my_deliveries' && (
        <div>
          <h3 style={{ fontSize: 18, marginBottom: 14 }}>Mis Despachos en Curso ({myActiveOrders.length})</h3>

          {myActiveOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }} className="glass-panel">
              <PackageCheck size={44} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p>No tienes ningún despacho asignado en este momento.</p>
              <p style={{ fontSize: 12 }}>Ve a la pestaña &quot;Radar&quot; para tomar un pedido disponible.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 16 }}>
              {myActiveOrders.map((ord) => {
                const isMandadito = ord.order_type === 'mandadito';
                const destinationParam = ord.delivery_coords
                  ? `${ord.delivery_coords.lat},${ord.delivery_coords.lng}`
                  : encodeURIComponent(ord.delivery_address);
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}`;

                return (
                  <div key={ord.id} className="glass-panel" style={{ padding: 18, background: 'var(--bg-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <strong style={{ fontSize: 16 }}>
                          {isMandadito ? 'Mandadito #' + ord.id.slice(-4) : ord.merchant_name}
                        </strong>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Cliente: {ord.client_name} • {ord.client_phone}
                        </div>
                      </div>
                      <span className="badge badge-onway">{ord.status.replace('_', ' ')}</span>
                    </div>

                    {/* GPS Navigation Button */}
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38BDF8',
                        fontWeight: 700,
                        fontSize: 13,
                        textDecoration: 'none',
                        marginBottom: 14
                      }}
                    >
                      <Navigation size={16} />
                      <span>Ruta en Google Maps / Waze</span>
                      <ExternalLink size={14} />
                    </a>

                    {/* Step progression actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                      {ord.status !== 'on_way' && (
                        <button
                          onClick={() => {
                            soundManager.playTap();
                            onUpdateOrderStatus(ord.id, 'on_way');
                          }}
                          className="btn-outline"
                          style={{ borderColor: 'var(--brand-orange)', color: 'var(--brand-orange)' }}
                        >
                          🛵 Confirmar Retiro en Origen / Salir a Entregar
                        </button>
                      )}

                      {/* Customer payment detail */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: 'rgba(0,0,0,0.25)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12.5
                      }}>
                        <span style={{ color: 'var(--text-muted)' }}>Monto a cobrar ({ord.payment_method.toUpperCase()}):</span>
                        <span style={{ color: '#FBBF24', fontWeight: 800 }}>${ord.total?.toFixed(2)} · {formatBs(ord.total)}</span>
                      </div>

                      <button
                        onClick={() => handleCompleteDelivery(ord.id)}
                        className="btn-success"
                        style={{ width: '100%', padding: '12px', fontSize: 13.5 }}
                      >
                        <CheckCircle2 size={18} />
                        <span>Marcar Como Entregado (Cobrar +${ord.delivery_fee.toFixed(2)} / {formatBs(ord.delivery_fee)})</span>
                      </button>
                    </div>

                    {/* Contextual chat button */}
                    <button
                      onClick={() => {
                        soundManager.playTap();
                        onOpenChat(ord);
                      }}
                      className="btn-outline"
                      style={{ width: '100%', fontSize: 13 }}
                    >
                      <MessageSquare size={16} style={{ color: 'var(--brand-orange)' }} />
                      <span>Abrir Chat con Cliente / Comercio</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18 }}>Historial de Despachos Entregados</h3>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#10B981' }}>
                Total Ganado: ${totalEarnings.toFixed(2)}
              </span>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FBBF24' }}>
                {formatBs(totalEarnings)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myCompletedOrders.map((ord) => (
              <div key={ord.id} className="glass-panel" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {ord.order_type === 'mandadito' ? 'Mandadito #' + ord.id.slice(-4) : ord.merchant_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Entregado en: {ord.delivery_address}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: '#10B981', fontSize: 15 }}>+${ord.delivery_fee.toFixed(2)}</strong>
                  <div style={{ fontSize: 11.5, color: '#FBBF24', fontWeight: 700 }}>
                    {formatBs(ord.delivery_fee)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {new Date(ord.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
