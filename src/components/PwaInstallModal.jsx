import React from 'react';
import { X, Download, Smartphone, Share, PlusSquare, Check } from 'lucide-react';

export function PwaInstallModal({ onClose, deferredPrompt, onInstallPrompt }) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 500 }}>
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
              <Smartphone size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 17 }}>Instalar MÁNDALO! en tu Celular</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Acceso directo instantáneo y notificaciones sin costo de Google Play o App Store
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {deferredPrompt ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ marginBottom: 16, fontSize: 14 }}>
                Tu navegador es totalmente compatible con la instalación directa de Mándalo.
              </p>
              <button
                onClick={onInstallPrompt}
                className="btn-brand"
                style={{ width: '100%', padding: '14px' }}
              >
                <Download size={18} />
                <span>Instalar Mándalo Ahora</span>
              </button>
            </div>
          ) : isIOS ? (
            <div style={{ padding: '8px 0' }}>
              <h4 style={{ fontSize: 14, color: 'var(--brand-orange)', marginBottom: 12 }}>
                Instalación en iPhone / Safari:
              </h4>
              <ol style={{ paddingLeft: 20, fontSize: 13.5, lineHeight: 1.8, color: 'var(--text-main)' }}>
                <li>Toca el botón <strong>Compartir</strong> <Share size={15} style={{ verticalAlign: 'middle', margin: '0 4px', display: 'inline' }} /> en la barra inferior de Safari.</li>
                <li>Desliza hacia abajo y selecciona <strong>&quot;Añadir a pantalla de inicio&quot;</strong> <PlusSquare size={15} style={{ verticalAlign: 'middle', margin: '0 4px', display: 'inline' }} />.</li>
                <li>Toca <strong>Añadir</strong> en la esquina superior derecha.</li>
              </ol>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              <h4 style={{ fontSize: 14, color: 'var(--brand-orange)', marginBottom: 12 }}>
                Instalación en Android / Chrome:
              </h4>
              <ol style={{ paddingLeft: 20, fontSize: 13.5, lineHeight: 1.8, color: 'var(--text-main)' }}>
                <li>Toca los <strong>tres puntos (⋮)</strong> en la esquina superior derecha de Chrome.</li>
                <li>Selecciona <strong>&quot;Instalar aplicación&quot;</strong> o &quot;Añadir a pantalla principal&quot;.</li>
                <li>Confirma la instalación para disfrutar de pantalla completa nativa y modo offline.</li>
              </ol>
            </div>
          )}

          <div style={{
            marginTop: 18,
            padding: 12,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            fontSize: 12,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Check size={16} style={{ color: '#10B981', flexShrink: 0 }} />
            <span>Sin descargas pesadas: Pesa menos de 1 MB y funciona incluso con conexiones lentas.</span>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-brand" style={{ width: '100%' }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
