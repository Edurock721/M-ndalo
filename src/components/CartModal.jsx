import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  UploadCloud, 
  Check, 
  CreditCard,
  Building,
  DollarSign
} from 'lucide-react';
import { compressImageToWebP } from '../lib/imageCompression';
import { soundManager } from '../lib/soundEffects';
import { GpsLocationPicker } from './GpsLocationPicker';

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
  const [paymentMethod, setPaymentMethod] = useState('pago_movil');
  const [pagoMovilRef, setPagoMovilRef] = useState('');
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [isCompressingReceipt, setIsCompressingReceipt] = useState(false);

  // Totals calculation
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = merchant?.delivery_fee || 1.50;
  const platformFee = 0.50;
  const total = subtotal + deliveryFee + platformFee;
  const totalBsFormatted = formatBs(total);

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingReceipt(true);
      const res = await compressImageToWebP(file);
      setReceiptUrl(res.dataUrl);
      soundManager.playTap();
    } catch (err) {
      console.error('Error compressing cart receipt:', err);
      alert('Error al procesar el comprobante.');
    } finally {
      setIsCompressingReceipt(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!deliveryAddress.trim()) {
      alert('Por favor ingresa la dirección de entrega.');
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
      platform_fee: platformFee,
      total,
      payment_method: paymentMethod,
      payment_receipt_url: receiptUrl,
      pago_movil_ref: pagoMovilRef || null
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

                {/* Payment method */}
                <div className="input-group">
                  <label className="input-label">Método de Pago</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                    {[
                      { id: 'pago_movil', label: 'Pago Móvil (Bs)', icon: '⚡' },
                      { id: 'cash_usd', label: 'Efectivo USD ($)', icon: '💵' },
                      { id: 'cash_bs', label: 'Efectivo Bolívares (Bs)', icon: '🇻🇪' }
                    ].map((pm) => (
                      <button
                        type="button"
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`p-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer min-h-[46px] ${
                          paymentMethod === pm.id
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-lg shadow-orange-500/25 scale-[1.01]'
                            : 'bg-[#141F38] text-gray-300 border-[#2B3D5D] hover:border-gray-500'
                        }`}
                      >
                        <span>{pm.icon}</span>
                        <span>{pm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pago Movil Details */}
                {paymentMethod === 'pago_movil' && (
                  <div style={{
                    background: 'rgba(255, 94, 54, 0.05)',
                    border: '1px solid rgba(255, 94, 54, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                    marginBottom: 16
                  }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--brand-orange)', marginBottom: 4 }}>
                      Datos Pago Móvil {merchant?.name}:
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Banesco (0134) • 0424-9876543 • RIF: J-40192831
                    </p>
                    <div style={{
                      padding: '8px 12px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 10,
                      fontSize: 12.5,
                      color: '#FBBF24'
                    }}>
                      ⚡ Monto Exacto a Transferir: <strong style={{ fontSize: 14, color: '#FFFFFF' }}>{totalBsFormatted}</strong> (Tasa: Bs. {exchangeRate.toFixed(2)}/$)
                    </div>

                    <input
                      type="text"
                      placeholder="Referencia de Pago Móvil (últimos 6 dígitos)"
                      value={pagoMovilRef}
                      onChange={(e) => setPagoMovilRef(e.target.value)}
                      className="input-field"
                      style={{ marginBottom: 10, fontSize: 13 }}
                    />

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: 10,
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--border-subtle)',
                      background: 'rgba(0, 0, 0, 0.2)',
                      cursor: 'pointer',
                      fontSize: 12,
                      color: 'var(--text-muted)'
                    }}>
                      <UploadCloud size={16} style={{ color: 'var(--brand-orange)' }} />
                      <span>{isCompressingReceipt ? 'Comprimiendo a WebP...' : 'Adjuntar captura de Pago Móvil (Auto WebP < 120KB)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleReceiptUpload}
                      />
                    </label>

                    {receiptUrl && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img
                          src={receiptUrl}
                          alt="Comprobante"
                          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }}
                        />
                        <span style={{ fontSize: 12, color: '#10B981' }}>✓ Comprobante optimizado en WebP</span>
                      </div>
                    )}
                  </div>
                )}

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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: 'var(--text-muted)' }}>
                    <span>Comisión Plataforma Mándalo!:</span>
                    <span>${platformFee.toFixed(2)} · <strong style={{ color: '#E2E8F0' }}>{formatBs(platformFee)}</strong></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 10, fontWeight: 900 }}>
                    <span style={{ fontSize: 15 }}>Total a Pagar:</span>
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
                className="btn-brand w-full sm:w-auto min-h-[48px] font-extrabold text-sm sm:text-base flex-1 shadow-lg shadow-orange-500/25"
              >
                Confirmar Orden (${total.toFixed(2)} / {totalBsFormatted})
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
