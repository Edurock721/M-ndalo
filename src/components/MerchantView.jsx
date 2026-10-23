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
  Bell,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { compressImageToWebP } from '../lib/imageCompression';
import { soundManager } from '../lib/soundEffects';
import { handleImageError } from '../lib/imageFallback';

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

  // Edit product state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_available: true
  });
  const [isCompressingEditImg, setIsCompressingEditImg] = useState(false);

  // Delete product confirmation state
  const [productToDelete, setProductToDelete] = useState(null);

  // Filter orders for this merchant
  const merchantOrders = orders.filter((o) => o.merchant_id === merchant?.id);
  const pendingOrders = merchantOrders.filter((o) => o.status === 'pending');
  const activeOrders = merchantOrders.filter((o) => ['accepted', 'preparing', 'ready_for_pickup', 'on_way'].includes(o.status));
  const completedOrders = merchantOrders.filter((o) => o.status === 'delivered');

  // Stats
  const totalSales = completedOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);

  // Handle product image compress for new product
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

  // Handle product image compress for editing product
  const handleEditProductImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingEditImg(true);
      const res = await compressImageToWebP(file);
      setEditProductForm(prev => ({ ...prev, image_url: res.dataUrl }));
      soundManager.playTap();
    } catch (err) {
      console.error('Error compressing edit photo:', err);
      alert('Error al procesar la foto del producto.');
    } finally {
      setIsCompressingEditImg(false);
    }
  };

  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!newProductForm.name.trim() || !newProductForm.price) return;

    onAddProduct({
      merchant_id: merchant.id,
      name: newProductForm.name.trim(),
      description: newProductForm.description.trim(),
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

  const handleOpenEdit = (prod) => {
    soundManager.playTap();
    setEditingProduct(prod);
    setEditProductForm({
      name: prod.name || '',
      description: prod.description || '',
      price: prod.price !== undefined ? prod.price.toString() : '',
      image_url: prod.image_url || '',
      is_available: prod.is_available ?? true
    });
  };

  const handleSaveEditProduct = (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editProductForm.name.trim() || !editProductForm.price) return;

    onUpdateProduct(editingProduct.id, {
      name: editProductForm.name.trim(),
      description: editProductForm.description.trim(),
      price: parseFloat(editProductForm.price),
      image_url: editProductForm.image_url,
      is_available: editProductForm.is_available
    });

    setEditingProduct(null);
    soundManager.playSuccessFanfare();
  };

  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    onDeleteProduct(productToDelete.id);
    setProductToDelete(null);
    soundManager.playTap();
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
              onError={(e) => handleImageError(e, 'store')}
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
                padding: '9px 18px',
                borderRadius: 12,
                fontSize: 13.5,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                background: activeTab === tab.id ? '#A855F7' : 'transparent',
                color: activeTab === tab.id ? '#FFFFFF' : '#CBD5E1',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span style={{
                  background: '#EF4444',
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

      {/* Tab: Orders Management */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Pending Alert Section */}
          {pendingOrders.length > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 20,
              padding: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#F87171', fontWeight: 900, fontSize: 16 }}>
                <Bell size={20} className="pulse-alert" />
                <span>NUEVOS PEDIDOS ENTRANTES ({pendingOrders.length})</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 14 }}>
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
          {/* Header del Catálogo con Espaciado Responsivo y Botón Grande */}
          <div className="bg-[#0D1424] border border-[#233352] rounded-3xl p-5 sm:p-6 shadow-xl mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold mb-1.5">
                  <Package size={14} />
                  Gestión de Menú e Inventario
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Tus Productos y Catálogo Digital
                </h3>
                <p className="text-xs sm:text-sm text-gray-300">
                  Agrega platos, actualiza precios, controla disponibilidad y fotos en WebP
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setShowAddProductModal(true);
                }}
                className="btn-brand w-full sm:w-auto min-h-[48px] shadow-lg shadow-orange-500/25 cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                <span>+ Agregar Nuevo Producto</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 18 }}>
            {products
              .filter((p) => p.merchant_id === merchant?.id || p.merchant_id === merchant?.owner_id || (!p.merchant_id && merchant?.id === 'merch-1'))
              .map((prod) => (
                <div 
                  key={prod.id} 
                  className="glass-panel" 
                  style={{ 
                    padding: 16, 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 20,
                    background: '#0E1526',
                    border: '1.5px solid #233352'
                  }}
                >
                  {/* Imagen del plato con badge de disponibilidad */}
                  <div style={{ position: 'relative', height: 160, borderRadius: 14, overflow: 'hidden', marginBottom: 14, background: '#141E33' }}>
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      onError={(e) => handleImageError(e, 'product')}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span 
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        padding: '4px 10px',
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 800,
                        background: prod.is_available ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                        color: '#FFFFFF',
                        backdropFilter: 'blur(6px)'
                      }}
                    >
                      {prod.is_available ? '● Disponible' : '○ Agotado'}
                    </span>
                  </div>

                  {/* Datos del producto */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>
                      {prod.name}
                    </h4>
                    <p style={{ fontSize: 12.5, color: '#94A3B8', marginBottom: 12, lineHeight: 1.4, flex: 1 }}>
                      {prod.description || 'Sin descripción detallada.'}
                    </p>

                    {/* Precios en USD y Bs */}
                    <div style={{ 
                      padding: '8px 12px', 
                      borderRadius: 12, 
                      background: '#141E34', 
                      border: '1px solid #253554', 
                      marginBottom: 14,
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-orange)' }}>
                        ${Number(prod.price || 0).toFixed(2)} USD
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: '#FBBF24' }}>
                        {formatBs(prod.price)}
                      </span>
                    </div>

                    {/* Barra de Acciones: Disponibilidad, Editar, Eliminar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => onUpdateProduct(prod.id, { is_available: !prod.is_available })}
                        className="btn-outline"
                        style={{ padding: '8px 12px', fontSize: 12, height: 42 }}
                        title="Cambiar disponibilidad"
                      >
                        {prod.is_available ? 'Pausar' : 'Activar'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(prod)}
                        className="btn-info"
                        style={{ height: 42, fontSize: 12.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <Pencil size={14} />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setProductToDelete(prod)}
                        className="btn-danger"
                        style={{ height: 42, padding: '0 12px' }}
                        title="Eliminar producto del menú"
                      >
                        <Trash2 size={16} />
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

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60A5FA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17 }}>Editar Producto del Menú</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Actualiza el precio, descripción, disponibilidad y foto
                  </p>
                </div>
              </div>
              <button onClick={() => setEditingProduct(null)} className="btn-icon">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    value={editProductForm.name}
                    onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                    className="input-field"
                    placeholder="Ej: Hamburguesa Doble con Queso"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Descripción & Ingredientes</label>
                  <textarea
                    rows={2}
                    value={editProductForm.description}
                    onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                    className="input-field"
                    placeholder="Ingredientes, acompañamientos o tamaño..."
                    style={{ height: 'auto', padding: '10px 14px' }}
                  />
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="input-label">Precio en Dólares ($) *</label>
                    <span style={{ fontSize: 12, color: '#FBBF24', fontWeight: 800 }}>
                      Equivale a: {formatBs(parseFloat(editProductForm.price) || 0)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.25"
                    min="0.5"
                    required
                    value={editProductForm.price}
                    onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })}
                    className="input-field"
                    placeholder="6.50"
                  />
                </div>

                {/* Disponibilidad toggle */}
                <div className="input-group" style={{ marginBottom: 16 }}>
                  <label className="input-label">Disponibilidad en el Catálogo</label>
                  <button
                    type="button"
                    onClick={() => setEditProductForm({ ...editProductForm, is_available: !editProductForm.is_available })}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 14,
                      background: editProductForm.is_available ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: editProductForm.is_available ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1.5px solid rgba(239, 68, 68, 0.4)',
                      color: editProductForm.is_available ? '#34D399' : '#F87171',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: 13 }}>
                      {editProductForm.is_available ? '● Producto Disponible para Clientes' : '○ Producto Marcado como Agotado'}
                    </span>
                    <span style={{ fontSize: 12, textDecoration: 'underline' }}>
                      {editProductForm.is_available ? 'Desactivar' : 'Activar'}
                    </span>
                  </button>
                </div>

                {/* Photo uploader with WebP compression */}
                <div className="input-group">
                  <label className="input-label">Foto del Plato (Auto WebP &lt; 120KB)</label>
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
                    <span>{isCompressingEditImg ? 'Comprimiendo a WebP...' : 'Cambiar foto desde galería o cámara'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleEditProductImageUpload}
                    />
                  </label>

                  {editProductForm.image_url && (
                    <div style={{ marginTop: 10, textAlign: 'center' }}>
                      <img
                        src={editProductForm.image_url}
                        alt="Preview"
                        onError={(e) => handleImageError(e, 'product')}
                        style={{ maxHeight: 130, borderRadius: 10, objectFit: 'cover', margin: '0 auto', border: '1px solid var(--border-subtle)' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setEditingProduct(null)} className="btn-outline">
                  Cancelar
                </button>
                <button type="submit" className="btn-brand">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="modal-content" style={{ maxWidth: 440, padding: 24, textAlign: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid rgba(239, 68, 68, 0.4)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Trash2 size={26} />
            </div>

            <h3 style={{ fontSize: 19, fontWeight: 900, marginBottom: 8 }}>
              ¿Eliminar "{productToDelete.name}"?
            </h3>
            <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5, marginBottom: 20 }}>
              Este producto se retirará inmediatamente del catálogo y los clientes ya no podrán seleccionarlo. Esta acción no se puede deshacer.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="btn-outline"
                style={{ height: 46 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn-danger"
                style={{ height: 46, fontWeight: 800 }}
              >
                Sí, Eliminar
              </button>
            </div>
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
