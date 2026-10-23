import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag
} from 'lucide-react';
import { GpsLocationPicker } from './GpsLocationPicker';
import { canReceiveOrders, getPaymentConfig, getPaymentMethods, getSubscriptionState, PAYMENT_METHOD_OPTIONS } from '../lib/merchantSubscription';

export function CartModal({ 
  cart, 
  merchant, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCheckout, 
  onClose,
  currentUser,
  exchangeRate = 884.75
}) {
  const formatBs = (usd) => `Bs. ${(Number(usd || 0) * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatUSD = (usd) => `$${Number(usd || 0).toFixed(2)}`;

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  const paymentMethods = getPaymentMethods(merchant);
  const paymentConfig = getPaymentConfig(merchant);
  const enabledPaymentMethods = PAYMENT_METHOD_OPTIONS.filter(method => (
    paymentMethods[method.id] && (method.id !== 'divisas' || paymentConfig.aceptaDivisas)
  ));
  const canOrder = canReceiveOrders(merchant);
  const subscriptionState = getSubscriptionState(merchant);

  // Totals calculation
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = merchant?.delivery_fee || 1.50;
  const total = subtotal + deliveryFee;
  const totalBsFormatted = formatBs(total);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!deliveryAddress.trim()) {
      alert('Por favor ingresa la dirección de entrega.');
      return;
    }
    if (!canOrder) {
      alert(subscriptionState.expired
        ? 'Tu suscripción ha vencido. Renueva para seguir recibiendo pedidos.'
        : 'Este comercio todavía está pendiente de validación.');
      return;
    }

    onCheckout({
      order_type: 'store_purchase',
      client_id: currentUser.id,
      client_name: currentUser.full_name,
      client_phone: currentUser.phone,
      merchant_id: merchant.id,
      merchant_name: merchant.name,
      merchant_address: merchant.address,
      rider_id: null,
      items: cart,
      subtotal,
      delivery_address: deliveryAddress,
      delivery_coords: deliveryCoords,
      delivery_fee: deliveryFee,
      total
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 560, height: '88vh' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'var(--brand-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 17 }}>Carrito de Compras</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {merchant ? merchant.name : 'Tu Selección'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                <ShoppingBag size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ fontSize: 15 }}>Tu carrito está vacío</p>
                <p style={{ fontSize: 12 }}>Agrega artículos del menú de un comercio para ordenar.</p>
              </div>
            ) : (
              <>
                {/* Cart Items list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 10,
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                        <h5 style={{ fontSize: 14 }}>{item.name}</h5>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, color: 'var(--brand-orange)', fontWeight: 700 }}>
                            ${item.price.toFixed(2)} c/u
                          </span>
                          <span style={{ fontSize: 11, color: '#FBBF24', fontWeight: 600 }}>
                            · {formatBs(item.price)}
                          </span>
                        </div>
                        {item.note && (
                          <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                            Nota: {item.note}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid #1E293B',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-gray-300 transition-all cursor-pointer"
                            title="Disminuir cantidad"
                          >
                            <Minus size={16} strokeWidth={2.5} />
                          </button>
                          <span style={{ fontSize: 14, fontWeight: 800, minWidth: 20, textAlign: 'center', color: '#FFFFFF' }}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-gray-300 transition-all cursor-pointer"
                            title="Aumentar cantidad"
                          >
                            <Plus size={16} strokeWidth={2.5} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 active:scale-95 flex items-center justify-center text-red-400 transition-all cursor-pointer"
                          title="Eliminar producto"
                        >
                          <Trash2 size={19} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Address with High Precision GPS */}
                <GpsLocationPicker
                  label="Dirección exacta de entrega"
                  value={deliveryAddress}
                  onChange={setDeliveryAddress}
                  coords={deliveryCoords}
                  onCoordsChange={setDeliveryCoords}
                  placeholder="Ej: Calle Principal con Av. Bolívar, Edificio Sol, Apto 3B"
                  required
                  helperText="Presiona el botón GPS para fijar tu ubicación y escribir tu dirección automáticamente"
                />

                <div className="input-group">
                  <label className="input-label">Métodos de pago configurados por {merchant?.name}</label>
                  {enabledPaymentMethods.length ? (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {enabledPaymentMethods.map(({ id, label }) => (
                        <div key={id} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                          <strong style={{ color: 'var(--brand-orange)' }}>{label}</strong>
                          {id === 'pagoMovil' && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{paymentConfig.titular} · C.I. {paymentConfig.cedula} · {paymentConfig.telefonoPagoMovil} · {paymentConfig.banco}</p>}
                          {id === 'transferencia' && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{paymentConfig.titular} · C.I. {paymentConfig.cedula} · {paymentConfig.banco} · Cuenta {paymentConfig.numeroCuenta}</p>}
                          {id === 'divisas' && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{paymentConfig.aceptaDivisas ? 'El comercio acepta USD.' : 'No acepta USD.'}</p>}
                        </div>
                      ))}
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>El pago se coordina directamente con el comercio. Mándalo no procesa pagos ni recibe fondos.</p>
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Este comercio aún no configuró métodos de pago.</p>
                  )}
                </div>

                {/* Totals Breakdown */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: 14,
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--text-muted)' }}>
                    <span>Subtotal Productos:</span>
                    <span>${subtotal.toFixed(2)} · <strong style={{ color: '#E2E8F0' }}>{formatBs(subtotal)}</strong></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--text-muted)' }}>
                    <span>Costo de Delivery:</span>
                    <span>${deliveryFee.toFixed(2)} · <strong style={{ color: '#E2E8F0' }}>{formatBs(deliveryFee)}</strong></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 10, fontWeight: 900 }}>
                    <span style={{ fontSize: 15 }}>Total estimado:</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 18, color: 'var(--brand-orange)' }}>
                        ${total.toFixed(2)}
                      </span>
                      <div style={{ fontSize: 13, color: '#FBBF24', fontWeight: 700 }}>
                        {totalBsFormatted}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {cart.length > 0 && (
            <div className="modal-footer flex flex-col-reverse sm:flex-row gap-3 w-full p-4 sm:p-5">
              <button 
                type="button" 
                onClick={onClose} 
                className="btn-outline w-full sm:w-auto min-h-[48px]"
              >
                Seguir Comprando
              </button>
              <button 
                type="submit"
                disabled={!canOrder}
                title={!canOrder ? (subscriptionState.expired ? 'Suscripción vencida' : 'Comercio pendiente de validación') : undefined}
                className="btn-brand w-full sm:w-auto min-h-[48px] font-extrabold text-sm sm:text-base flex-1 shadow-lg shadow-orange-500/25"
              >
                {canOrder ? `Confirmar Orden ($${total.toFixed(2)} / ${totalBsFormatted})` : 'Pedidos no disponibles'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
