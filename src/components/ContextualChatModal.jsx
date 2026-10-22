import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Image as ImageIcon, 
  Store, 
  Bike, 
  User, 
  CheckCheck,
  Zap,
  Phone
} from 'lucide-react';
import { compressImageToWebP } from '../lib/imageCompression';
import { soundManager } from '../lib/soundEffects';

export function ContextualChatModal({ 
  order, 
  currentUser, 
  messages, 
  onSendMessage, 
  onClose 
}) {
  // Determine available channels based on order type and user role
  const isMandadito = order.order_type === 'mandadito';
  
  const availableChannels = isMandadito 
    ? [{ id: 'client_rider', label: 'Cliente ↔ Repartidor', icon: Bike }]
    : [
        { id: 'client_merchant', label: 'Cliente ↔ Comercio', icon: Store },
        { id: 'client_rider', label: 'Cliente ↔ Repartidor', icon: Bike },
        { id: 'merchant_rider', label: 'Comercio ↔ Repartidor', icon: Zap }
      ];

  // Default channel based on current user role
  const getInitialChannel = () => {
    if (isMandadito) return 'client_rider';
    if (currentUser.role === 'merchant') return 'client_merchant';
    if (currentUser.role === 'rider') return 'client_rider';
    return 'client_merchant';
  };

  const [activeChannel, setActiveChannel] = useState(getInitialChannel);
  const [inputText, setInputText] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Filter messages for this order and active channel
  const currentMessages = messages.filter(
    (m) => m.order_id === order.id && m.channel === activeChannel
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length, activeChannel]);

  const handleSend = (textToSend = null, mediaUrl = null) => {
    const text = (textToSend !== null ? textToSend : inputText).trim();
    if (!text && !mediaUrl) return;

    onSendMessage({
      orderId: order.id,
      senderId: currentUser.id,
      senderName: currentUser.full_name,
      senderRole: currentUser.role,
      channel: activeChannel,
      message: text,
      mediaUrl
    });

    if (textToSend === null) {
      setInputText('');
    }
  };

  // Quick reply chips according to role
  const getQuickReplies = () => {
    if (currentUser.role === 'rider') {
      return [
        '🛵 ¡Ya voy en camino!',
        '🚪 Estoy afuera en la dirección',
        '💵 ¿Tiene cambio de $10?',
        '📍 ¿Me confirma el color de la casa?',
        '⏳ Esperando que el local me entregue'
      ];
    }
    if (currentUser.role === 'merchant') {
      return [
        '🍳 Su pedido está en preparación',
        '📦 Pedido empacado y listo para retiro',
        '👍 Recibido el comprobante de Pago Móvil',
        '🥤 ¿Desea salsa extra?'
      ];
    }
    return [
      '🏠 Portón blanco con reja negra',
      '🏃‍♂️ Ya salgo a recibir a la puerta',
      '💵 Tengo el efectivo exacto listo',
      '✅ Pago Móvil realizado y verificado'
    ];
  };

  // Handle photo attachment with mandatory WebP compression < 120KB
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressed = await compressImageToWebP(file);
      handleSend('📷 [Foto adjunta]', compressed.dataUrl);
    } catch (err) {
      console.error('Error compressing chat photo:', err);
      alert('No se pudo procesar la imagen.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 580, height: '85vh' }}>
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 20px', background: 'var(--bg-surface-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              background: isMandadito ? 'linear-gradient(135deg, #00F2FE, #4FACFE)' : 'var(--brand-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              {isMandadito ? <Bike size={20} /> : <Store size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 16 }}>
                  {isMandadito ? 'Mandadito #' + order.id.slice(-4) : (order.merchant_name || 'Comercio')}
                </h3>
                <span className={`badge ${order.order_type === 'mandadito' ? 'badge-mandadito' : 'badge-ready'}`}>
                  {order.status}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {isMandadito ? order.task_description : `Orden #${order.id.slice(-4)}`}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Channel Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: 6,
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.25)',
          borderBottom: '1px solid var(--border-subtle)',
          overflowX: 'auto'
        }}>
          {availableChannels.map((ch) => {
            const Icon = ch.icon;
            const isActive = activeChannel === ch.id;
            const channelMsgCount = messages.filter(
              (m) => m.order_id === order.id && m.channel === ch.id
            ).length;

            return (
              <button
                key={ch.id}
                onClick={() => {
                  soundManager.playTap();
                  setActiveChannel(ch.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 12,
                  fontWeight: 600,
                  background: isActive ? 'var(--brand-orange)' : 'rgba(255, 255, 255, 0.05)',
                  color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                  border: isActive ? '1px solid #FFFFFF' : '1px solid transparent',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={14} />
                <span>{ch.label}</span>
                {channelMsgCount > 0 && (
                  <span style={{
                    fontSize: 10,
                    padding: '1px 5px',
                    borderRadius: 10,
                    background: isActive ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)',
                    color: '#FFFFFF'
                  }}>
                    {channelMsgCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Messages Body */}
        <div className="modal-body" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 16,
          background: 'radial-gradient(circle at 50% 100%, rgba(255, 94, 54, 0.04) 0%, transparent 60%)'
        }}>
          {currentMessages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: 'var(--text-dim)',
              marginTop: 40,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}>
              <Zap size={32} style={{ color: 'var(--text-dim)' }} />
              <p style={{ fontSize: 14 }}>Canal directo y seguro para esta orden.</p>
              <p style={{ fontSize: 12 }}>Escribe un mensaje o usa las respuestas rápidas abajo.</p>
            </div>
          ) : (
            currentMessages.map((msg) => {
              const isMine = msg.sender_id === currentUser.id;
              const formattedTime = new Date(msg.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    width: '100%'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 3,
                    fontSize: 11,
                    color: 'var(--text-dim)'
                  }}>
                    <span>{msg.sender_name}</span>
                    <span style={{
                      padding: '1px 5px',
                      borderRadius: 4,
                      fontSize: 10,
                      background: 'rgba(255,255,255,0.06)'
                    }}>
                      {msg.sender_role}
                    </span>
                    <span>{formattedTime}</span>
                  </div>

                  <div className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                    {msg.message && <p>{msg.message}</p>}
                    {msg.media_url && (
                      <div style={{ marginTop: 6, borderRadius: 10, overflow: 'hidden' }}>
                        <img
                          src={msg.media_url}
                          alt="Adjunto"
                          style={{
                            maxWidth: 220,
                            maxHeight: 220,
                            objectFit: 'cover',
                            display: 'block',
                            borderRadius: 8
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reply Chips */}
        <div style={{
          display: 'flex',
          gap: 6,
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderTop: '1px solid var(--border-subtle)',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          {getQuickReplies().map((chip, idx) => (
            <button
              key={idx}
              className="quick-chip"
              onClick={() => {
                soundManager.playTap();
                handleSend(chip);
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{
          padding: '12px 16px',
          background: 'var(--bg-surface-elevated)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          {/* Photo attach button */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handlePhotoUpload}
          />
          <button
            type="button"
            className="btn-icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
            title="Adjuntar foto (comprimida a WebP < 120KB)"
          >
            <ImageIcon size={18} style={{ color: isCompressing ? '#FF5E36' : 'var(--text-muted)' }} />
          </button>

          <input
            type="text"
            className="input-field"
            placeholder={isCompressing ? 'Comprimiendo foto a WebP...' : 'Escribe un mensaje...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isCompressing}
            style={{ borderRadius: 'var(--radius-full)', padding: '10px 16px' }}
          />

          <button
            onClick={() => handleSend()}
            disabled={(!inputText.trim() && !isCompressing) || isCompressing}
            className="btn-brand"
            style={{
              width: 42,
              height: 42,
              padding: 0,
              borderRadius: 'var(--radius-full)',
              flexShrink: 0
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
