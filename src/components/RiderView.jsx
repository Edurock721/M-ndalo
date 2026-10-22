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
  Check
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

  // Radar: available orders with no rider assigned yet
  const availableOrders = orders.filter((o) => !o.rider_id && o.status !== 'cancelled' && o.status !== 'delivered');

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
              {currentUser.phone} • Saldo acumulado: <strong style={{ color: '#00F2FE' }}>${currentUser.wallet_balance.toFixed(2)}</strong> <span style={{ color: '#FBBF24', fontWeight: 700 }}>· {formatBs(currentUser.wallet_balance)}</span>
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.3)',
          padding: 4,
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)'
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
                padding: '7px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: 13,
                fontWeight: 700,
                background: activeTab === tab.id ? 'linear-gradient(135deg, #00F2FE, #4FACFE)' : 'transparent',
                color: activeTab === tab.id ? '#000000' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && activeTab !== tab.id && (
                <span style={{
                  background: 'var(--brand-orange)',
                  color: '#FFFFFF',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  fontSize: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
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
        <div>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Navigation size={18} style={{ color: '#00F2FE' }} />
              Envíos Disponibles en la Zona ({availableOrders.length})
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Toca &quot;Aceptar Despacho&quot; para asignarte la orden y comenzar la entrega
            </p>
          </div>

          {availableOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }} className="glass-panel">
              <Bike size={44} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: 15 }}>No hay envíos pendientes por asignar en este momento.</p>
              <p style={{ fontSize: 12 }}>El radar te alertará automáticamente con un sonido cuando un cliente ordene.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {availableOrders.map((ord) => {
                const isMandadito = ord.order_type === 'mandadito';

                return (
                  <div key={ord.id} className="glass-panel" style={{ padding: 18, background: 'var(--bg-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <span className={`badge ${isMandadito ? 'badge-mandadito' : 'badge-onway'}`}>
                        {isMandadito ? 'MANDADITO EXPRESS' : 'COMPRA COMERCIO'}
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: 16, color: '#10B981' }}>
                          +${ord.delivery_fee?.toFixed(2)}
                        </strong>
                        <div style={{ fontSize: 11.5, color: '#FBBF24', fontWeight: 700 }}>
                          {formatBs(ord.delivery_fee)}
                        </div>
                      </div>
                    </div>

                    {/* Route Details */}
                    <div style={{
                      background: 'rgba(0,0,0,0.2)',
                      padding: 12,
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 14,
                      fontSize: 13
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                        <Store size={15} style={{ color: 'var(--brand-orange)', marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                            {isMandadito ? 'Retiro en:' : 'Comercio:'}
                          </span>
                          <p style={{ fontWeight: 600 }}>{isMandadito ? ord.pickup_address : ord.merchant_name}</p>
                          {!isMandadito && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ord.merchant_address}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <MapPin size={15} style={{ color: '#00F2FE', marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                            Entrega al cliente:
                          </span>
                          <p style={{ fontWeight: 600 }}>{ord.delivery_address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Task description or items */}
                    <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14 }}>
                      {isMandadito ? `Diligencia: ${ord.task_description}` : `Artículos: ${ord.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}`}
                    </p>

                    <button
                      onClick={() => {
                        soundManager.playTap();
                        onAcceptOrder(ord.id);
                      }}
                      className="btn-brand"
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
                        color: '#000000',
                        fontWeight: 800
                      }}
                    >
                      <Zap size={16} />
                      <span>Aceptar Despacho (+${ord.delivery_fee?.toFixed(2)} / {formatBs(ord.delivery_fee)})</span>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
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
