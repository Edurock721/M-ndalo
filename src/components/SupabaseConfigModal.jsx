import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Copy, 
  Check, 
  ExternalLink, 
  Server, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../lib/mockData';
import { getSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';
import { soundManager } from '../lib/soundEffects';

export function SupabaseConfigModal({ onClose }) {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey || '');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('schema'); // 'schema' | 'connection'

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    soundManager.playTap();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    saveSupabaseConfig(url, anonKey);
    setSaved(true);
    soundManager.playSuccessFanfare();
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 720, height: '88vh' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Database size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 17 }}>Arquitectura Supabase Backend (Costo $0)</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                PostgreSQL 15+, Auth, Realtime WebSockets & Storage Gratuito
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Tab switch */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 20px',
          background: 'rgba(0,0,0,0.15)'
        }}>
          <button
            onClick={() => setActiveTab('schema')}
            style={{
              padding: '12px 18px',
              borderBottom: activeTab === 'schema' ? '2px solid var(--brand-orange)' : '2px solid transparent',
              color: activeTab === 'schema' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 13,
              background: 'none'
            }}
          >
            Script SQL Maestro
          </button>
          <button
            onClick={() => setActiveTab('connection')}
            style={{
              padding: '12px 18px',
              borderBottom: activeTab === 'connection' ? '2px solid var(--brand-orange)' : '2px solid transparent',
              color: activeTab === 'connection' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 13,
              background: 'none'
            }}
          >
            Conectar Proyecto en Vivo
          </button>
        </div>

        <div className="modal-body" style={{ padding: 20 }}>
          {activeTab === 'schema' ? (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                gap: 12
              }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Pega este script en el <strong>SQL Editor</strong> de Supabase para inicializar las tablas, índices, checks de integridad y RLS:
                </p>
                <button
                  onClick={handleCopySchema}
                  className="btn-brand"
                  style={{ padding: '8px 14px', fontSize: 12.5 }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? '¡Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>

              <div style={{
                position: 'relative',
                background: '#070B12',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                maxHeight: 380,
                overflowY: 'auto',
                padding: 16
              }}>
                <pre style={{
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: '#93C5FD',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>

              <div style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: 12.5,
                color: '#D1FAE5'
              }}>
                <strong>📌 Paso a paso para desplegar en 2 minutos gratis:</strong>
                <ol style={{ paddingLeft: 18, marginTop: 6, lineHeight: 1.6 }}>
                  <li>Crea un proyecto en <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: '#34D399', textDecoration: 'underline' }}>supabase.com</a> (Plan Free 500MB DB + 1GB Storage).</li>
                  <li>Ve a <strong>SQL Editor</strong> y pega el código anterior.</li>
                  <li>Copia tu <code>Project URL</code> y <code>anon public key</code> de Settings &gt; API y pégalos en la pestaña &quot;Conectar Proyecto en Vivo&quot;.</li>
                </ol>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveConfig} style={{ maxWidth: 520, margin: '0 auto' }}>
              <div style={{
                textAlign: 'center',
                marginBottom: 20
              }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px'
                }}>
                  <Server size={24} />
                </div>
                <h4 style={{ fontSize: 16 }}>Configuración de Credenciales</h4>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {currentConfig.isLive 
                    ? '🟢 Actualmente conectado a Supabase en Vivo.' 
                    : '🟡 Actualmente en Modo Simulador Local Reactivo con datos de demostración.'}
                </p>
              </div>

              <div className="input-group">
                <label className="input-label">Project URL de Supabase</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Anon Public Key</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  required
                />
              </div>

              {saved && (
                <div style={{
                  padding: 10,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399',
                  fontSize: 13,
                  textAlign: 'center',
                  marginBottom: 16
                }}>
                  ✓ Credenciales guardadas. Recargando conexión...
                </div>
              )}

              <button type="submit" className="btn-brand" style={{ width: '100%', marginTop: 10 }}>
                Guardar y Conectar Supabase
              </button>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-outline">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
