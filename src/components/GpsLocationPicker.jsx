import React, { useState } from 'react';
import { MapPin, Navigation, Crosshair, Loader2, CheckCircle2, ExternalLink, RotateCcw } from 'lucide-react';
import { detectLocationWithAddress } from '../lib/locationService';
import { soundManager } from '../lib/soundEffects';

export function GpsLocationPicker({
  label = 'Dirección de Entrega',
  value = '',
  onChange,
  coords = null,
  onCoordsChange,
  placeholder = 'Ej: Calle Principal, Casa #14',
  required = false,
  helperText = 'Presiona el botón GPS para fijar tu ubicación con alta precisión'
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectedInfo, setDetectedInfo] = useState(null);

  const handleCaptureGps = async () => {
    try {
      setLoading(true);
      setError(null);
      soundManager.playTap();

      const result = await detectLocationWithAddress();
      setDetectedInfo(result);

      // Auto-write address to the input
      if (onChange) {
        onChange(result.address);
      }
      if (onCoordsChange) {
        onCoordsChange(result.coords);
      }

      soundManager.playSuccessFanfare();
    } catch (err) {
      console.error('Error capturando GPS:', err);
      setError(err.message || 'No se pudo obtener la ubicación.');
      soundManager.playTap();
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyBadge = (acc) => {
    if (!acc && acc !== 0) return null;
    if (acc <= 15) {
      return { text: `±${acc}m (Precisión Satelital Alta)`, color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
    }
    if (acc <= 35) {
      return { text: `±${acc}m (Buena Precisión)`, color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' };
    }
    return { text: `±${acc}m (Aproximada)`, color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.15)' };
  };

  const badge = coords?.accuracy ? getAccuracyBadge(coords.accuracy) : (detectedInfo?.accuracy ? getAccuracyBadge(detectedInfo.accuracy) : null);
  const currentCoords = coords || detectedInfo?.coords;

  return (
    <div className="input-group" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label className="input-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={15} style={{ color: 'var(--brand-orange)' }} />
          <span>{label}</span>
        </label>

        {badge && (
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 12,
            background: badge.bg,
            color: badge.color,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}>
            <CheckCircle2 size={12} />
            {badge.text}
          </span>
        )}
      </div>

      {/* Main GPS Capture Trigger Button */}
      <button
        type="button"
        onClick={handleCaptureGps}
        disabled={loading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: '11px 14px',
          borderRadius: 'var(--radius-md)',
          background: currentCoords
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)'
            : 'linear-gradient(135deg, rgba(255, 94, 54, 0.15) 0%, rgba(255, 42, 84, 0.2) 100%)',
          border: currentCoords
            ? '1px solid rgba(16, 185, 129, 0.4)'
            : '1px solid rgba(255, 94, 54, 0.4)',
          color: currentCoords ? '#34D399' : '#FFFFFF',
          fontSize: 13,
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: 8,
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="spin" style={{ color: 'var(--brand-orange)' }} />
            <span>Sintonizando satélites GPS y detectando dirección...</span>
          </>
        ) : currentCoords ? (
          <>
            <RotateCcw size={15} />
            <span>Actualizar mi ubicación GPS actual</span>
          </>
        ) : (
          <>
            <Crosshair size={16} style={{ color: 'var(--brand-orange)' }} />
            <span>Marcar con mi GPS para dirección automática</span>
          </>
        )}
      </button>

      {/* Address Text Field (Auto-filled by GPS and editable) */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          required={required}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          className="input-field"
          style={{
            paddingRight: currentCoords ? 80 : 12,
            borderColor: currentCoords ? 'rgba(16, 185, 129, 0.5)' : undefined
          }}
        />

        {currentCoords && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${currentCoords.lat},${currentCoords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir punto GPS en Google Maps"
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: '#60A5FA',
              background: 'rgba(96, 165, 250, 0.1)',
              padding: '4px 8px',
              borderRadius: 6,
              textDecoration: 'none'
            }}
          >
            <Navigation size={11} />
            <span>Mapa</span>
            <ExternalLink size={10} />
          </a>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: 6,
          padding: '6px 10px',
          borderRadius: 6,
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#F87171',
          fontSize: 12
        }}>
          ⚠️ {error}
        </div>
      )}

      {currentCoords ? (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 5,
          fontSize: 11,
          color: 'var(--text-muted)'
        }}>
          <span>📍 Coordenadas fijadas: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}</span>
          <span style={{ color: '#10B981' }}>✓ Autocompletado</span>
        </div>
      ) : (
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, margin: '4px 0 0' }}>
          {helperText}
        </p>
      )}
    </div>
  );
}
