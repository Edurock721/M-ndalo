import React from 'react';
import { 
  Zap, 
  ShoppingCart, 
  Database, 
  FileImage, 
  Download, 
  Coins, 
  BellRing,
  RefreshCw
} from 'lucide-react';
import { soundManager } from '../lib/soundEffects';

export function Navbar({ 
  currentUser, 
  cartCount, 
  onOpenCart, 
  onOpenSupabaseModal, 
  onOpenCompressorModal, 
  onOpenPwaModal,
  pendingOrdersCount,
  exchangeRateData,
  onRefreshRate
}) {
  const currentRate = exchangeRateData?.rate || 884.75;
  const isFetchingRate = exchangeRateData?.isFetching || false;
  return (
    <header style={{
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 45, // Under role switcher
      zIndex: 40,
      padding: '12px 16px'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12
      }}>
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'var(--brand-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-brand)',
            color: '#FFFFFF'
          }}>
            <Zap size={22} fill="#FFFFFF" strokeWidth={0} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h1 style={{
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #FFFFFF 30%, #FF8A65 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}>
                MÁNDALO!
              </h1>
              <span style={{
                background: 'rgba(255, 94, 54, 0.2)',
                color: 'var(--brand-orange)',
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 6,
                border: '1px solid rgba(255, 94, 54, 0.3)'
              }}>
                PWA
              </span>
            </div>
            <p style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              lineHeight: 1
            }}>
              Delivery Local & Mandaditos
            </p>
          </div>
        </div>

        {/* Live Auto-updating BCV Ticker Pill */}
        <div 
          onClick={() => {
            soundManager.playTap();
            if (onRefreshRate) onRefreshRate();
          }}
          title="Tasa Oficial del Banco Central de Venezuela (Auto-actualizada vía API). Clic para refrescar."
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.28)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-main)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          className="bcv-ticker"
        >
          <div style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: isFetchingRate ? '#F59E0B' : '#10B981',
            boxShadow: isFetchingRate ? '0 0 8px #F59E0B' : '0 0 8px #10B981'
          }}></div>
          <Coins size={14} style={{ color: '#FBBF24' }} />
          <span>BCV: <strong style={{ color: '#FBBF24' }}>Bs. {currentRate.toFixed(2)}</strong></span>
          <RefreshCw 
            size={12} 
            style={{ 
              color: 'var(--text-dim)', 
              animation: isFetchingRate ? 'spin 1s linear infinite' : 'none',
              marginLeft: 2
            }} 
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Zero-cost image compression tool preview */}
          <button
            onClick={() => {
              soundManager.playTap();
              onOpenCompressorModal();
            }}
            title="Herramienta de Compresión WebP < 120KB (Costo $0)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              padding: '7px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--text-main)'
            }}
          >
            <FileImage size={15} style={{ color: '#00F2FE' }} />
            <span style={{ display: 'none' }} className="hide-mobile">Compresor WebP</span>
          </button>

          {/* Supabase backend config */}
          <button
            onClick={() => {
              soundManager.playTap();
              onOpenSupabaseModal();
            }}
            title="Conexión Supabase PostgreSQL & SQL Schema"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '7px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 12.5,
              fontWeight: 600,
              color: '#34D399'
            }}
          >
            <Database size={15} />
            <span style={{ display: 'none' }} className="hide-mobile">Supabase</span>
          </button>

          {/* PWA Install */}
          <button
            onClick={() => {
              soundManager.playTap();
              onOpenPwaModal();
            }}
            title="Instalar Mándalo en móvil o PC"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              padding: '7px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--text-main)'
            }}
          >
            <Download size={15} style={{ color: '#FBBF24' }} />
            <span style={{ display: 'none' }} className="hide-mobile">Instalar Mándalo</span>
          </button>

          {/* Cart button for client role */}
          {currentUser?.role === 'client' && (
            <button
              onClick={() => {
                soundManager.playTap();
                onOpenCart();
              }}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--brand-gradient)',
                color: '#FFFFFF',
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: 13,
                boxShadow: 'var(--shadow-brand)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <ShoppingCart size={20} strokeWidth={2.5} />
              <span>Carrito</span>
              {cartCount > 0 && (
                <span style={{
                  background: '#FFFFFF',
                  color: 'var(--brand-orange)',
                  borderRadius: 'var(--radius-full)',
                  width: 20,
                  height: 20,
                  fontSize: 11,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 2
                }}>
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Pending alert dot for merchants and riders */}
          {pendingOrdersCount > 0 && currentUser?.role !== 'client' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#FBBF24',
              fontSize: 12,
              fontWeight: 700
            }} className="pulse-alert">
              <BellRing size={14} />
              <span>{pendingOrdersCount} orden{pendingOrdersCount > 1 ? 'es' : ''}</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) {
          .bcv-ticker { display: flex !important; }
          .hide-mobile { display: inline !important; }
        }
      `}</style>
    </header>
  );
}
