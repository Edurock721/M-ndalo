import React, { useState } from 'react';
import { 
  Search, 
  Store, 
  Bike, 
  Clock, 
  MapPin, 
  Star, 
  Plus, 
  MessageSquare, 
  Package, 
  Sparkles, 
  X, 
  UploadCloud, 
  Check, 
  DollarSign,
  ChevronRight,
  AlertCircle,
  User,
  Users,
  Car,
  AlertTriangle
} from 'lucide-react';
import { compressImageToWebP } from '../lib/imageCompression';
import { soundManager } from '../lib/soundEffects';
import { GpsLocationPicker } from './GpsLocationPicker';
import { handleImageError } from '../lib/imageFallback';

export function ClientView({ 
  merchants, 
  products, 
  orders, 
  currentUser, 
  onAddToCart, 
  onCreateOrder, 
  onOpenChat,
  exchangeRate = 884.75
}) {
  const formatBs = (usd) => `Bs. ${(Number(usd || 0) * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatUSD = (usd) => `$${Number(usd || 0).toFixed(2)}`;
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [showMandaditoModal, setShowMandaditoModal] = useState(false);
  const [itemNote, setItemNote] = useState({});

  // Mandadito & Ride Form State
  const [mandaditoForm, setMandaditoForm] = useState({
    order_type: 'mandadito', // 'mandadito' | 'ride'
    cargo_size: 'small', // 'small' | 'heavy'
    passenger_count: 1, // 1, 2, 3, 4
    pickup_address: '',
    delivery_address: '',
    task_description: '',
    notes: '',
    purchase_budget: '0.00',
    payment_method: 'pago_movil',
    payment_receipt_url: null,
    pago_movil_ref: ''
  });
  const [mandaditoReceiptPreview, setMandaditoReceiptPreview] = useState(null);
  const [mandaditoPickupCoords, setMandaditoPickupCoords] = useState(null);
  const [mandaditoDeliveryCoords, setMandaditoDeliveryCoords] = useState(null);
  const [isCompressingReceipt, setIsCompressingReceipt] = useState(false);

  // Categories
  const categories = ['Todos', 'Comida Rápida', 'Salud & Farmacia', 'Licores & Snacks', 'Panadería & Café'];

  // Filter merchants
  const filteredMerchants = merchants.filter((m) => {
    if (!m.is_active) return false;
    const matchesCategory = selectedCategory === 'Todos' || m.category === selectedCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Client's active orders
  const clientOrders = orders.filter((o) => o.client_id === currentUser.id);

  // Mandadito receipt compression handler
  const handleMandaditoReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingReceipt(true);
      const res = await compressImageToWebP(file);
      setMandaditoReceiptPreview(res.dataUrl);
      setMandaditoForm(prev => ({ ...prev, payment_receipt_url: res.dataUrl }));
      soundManager.playTap();
    } catch (err) {
      console.error('Error compressing receipt:', err);
      alert('Error al procesar el comprobante.');
    } finally {
      setIsCompressingReceipt(false);
    }
  };

  const handleCreateMandaditoSubmit = (e) => {
    e.preventDefault();
    const isRide = mandaditoForm.order_type === 'ride';
    const isHeavy = mandaditoForm.cargo_size === 'heavy';

    if (!mandaditoForm.pickup_address.trim() || !mandaditoForm.delivery_address.trim()) {
      alert('Por favor completa las direcciones de origen y destino.');
      return;
    }

    const budget = parseFloat(mandaditoForm.purchase_budget) || 0;
    let delivery_fee = 2.00;
    if (isRide) {
      delivery_fee = (mandaditoForm.passenger_count > 2) ? 3.50 : 2.50;
    } else if (isHeavy) {
      delivery_fee = 3.50;
    }
    const platform_fee = 0.50;
    const total = (isRide ? 0 : budget) + delivery_fee + platform_fee;

    const taskDesc = mandaditoForm.task_description.trim() || (isRide 
      ? `Carrera para ${mandaditoForm.passenger_count || 1} persona(s)`
      : isHeavy 
      ? 'Traslado de carga pesada / bultos' 
      : 'Envío de encomienda ligera');

    onCreateOrder({
      order_type: mandaditoForm.order_type,
      client_id: currentUser.id,
      client_name: currentUser.full_name,
      client_phone: currentUser.phone,
      merchant_id: null,
      merchant_name: null,
      rider_id: null,
      rider_name: null,
      pickup_address: mandaditoForm.pickup_address,
      pickup_coords: mandaditoPickupCoords,
      delivery_address: mandaditoForm.delivery_address,
      delivery_coords: mandaditoDeliveryCoords,
      task_description: taskDesc,
      passenger_count: isRide ? Number(mandaditoForm.passenger_count || 1) : 0,
      cargo_size: isRide ? 'small' : (mandaditoForm.cargo_size || 'small'),
      notes: mandaditoForm.notes || '',
      purchase_budget: isRide ? 0 : budget,
      subtotal: 0,
      delivery_fee,
      platform_fee,
      total,
      payment_method: mandaditoForm.payment_method,
      payment_receipt_url: mandaditoForm.payment_receipt_url,
      pago_movil_ref: mandaditoForm.pago_movil_ref || null
    });

    setShowMandaditoModal(false);
    setMandaditoForm({
      order_type: 'mandadito',
      cargo_size: 'small',
      passenger_count: 1,
      pickup_address: '',
      delivery_address: '',
      task_description: '',
      notes: '',
      purchase_budget: '0.00',
      payment_method: 'pago_movil',
      payment_receipt_url: null,
      pago_movil_ref: ''
    });
    setMandaditoPickupCoords(null);
    setMandaditoDeliveryCoords(null);
    setMandaditoReceiptPreview(null);
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Banner with Quick Actions */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 94, 54, 0.15) 0%, rgba(255, 42, 84, 0.1) 50%, rgba(121, 40, 202, 0.1) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 20px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255, 94, 54, 0.2)', padding: '5px 12px', borderRadius: 'var(--radius-full)', color: 'var(--brand-orange)', fontSize: 11.5, fontWeight: 800, marginBottom: 12, border: '1px solid rgba(255, 94, 54, 0.3)' }}>
            <Sparkles size={14} />
            TODO TU PUEBLO EN TUS MANOS
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 900, marginBottom: 10, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            ¿Qué necesitas hoy, {currentUser?.name?.split(' ')[0] || currentUser?.full_name?.split(' ')[0] || 'Cliente'}? 👋
          </h2>
          <p style={{ fontSize: 14.5, color: '#CBD5E1', marginBottom: 22, lineHeight: 1.5 }}>
            Pide en tus tiendas locales favoritas con catálogo digital o solicita un mandadito particular punto a punto sin intermediarios.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                soundManager.playTap();
                const el = document.getElementById('comercios-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-brand"
            >
              <Store size={18} />
              <span>Explorar Comercios</span>
            </button>

            <button
              onClick={() => {
                soundManager.playTap();
                setMandaditoForm(prev => ({
                  ...prev,
                  order_type: 'mandadito',
                  cargo_size: 'small',
                  passenger_count: 0
                }));
                setShowMandaditoModal(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
                color: '#000000',
                fontWeight: 800,
                fontSize: 14,
                padding: '12px 22px',
                borderRadius: 14,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(0, 242, 254, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Bike size={18} />
              <span>Pedir Mandadito / Carga</span>
            </button>

            <button
              onClick={() => {
                soundManager.playTap();
                setMandaditoForm(prev => ({
                  ...prev,
                  order_type: 'ride',
                  cargo_size: 'small',
                  passenger_count: 1
                }));
                setShowMandaditoModal(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 14,
                padding: '12px 22px',
                borderRadius: 14,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <User size={18} />
              <span>Pedir Carrera / Taxi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Orders Section */}
      {clientOrders.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={20} style={{ color: 'var(--brand-orange)' }} />
              Mis Pedidos en Curso ({clientOrders.length})
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 18 }}>
            {clientOrders.map((ord) => {
              const isMandadito = ord.order_type === 'mandadito';

              return (
                <div key={ord.id} className="glass-panel" style={{ padding: 20, background: '#0E1526', border: '1.5px solid #233352' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#FFFFFF' }}>
                          {isMandadito ? 'Mandadito Express' : ord.merchant_name}
                        </span>
                      </div>
                      <span style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2, display: 'block' }}>
                        #{ord.id.slice(-6).toUpperCase()} • {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <span className={`badge ${
                      ord.status === 'delivered' ? 'badge-delivered' :
                      ord.status === 'on_way' ? 'badge-onway' :
                      ord.status === 'ready_for_pickup' ? 'badge-ready' :
                      ord.status === 'preparing' ? 'badge-preparing' : 'badge-pending'
                    }`}>
                      {ord.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Order summary */}
                  <div style={{ fontSize: 13, color: '#CBD5E1', marginBottom: 16, background: '#141F38', border: '1px solid #253554', padding: 12, borderRadius: 14 }}>
                    {isMandadito ? (
                      <p><strong>Tarea:</strong> {ord.task_description}</p>
                    ) : (
                      <p><strong>Artículos:</strong> {ord.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                    )}
                    <p style={{ marginTop: 6 }}><strong>Destino:</strong> {ord.delivery_address}</p>
                  </div>

                  {/* Rider info if assigned */}
                  {ord.rider_name && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12.5,
                      color: '#38BDF8',
                      marginBottom: 16,
                      padding: '8px 12px',
                      borderRadius: 12,
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)'
                    }}>
                      <Bike size={16} />
                      <span>Rider asignado: <strong>{ord.rider_name}</strong></span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1E293B', paddingTop: 14 }}>
                    <div>
                      <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Total</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 17, color: 'var(--brand-orange)', fontFamily: 'monospace' }}>
                          {formatUSD(ord.total)}
                        </strong>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#FBBF24' }}>
                          · {formatBs(ord.total)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        soundManager.playTap();
                        onOpenChat(ord);
                      }}
                      className="btn-outline"
                      style={{ fontSize: 12.5, padding: '8px 16px' }}
                    >
                      <MessageSquare size={15} style={{ color: 'var(--brand-orange)' }} />
                      <span>Chat en Vivo</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comercios Aliados Section */}
      <div id="comercios-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF' }}>Comercios Locales Aliados</h3>
            <p style={{ fontSize: 13.5, color: '#94A3B8' }}>Compra directo sin comisiones abusivas</p>
          </div>

          {/* Search bar */}
          <div style={{
            position: 'relative',
            flex: '1 1 280px',
            maxWidth: 380
          }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Buscar tienda, comida o medicina..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 46, borderRadius: 16, height: 48, fontSize: 13.5 }}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingBottom: 10,
          marginBottom: 24,
          WebkitOverflowScrolling: 'touch'
        }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                soundManager.playTap();
                setSelectedCategory(cat);
              }}
              style={{
                padding: '9px 18px',
                borderRadius: 14,
                fontSize: 13.5,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                background: selectedCategory === cat ? 'var(--brand-gradient)' : '#141F38',
                color: selectedCategory === cat ? '#FFFFFF' : '#CBD5E1',
                border: selectedCategory === cat ? '1px solid rgba(255,255,255,0.3)' : '1.5px solid #2B3D5D',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: selectedCategory === cat ? '0 4px 14px rgba(255, 94, 54, 0.35)' : 'none'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Merchants Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
          gap: 20
        }}>
          {filteredMerchants.map((merchant) => (
            <div
              key={merchant.id}
              className="glass-panel"
              onClick={() => {
                soundManager.playTap();
                setSelectedMerchant(merchant);
              }}
              style={{
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'transform 0.2s, border-color 0.2s',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {/* Banner */}
              <div style={{ height: 140, position: 'relative', overflow: 'hidden' }}>
                <img
                  src={merchant.banner_url}
                  alt={merchant.name}
                  onError={(e) => handleImageError(e, 'store')}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(16, 22, 38, 0.9) 0%, transparent 60%)'
                }} />
                <span style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: '#FBBF24'
                }}>
                  <Star size={12} fill="#FBBF24" strokeWidth={0} />
                  {merchant.rating}
                </span>
                <span style={{
                  position: 'absolute',
                  bottom: 10,
                  left: 12,
                  background: 'rgba(255, 94, 54, 0.9)',
                  color: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700
                }}>
                  {merchant.category}
                </span>
              </div>

              {/* Info */}
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: 16, marginBottom: 4 }}>{merchant.name}</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                    <MapPin size={13} style={{ color: 'var(--brand-orange)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {merchant.address}
                    </span>
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 10,
                  fontSize: 12,
                  color: 'var(--text-dim)'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={13} />
                    {merchant.delivery_time}
                  </span>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>
                    Delivery ${merchant.delivery_fee.toFixed(2)} · <span style={{ fontSize: 11, color: '#6EE7B7' }}>{formatBs(merchant.delivery_fee)}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Merchant Products Modal */}
      {selectedMerchant && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 640, height: '90vh' }}>
            <div className="modal-header" style={{ position: 'relative', padding: 0, height: 160, overflow: 'hidden' }}>
              <img
                src={selectedMerchant.banner_url}
                alt={selectedMerchant.name}
                onError={(e) => handleImageError(e, 'store')}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(16, 22, 38, 0.95) 15%, rgba(0,0,0,0.3) 100%)'
              }} />
              <button
                onClick={() => setSelectedMerchant(null)}
                className="btn-icon"
                style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)' }}
              >
                <X size={20} />
              </button>
              <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
                <span className="badge badge-mandadito" style={{ marginBottom: 6 }}>
                  {selectedMerchant.category}
                </span>
                <h3 style={{ fontSize: 20, color: '#FFFFFF' }}>{selectedMerchant.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedMerchant.address}</p>
              </div>
            </div>

            <div className="modal-body" style={{ padding: 18 }}>
              <h4 style={{ fontSize: 16, marginBottom: 14 }}>Catálogo Digital Disponible</h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {products
                  .filter((p) => p.merchant_id === selectedMerchant.id && p.is_available)
                  .map((product) => {
                    return (
                      <div
                        key={product.id}
                        className="glass-panel"
                        style={{
                          padding: 12,
                          display: 'flex',
                          gap: 12,
                          alignItems: 'center',
                          background: 'rgba(255, 255, 255, 0.02)'
                        }}
                      >
                        <img
                          src={product.image_url}
                          alt={product.name}
                          onError={(e) => handleImageError(e, 'product')}
                          style={{
                            width: 76,
                            height: 76,
                            borderRadius: 'var(--radius-md)',
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h5 style={{ fontSize: 15, marginBottom: 2 }}>{product.name}</h5>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.3 }}>
                            {product.description}
                          </p>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                            <div>
                              <strong style={{ fontSize: 16, color: 'var(--brand-orange)' }}>
                                ${product.price.toFixed(2)}
                              </strong>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#FBBF24', marginLeft: 8 }}>
                                · {formatBs(product.price)}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                soundManager.playTap();
                                onAddToCart(product, selectedMerchant, itemNote[product.id] || '');
                                setItemNote(prev => ({ ...prev, [product.id]: '' }));
                              }}
                              className="btn-brand"
                              style={{ padding: '6px 14px', fontSize: 12.5 }}
                            >
                              <Plus size={15} />
                              <span>Agregar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedMerchant(null)} className="btn-outline">
                Cerrar Menú
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pedir Mandadito Modal */}
      {showMandaditoModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: mandaditoForm.order_type === 'ride'
                    ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
                    : mandaditoForm.cargo_size === 'heavy'
                    ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                    : 'linear-gradient(135deg, #00F2FE, #4FACFE)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: mandaditoForm.order_type === 'ride' || mandaditoForm.cargo_size === 'heavy' ? '#FFFFFF' : '#000000'
                }}>
                  {mandaditoForm.order_type === 'ride' ? <User size={20} /> : mandaditoForm.cargo_size === 'heavy' ? <AlertTriangle size={20} /> : <Bike size={20} />}
                </div>
                <div>
                  <h3 style={{ fontSize: 17 }}>
                    {mandaditoForm.order_type === 'ride' ? 'Pedir Carrera / Taxi' : 'Pedir Mandadito o Carga'}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {mandaditoForm.order_type === 'ride' 
                      ? 'Traslados particulares y mototaxi con conductores verificados' 
                      : 'Transporte de encomiendas y diligencias en tu zona'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowMandaditoModal(false)} className="btn-icon">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMandaditoSubmit}>
              <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
                {/* 1. Selector: ¿Qué vas a trasladar? */}
                <div style={{ marginBottom: 16 }}>
                  <label className="input-label" style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, display: 'block' }}>
                    ¿Qué vas a trasladar?
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {/* Persona(s) */}
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setMandaditoForm(prev => ({
                          ...prev,
                          order_type: 'ride',
                          cargo_size: 'small',
                          passenger_count: prev.passenger_count || 1
                        }));
                      }}
                      style={{
                        padding: '12px 6px',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        border: mandaditoForm.order_type === 'ride' ? '2px solid #3B82F6' : '1px solid var(--border-subtle)',
                        background: mandaditoForm.order_type === 'ride' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                        color: mandaditoForm.order_type === 'ride' ? '#60A5FA' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <User size={20} style={{ margin: '0 auto 4px', display: 'block' }} />
                      <strong style={{ fontSize: 12, display: 'block' }}>Persona(s)</strong>
                      <span style={{ fontSize: 10, opacity: 0.8 }}>Carrera / Taxi</span>
                    </button>

                    {/* Paquete Ligero */}
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setMandaditoForm(prev => ({
                          ...prev,
                          order_type: 'mandadito',
                          cargo_size: 'small',
                          passenger_count: 0
                        }));
                      }}
                      style={{
                        padding: '12px 6px',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        border: mandaditoForm.order_type === 'mandadito' && mandaditoForm.cargo_size === 'small' ? '2px solid #10B981' : '1px solid var(--border-subtle)',
                        background: mandaditoForm.order_type === 'mandadito' && mandaditoForm.cargo_size === 'small' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                        color: mandaditoForm.order_type === 'mandadito' && mandaditoForm.cargo_size === 'small' ? '#34D399' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Package size={20} style={{ margin: '0 auto 4px', display: 'block' }} />
                      <strong style={{ fontSize: 12, display: 'block' }}>Paquete ligero</strong>
                      <span style={{ fontSize: 10, opacity: 0.8 }}>Sobre / Comida</span>
                    </button>

                    {/* Carga Pesada */}
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setMandaditoForm(prev => ({
                          ...prev,
                          order_type: 'mandadito',
                          cargo_size: 'heavy',
                          passenger_count: 0
                        }));
                      }}
                      style={{
                        padding: '12px 6px',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        border: mandaditoForm.order_type === 'mandadito' && mandaditoForm.cargo_size === 'heavy' ? '2px solid #F59E0B' : '1px solid var(--border-subtle)',
                        background: mandaditoForm.order_type === 'mandadito' && mandaditoForm.cargo_size === 'heavy' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                        color: mandaditoForm.order_type === 'mandadito' && mandaditoForm.cargo_size === 'heavy' ? '#FBBF24' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <AlertTriangle size={20} style={{ margin: '0 auto 4px', display: 'block' }} />
                      <strong style={{ fontSize: 12, display: 'block' }}>Carga pesada</strong>
                      <span style={{ fontSize: 10, opacity: 0.8 }}>Repuesto / Bultos</span>
                    </button>
                  </div>
                </div>

                {/* Si es Persona(s): Selector de cantidad y recomendación automática */}
                {mandaditoForm.order_type === 'ride' && (
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    marginBottom: 16
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#93C5FD' }}>
                        Número de pasajeros:
                      </label>
                      <span style={{ fontSize: 12, color: '#60A5FA', fontWeight: 800 }}>
                        {mandaditoForm.passenger_count || 1} {mandaditoForm.passenger_count === 1 ? 'Pasajero' : 'Pasajeros'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {[1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            soundManager.playTap();
                            setMandaditoForm(prev => ({ ...prev, passenger_count: num }));
                          }}
                          style={{
                            padding: '8px',
                            borderRadius: 'var(--radius-sm)',
                            border: mandaditoForm.passenger_count === num ? '2px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
                            background: mandaditoForm.passenger_count === num ? '#3B82F6' : 'rgba(255,255,255,0.05)',
                            color: mandaditoForm.passenger_count === num ? '#FFFFFF' : 'var(--text-main)',
                            fontWeight: 800,
                            fontSize: 13,
                            cursor: 'pointer'
                          }}
                        >
                          {num} {num === 1 ? '👤' : '👥'}
                        </button>
                      ))}
                    </div>

                    {mandaditoForm.passenger_count > 1 ? (
                      <div style={{
                        marginTop: 10,
                        padding: '8px 10px',
                        borderRadius: 6,
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        fontSize: 11.5,
                        color: '#FBBF24',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <Car size={16} style={{ flexShrink: 0 }} />
                        <span><strong>Recomendación automática:</strong> Se recomienda solicitar vehículo de 4 ruedas, pero tu pedido no se bloquea y los conductores decidirán.</span>
                      </div>
                    ) : (
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, margin: '8px 0 0' }}>
                        ✓ 1 Pasajero: Apto para mototaxi o carro según tu preferencia.
                      </p>
                    )}
                  </div>
                )}

                {/* Si es Carga pesada: Recomendación automática */}
                {mandaditoForm.order_type === 'mandadito' && mandaditoForm.cargo_size === 'heavy' && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: '#FBBF24'
                  }}>
                    <Car size={18} style={{ flexShrink: 0 }} />
                    <span><strong>Recomendación automática:</strong> Carga de volumen o peso considerable. Se recomienda vehículo de 4 ruedas, pero tu pedido no se bloquea.</span>
                  </div>
                )}

                {/* Direcciones con GPS */}
                <GpsLocationPicker
                  label={mandaditoForm.order_type === 'ride' ? '¿Dónde te recogemos? (Punto de Salida)' : 'Punto de Retiro (Origen)'}
                  placeholder="Ej: Plaza Bolívar frente a la Catedral / Farmatodo"
                  value={mandaditoForm.pickup_address}
                  onChange={(val) => setMandaditoForm(prev => ({ ...prev, pickup_address: val }))}
                  coords={mandaditoPickupCoords}
                  onCoordsChange={setMandaditoPickupCoords}
                  helperText="Usa el GPS para fijar tu punto de salida con precisión milimétrica"
                  required
                />

                <GpsLocationPicker
                  label={mandaditoForm.order_type === 'ride' ? '¿A dónde te llevamos? (Destino del viaje)' : 'Punto de Entrega (Destino)'}
                  placeholder="Ej: Urb. Las Acacias, Calle 4, Casa #12 (portón blanco)"
                  value={mandaditoForm.delivery_address}
                  onChange={(val) => setMandaditoForm(prev => ({ ...prev, delivery_address: val }))}
                  coords={mandaditoDeliveryCoords}
                  onCoordsChange={setMandaditoDeliveryCoords}
                  helperText="Usa el GPS para fijar tu destino exacto con precisión satelital"
                  required
                />

                <div className="input-group">
                  <label className="input-label">
                    {mandaditoForm.order_type === 'ride' 
                      ? 'Referencia o punto de encuentro' 
                      : 'Descripción de la tarea / ¿Qué debemos trasladar?'}
                  </label>
                  <textarea
                    placeholder={mandaditoForm.order_type === 'ride'
                      ? 'Ej: Salgo por la puerta norte, llevo morral pequeño...'
                      : mandaditoForm.cargo_size === 'heavy'
                      ? 'Ej: Traslado de 2 baterías pesadas y repuestos en caja grande...'
                      : 'Ej: Retirar paquete en MRW guía #1092 o comprar medicinas...'}
                    value={mandaditoForm.task_description}
                    onChange={(e) => setMandaditoForm({ ...mandaditoForm, task_description: e.target.value })}
                    className="input-field"
                    style={{ minHeight: 70 }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Notas adicionales para el conductor (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Pago con billete de $10 exacto / Tocar corneta al llegar"
                    value={mandaditoForm.notes || ''}
                    onChange={(e) => setMandaditoForm({ ...mandaditoForm, notes: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: mandaditoForm.order_type === 'ride' ? '1fr' : '1fr 1fr', gap: 12 }}>
                  {mandaditoForm.order_type !== 'ride' && (
                    <div className="input-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="input-label">Presupuesto compras ($)</label>
                        <span style={{ fontSize: 11, color: '#FBBF24', fontWeight: 700 }}>
                          {formatBs(parseFloat(mandaditoForm.purchase_budget) || 0)}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="0.00 si solo traslado"
                        value={mandaditoForm.purchase_budget}
                        onChange={(e) => setMandaditoForm({ ...mandaditoForm, purchase_budget: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  )}

                  <div className="input-group">
                    <label className="input-label">Método de Pago</label>
                    <select
                      value={mandaditoForm.payment_method}
                      onChange={(e) => setMandaditoForm({ ...mandaditoForm, payment_method: e.target.value })}
                      className="input-field"
                      style={{ background: 'var(--bg-surface-elevated)' }}
                    >
                      <option value="pago_movil">Pago Móvil (Bs)</option>
                      <option value="cash_usd">Efectivo USD ($)</option>
                      <option value="cash_bs">Efectivo Bolívares (Bs)</option>
                    </select>
                  </div>
                </div>

                {/* Pago Movil comprobante uploader if selected */}
                {mandaditoForm.payment_method === 'pago_movil' && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                    marginBottom: 16
                  }}>
                    <label className="input-label" style={{ color: 'var(--brand-orange)' }}>
                      Datos Pago Móvil MÁNDALO!: Banesco (0134) • 0414-5551234 • CI: 22.333.444
                    </label>
                    <input
                      type="text"
                      placeholder="Número de Referencia (últimos 6 dígitos)"
                      value={mandaditoForm.pago_movil_ref}
                      onChange={(e) => setMandaditoForm({ ...mandaditoForm, pago_movil_ref: e.target.value })}
                      className="input-field"
                      style={{ marginBottom: 10 }}
                    />

                    {/* Image compressor uploader */}
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: 10,
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--border-subtle)',
                      background: 'rgba(0, 242, 254, 0.05)',
                      cursor: 'pointer',
                      fontSize: 12.5,
                      color: '#38BDF8'
                    }}>
                      <UploadCloud size={18} />
                      <span>{isCompressingReceipt ? 'Comprimiendo a WebP...' : 'Adjuntar captura de Pago Móvil (Auto WebP < 120KB)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleMandaditoReceiptUpload}
                      />
                    </label>

                    {mandaditoReceiptPreview && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img
                          src={mandaditoReceiptPreview}
                          alt="Comprobante"
                          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                        />
                        <span style={{ fontSize: 12, color: '#10B981' }}>✓ Comprobante optimizado en WebP</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Cost Breakdown */}
                {(() => {
                  const isRide = mandaditoForm.order_type === 'ride';
                  const isHeavy = mandaditoForm.cargo_size === 'heavy';
                  const deliveryFee = isRide ? (mandaditoForm.passenger_count > 2 ? 3.50 : 2.50) : isHeavy ? 3.50 : 2.00;
                  const platformFee = 0.50;
                  const budget = isRide ? 0 : (parseFloat(mandaditoForm.purchase_budget) || 0);
                  const total = deliveryFee + platformFee + budget;

                  return (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      padding: 14,
                      borderRadius: 'var(--radius-md)',
                      fontSize: 13
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--text-muted)' }}>
                        <span>{isRide ? 'Tarifa Carrera / Traslado:' : isHeavy ? 'Tarifa Carga Pesada:' : 'Tarifa Mandadito Ligero:'}</span>
                        <span>${deliveryFee.toFixed(2)} · <strong style={{ color: '#E2E8F0' }}>{formatBs(deliveryFee)}</strong></span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--text-muted)' }}>
                        <span>Comisión de Servicio:</span>
                        <span>${platformFee.toFixed(2)} · <strong style={{ color: '#E2E8F0' }}>{formatBs(platformFee)}</strong></span>
                      </div>
                      {budget > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--text-muted)' }}>
                          <span>Presupuesto Compras:</span>
                          <span>${budget.toFixed(2)} · <strong style={{ color: '#E2E8F0' }}>{formatBs(budget)}</strong></span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 8, fontWeight: 800 }}>
                        <span>Total Estimado:</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: isRide ? '#60A5FA' : '#00F2FE', fontSize: 17 }}>
                            ${total.toFixed(2)}
                          </span>
                          <div style={{ color: '#FBBF24', fontSize: 12.5, fontWeight: 700 }}>
                            {formatBs(total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowMandaditoModal(false)} className="btn-outline">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-brand"
                  style={{
                    background: mandaditoForm.order_type === 'ride'
                      ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
                      : mandaditoForm.cargo_size === 'heavy'
                      ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                      : 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
                    color: mandaditoForm.order_type === 'ride' || mandaditoForm.cargo_size === 'heavy' ? '#FFFFFF' : '#000000',
                    fontWeight: 800
                  }}
                >
                  {mandaditoForm.order_type === 'ride' ? 'Solicitar Carrera Ahora' : 'Publicar Mandadito Ahora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
