import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  CheckCircle, 
  Cpu, 
  HardDrive, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { compressImageToWebP } from '../lib/imageCompression';
import { soundManager } from '../lib/soundEffects';

export function ImageCompressorModal({ onClose }) {
  const [compressing, setCompressing] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    try {
      setCompressing(true);
      const startTime = performance.now();
      const compResult = await compressImageToWebP(file);
      const durationMs = Math.round(performance.now() - startTime);

      setResult({
        ...compResult,
        durationMs,
        originalName: file.name
      });
      soundManager.playSuccessFanfare();
    } catch (err) {
      console.error('Error in compression test:', err);
      alert('Error al comprimir la imagen.');
    } finally {
      setCompressing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #00F2FE, #4FACFE)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000'
            }}>
              <HardDrive size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 17 }}>Compresión WebP del Cliente (Costo $0)</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Máximo 120 KB por foto para optimizar el plan gratuito de 1 GB en Supabase Storage
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Architecture policy note */}
          <div style={{
            background: 'rgba(0, 242, 254, 0.08)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: 14,
            marginBottom: 20,
            fontSize: 13,
            lineHeight: 1.5,
            color: '#E0F2FE'
          }}>
            <strong style={{ color: '#00F2FE' }}>⚡ Política de Ahorro Extremo:</strong> Las fotos de productos y adjuntos de chat se comprimen en el navegador antes de transmitirse. Esto ahorra ancho de banda y espacio de almacenamiento.
          </div>

          {/* Drag & drop upload area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? 'var(--brand-orange)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '30px 20px',
              textAlign: 'center',
              background: dragOver ? 'rgba(255, 94, 54, 0.08)' : 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: 20
            }}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
              };
              input.click();
            }}
          >
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'var(--brand-orange)'
            }}>
              <UploadCloud size={26} />
            </div>
            <h4 style={{ fontSize: 15, marginBottom: 4 }}>
              {compressing ? 'Procesando en WebWorker...' : 'Arrastra una foto o haz clic para probar'}
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Acepta JPG, PNG, HEIC de cualquier tamaño (incluso fotos de 8-10 MB de cámara móvil)
            </p>
          </div>

          {/* Results Card */}
          {result && (
            <div className="glass-panel" style={{ padding: 18, background: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={16} /> Compresión completada en {result.durationMs}ms
                </span>
                <span className="badge badge-delivered">
                  {result.savedPercent}% AHORRO
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: 12,
                textAlign: 'center',
                background: 'rgba(0, 0, 0, 0.2)',
                padding: 14,
                borderRadius: 'var(--radius-md)',
                marginBottom: 16
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Original</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#EF4444' }}>{result.originalKB} KB</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{result.originalName}</div>
                </div>

                <ArrowRight size={20} style={{ color: 'var(--text-dim)' }} />

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>WebP Optimizado</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#10B981' }}>{result.compressedKB} KB</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>≤ 120 KB (Límite Mándalo!)</div>
                </div>
              </div>

              {/* Preview image */}
              <div style={{ textAlign: 'center' }}>
                <img
                  src={result.dataUrl}
                  alt="Resultado WebP"
                  style={{
                    maxHeight: 180,
                    maxWidth: '100%',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    objectFit: 'contain'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-brand">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
