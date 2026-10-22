import React, { useState } from 'react';
import { 
  Store, 
  Package, 
  Plus, 
  Check, 
  X, 
  Clock, 
  Eye, 
  UploadCloud, 
  MessageSquare, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Bell
} from 'lucide-react';
import { compressImageToWebP } from '../lib/imageCompression';
import { soundManager } from '../lib/soundEffects';

export function MerchantView({ 
  merchant, 
  products, 
  orders, 
  currentUser, 
  onUpdateOrderStatus, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onOpenChat,
  exchangeRate = 884.75
}) {
  const formatBs = (usd) => `Bs. ${(Number(usd || 0) * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatUSD = (usd) => `$${Number(usd || 0).toFixed(2)}`;

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'catalog' | 'stats'
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // New product form state
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80'
  });
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [isCompressingProductImg, setIsCompressingProductImg] = useState(false);

  // Filter orders for this merchant
  const merchantOrders = orders.filter((o) => o.merchant_id === merchant?.id);
  const pendingOrders = merchantOrders.filter((o) => o.status === 'pending');
  const activeOrders = merchantOrders.filter((o) => ['accepted', 'preparing', 'ready_for_pickup', 'on_way'].includes(o.status));
  const completedOrders = merchantOrders.filter((o) => o.status === 'delivered');

  // Stats
  const totalSales = completedOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);

  // Handle product image compress
  const handleProductImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingProductImg(true);
      const res = await compressImageToWebP(file);
      setProductImagePreview(res.dataUrl);
      setNewProductForm(prev => ({ ...prev, image_url: res.dataUrl }));
      soundManager.playTap();
    } catch (err) {
      console.error('Error compressing product photo:', err);
      alert('Error al comprimir foto del producto.');
    } finally {
      setIsCompressingProductImg(false);
    }
  };

  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!newProductForm.name.trim() || !newProductForm.price) return;

    onAddProduct({
      merchant_id: merchant.id,
      name: newProductForm.name,
      description: newProductForm.description,
      price: parseFloat(newProductForm.price),
      image_url: newProductForm.image_url
    });

    setShowAddProductModal(false);
    setNewProductForm({
      name: '',
      description: '',
      price: '',
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80'
    });
    setProductImagePreview(null);
    soundManager.playSuccessFanfare();
  };

  return (
    <div className="animate-fade-in">
      {/* Merchant Header Bar */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        marginBottom: 20,
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
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
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '2px solid rgba(168, 85, 247, 0.4)'
          }}>
            <img
              src={merchant?.banner_url}
              alt={merchant?.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>{merchant?.name}</h2>
              <span className="badge badge-accepted">Comercio Activo</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {merchant?.address} • {merchant?.phone}
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.3)',
          padding: 4,
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)'
        }}>
          {[
            { id: 'orders', label: `Órdenes (${pendingOrders.length + activeOrders.length})`, count: pendingOrders.length },
            { id: 'catalog', label: 'Catálogo de Productos' },
            { id: 'stats', label: 'Métricas' }
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
                background: activeTab === tab.id ? '#A855F7' : 'transparent',
                color: activeTab === tab.id ? '#FFFFFF' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span style={{
                  background: '#EF4444',
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

      {/* Tab: Orders Management */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Pending Alert Section */}
          {pendingOrders.length > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#F87171', fontWeight: 800, fontSize: 15 }}>
                <Bell size={18} className="pulse-alert" />
                <span>NUEVOS PEDIDOS ENTRANTES ({pendingOrders.length})</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {pendingOrders.map((ord) => (
                  <div key={ord.id} className="glass-panel" style={{ padding: 16, background: 'var(--bg-surface-elevated)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <strong style={{ fontSize: 15 }}>Orden #{ord.id.slice(-4)}</strong>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cliente: {ord.client_name}</div>
                      </div>
                      <span className="badge badge-pending">Pendiente Validación</span>
                    </div>

                    {/* Items */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 12.5 }}>
                      {ord.items?.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span>{it.quantity}x {it.name} {it.note ? `(${it.note})` : ''}</span>
                          <strong>${(it.price * it.quantity).toFixed(2)}</strong>
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                        <span>Subtotal Tienda:</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: 'var(--brand-orange)', fontSize: 14 }}>${ord.subtotal.toFixed(2)}</span>
                          <span style={{ color: '#FBBF24', fontSize: 12, marginLeft: 6 }}>· {formatBs(ord.subtotal)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment info & receipt */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, fontSize: 12 }}>
                      <div>
                        <span style={{ color: 'var(--text-dim)' }}>Método:</span> <strong>{ord.payment_method.toUpperCase()}</strong>
                        {ord.pago_movil_ref && <div style={{ color: '#38BDF8' }}>Ref: {ord.pago_movil_ref}</div>}
                      </div>

                      {ord.payment_receipt_url && (
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(ord.payment_receipt_url)}
                          className="btn-outline"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                        >
                          <Eye size={13} />
                          <span>Ver Comprobante</span>
                        </button>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => {
                          soundManager.playTap();
                          onUpdateOrderStatus(ord.id, 'cancelled');
                        }}
                        className="btn-outline"
                        style={{ flex: 1, color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '9px 12px', fontSize: 13 }}
                      >
                        Rechazar
                      </button>

                      <button
                        onClick={() => {
                          soundManager.playTap();
                          onUpdateOrderStatus(ord.id, 'accepted');
                        }}
                        className="btn-success"
                        style={{ flex: 2, padding: '9px 12px', fontSize: 13 }}
                      >
                        <Check size={16} />
                        <span>Aceptar Pedido</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Orders List */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Órdenes en Cocina / Despacho ({activeOrders.length})</h3>

            {activeOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-dim)' }} className="glass-panel">
                <Clock size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <p>No tienes órdenes activas en este momento.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {activeOrders.map((ord) => (
                  <div key={ord.id} className="glass-panel" style={{ padding: 18, background: 'var(--bg-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <strong style={{ fontSize: 15 }}>Orden #{ord.id.slice(-4)}</strong>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ord.client_name} • {ord.delivery_address}</div>
                      </div>
                      <span className={`badge ${
                        ord.status === 'preparing' ? 'badge-preparing' :
                        ord.status === 'ready_for_pickup' ? 'badge-ready' : 'badge-onway'
                      }`}>
                        {ord.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 12.5 }}>
                      {ord.items?.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span>{it.quantity}x {it.name}</span>
                          <strong>${(it.price * it.quantity).toFixed(2)}</strong>
                        </div>
                      ))}
                    </div>

                    {ord.rider_name ? (
                      <div style={{ fontSize: 12, color: '#38BDF8', marginBottom: 12 }}>
                        🛵 Rider asignado: <strong>{ord.rider_name}</strong>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#FBBF24', marginBottom: 12 }}>
                        ⏳ Esperando asignación de repartidor en zona...
                      </div>
                    )}

                    {/* Step buttons */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {ord.status === 'accepted' && (
                        <button
                          onClick={() => {
                            soundManager.playTap();
                            onUpdateOrderStatus(ord.id, 'preparing');
                          }}
                          className="btn-brand"
                          style={{ flex: 1, padding: '8px', fontSize: 12.5 }}
                        >
                          Marcar &quot;En Preparación&quot;
                        </button>
                      )}

                      {ord.status === 'preparing' && (
                        <button
                          onClick={() => {
                            soundManager.playTap();
                            onUpdateOrderStatus(ord.id, 'ready_for_pickup');
                          }}
                          className="btn-success"
                          style={{ flex: 1, padding: '8px', fontSize: 12.5 }}
                        >
                          Marcar &quot;Listo para Retiro&quot;
                        </button>
                      )}

                      <button
                        onClick={() => {
                          soundManager.playTap();
                          onOpenChat(ord);
                        }}
                        className="btn-outline"
                        style={{ padding: '8px 12px', fontSize: 12.5 }}
                      >
                        <MessageSquare size={15} style={{ color: 'var(--brand-orange)' }} />
                        <span>Chat</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Catalog Management */}
      {activeTab === 'catalog' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18 }}>Gestión de Menú e Inventario</h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Agrega platos, actualiza precios y fotos comprimidas a WebP
              </p>
            </div>

            <button
              onClick={() => {
                soundManager.playTap();
                setShowAddProductModal(true);
              }}
              className="btn-brand"
            >
              <Plus size={16} />
              <span>Nuevo Producto</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {products
              .filter((p) => p.merchant_id === merchant.id)
              .map((prod) => (
                <div key={prod.id} className="glass-panel" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <img
                    src={prod.image_url}
                    alt={prod.name}
                    style={{ width: 68, height: 68, borderRadius: 8, objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5 style={{ fontSize: 14, marginBottom: 2 }}>{prod.name}</h5>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 15, color: 'var(--brand-orange)' }}>
                        ${prod.price.toFixed(2)}
                      </strong>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#FBBF24' }}>
                        · {formatBs(prod.price)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: prod.is_available ? '#10B981' : '#EF4444' }}>
                        {prod.is_available ? '● Disponible' : '○ Agotado'}
                      </span>
                      <button
                        onClick={() => onUpdateProduct(prod.id, { is_available: !prod.is_available })}
                        style={{ background: 'none', color: 'var(--text-muted)', fontSize: 12 }}
                      >
                        Cambiar estado
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab: Stats */}
      {activeTab === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div className="glass-panel" style={{ padding: 20 }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ventas Totales</span>
            <h3 style={{ fontSize: 26, color: '#10B981', marginTop: 4 }}>${totalSales.toFixed(2)}</h3>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#FBBF24' }}>{formatBs(totalSales)}</span>
          </div>

          <div className="glass-panel" style={{ padding: 20 }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Órdenes Despachadas</span>
            <h3 style={{ fontSize: 26, color: 'var(--brand-orange)', marginTop: 4 }}>{completedOrders.length}</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Calificación 4.9 ★</span>
          </div>

          <div className="glass-panel" style={{ padding: 20 }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Costo de Plataforma</span>
            <h3 style={{ fontSize: 26, color: '#38BDF8', marginTop: 4 }}>$0.00 / mes</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sin comisiones ocultas</span>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: 17 }}>Agregar Nuevo Producto al Menú</h3>
              <button onClick={() => setShowAddProductModal(false)} className="btn-icon">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Nombre del Producto</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Hamburguesa Triple Especial con Queso de Mano"
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Descripción & Ingredientes</label>
                  <textarea
                    placeholder="Describe los ingredientes, tamaño o detalles..."
                    value={newProductForm.description}
                    onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Precio en Dólares ($)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.5"
                    required
                    placeholder="Ej: 6.50"
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                    className="input-field"
                  />
                </div>

                {/* Photo uploader with WebP compression */}
                <div className="input-group">
                  <label className="input-label">Foto del Plato (Comprimida automáticamente &lt; 120KB)</label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: 12,
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-subtle)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: 'var(--text-muted)'
                  }}>
                    <UploadCloud size={18} style={{ color: 'var(--brand-orange)' }} />
                    <span>{isCompressingProductImg ? 'Comprimiendo a WebP...' : 'Seleccionar foto desde galería o cámara'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleProductImageUpload}
                    />
                  </label>

                  {productImagePreview && (
                    <div style={{ marginTop: 8, textAlign: 'center' }}>
                      <img
                        src={productImagePreview}
                        alt="Preview"
                        style={{ maxHeight: 120, borderRadius: 8, objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddProductModal(false)} className="btn-outline">
                  Cancelar
                </button>
                <button type="submit" className="btn-brand">
                  Publicar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pago Movil Receipt Lightbox */}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="modal-content" style={{ maxWidth: 440, padding: 12 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 14 }}>Comprobante de Pago Móvil</strong>
              <button onClick={() => setSelectedReceipt(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <img
              src={selectedReceipt}
              alt="Comprobante Pago Móvil"
              style={{ width: '100%', borderRadius: 8, display: 'block' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
