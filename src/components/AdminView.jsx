import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Store, 
  Bike, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  PlusCircle, 
  FileText, 
  TrendingUp, 
  RefreshCw,
  Coins,
  ArrowUpDown,
  Check
} from 'lucide-react';
import { soundManager } from '../lib/soundEffects';

export function AdminView({ 
  profiles, 
  merchants, 
  orders, 
  onAdjustWallet, 
  onToggleVerification, 
  onResetDefaults,
  exchangeRate = 884.75,
  exchangeRateData,
  onSetManualRate,
  onRefreshRate
}) {
  const formatBs = (usd) => `Bs. ${(Number(usd || 0) * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatUSD = (usd) => `$${Number(usd || 0).toFixed(2)}`;

  const [selectedUserToTopup, setSelectedUserToTopup] = useState(profiles[1]?.id || '');
  const [topupAmount, setTopupAmount] = useState('20.00');
  const [pagoMovilRef, setPagoMovilRef] = useState('');
  const [topupSuccess, setTopupSuccess] = useState(false);

  // Manual rate override form state
  const [customRateInput, setCustomRateInput] = useState(exchangeRate.toString());
  const [rateUpdatedSuccess, setRateUpdatedSuccess] = useState(false);

  // Stats calculation
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const platformRevenue = deliveredOrders.reduce((sum, o) => sum + (o.platform_fee || 0.50), 0);
  const totalGMV = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const handleTopupSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(topupAmount);
    if (!selectedUserToTopup || isNaN(amount) || amount <= 0) return;

    onAdjustWallet(selectedUserToTopup, amount, `Recarga Pago Móvil Ref: ${pagoMovilRef || 'N/A'}`);
    setTopupSuccess(true);
    soundManager.playSuccessFanfare();
    setTimeout(() => {
      setTopupSuccess(false);
      setPagoMovilRef('');
    }, 3000);
  };

  const handleSaveCustomRate = (e) => {
    e.preventDefault();
    const val = parseFloat(customRateInput);
    if (!isNaN(val) && val > 0) {
      if (onSetManualRate) onSetManualRate(val);
      setRateUpdatedSuccess(true);
      soundManager.playSuccessFanfare();
      setTimeout(() => setRateUpdatedSuccess(false), 2500);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Admin Header */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        marginBottom: 20,
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
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
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
          }}>
            <ShieldCheck size={28} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Panel Central de Administración</h2>
              <span className="badge badge-delivered">Superadmin</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Auditoría multimoneda, control de tasa oficial BCV, verificación y saldo prepagado
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('¿Restablecer datos de prueba a los valores iniciales?')) {
              onResetDefaults();
            }
          }}
          className="btn-outline"
          style={{ fontSize: 12 }}
        >
          <RefreshCw size={14} />
          <span>Restablecer Demo</span>
        </button>
      </div>

      {/* Financial KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div className="glass-panel" style={{ padding: 18 }}>
          <span style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Comisiones MÁNDALO! ($0.50/ord)</span>
          <h3 style={{ fontSize: 24, color: '#10B981', marginTop: 4 }}>${platformRevenue.toFixed(2)}</h3>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FBBF24' }}>{formatBs(platformRevenue)} acumulados</span>
        </div>

        <div className="glass-panel" style={{ padding: 18 }}>
          <span style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Volumen Bruto (GMV)</span>
          <h3 style={{ fontSize: 24, color: 'var(--brand-orange)', marginTop: 4 }}>${totalGMV.toFixed(2)}</h3>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FBBF24' }}>{formatBs(totalGMV)} · {totalOrders} transacciones</span>
        </div>

        <div className="glass-panel" style={{ padding: 18 }}>
          <span style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Comercios Registrados</span>
          <h3 style={{ fontSize: 24, color: '#A855F7', marginTop: 4 }}>{merchants.length}</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>100% operativos</span>
        </div>

        <div className="glass-panel" style={{ padding: 18 }}>
          <span style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Riders en Nómina</span>
          <h3 style={{ fontSize: 24, color: '#00F2FE', marginTop: 4 }}>
            {profiles.filter(p => p.role === 'rider').length}
          </h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Flota activa</span>
        </div>
      </div>

      {/* Control de Tasa Oficial BCV & API */}
      <div className="glass-panel" style={{
        padding: 20,
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#FBBF24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Coins size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
                Control de Tasa Oficial BCV & Multimoneda
                <span className="badge badge-pending" style={{ fontSize: 10 }}>Auto-Actualizable</span>
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Sincronización en vivo con la API oficial del Banco Central de Venezuela (DolarAPI / BCV)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playTap();
              if (onRefreshRate) onRefreshRate();
            }}
            disabled={exchangeRateData?.isFetching}
            className="btn-brand"
            style={{
              padding: '8px 16px',
              fontSize: 12.5,
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#000000',
              fontWeight: 800
            }}
          >
            <RefreshCw size={14} className={exchangeRateData?.isFetching ? 'spin' : ''} />
            <span>{exchangeRateData?.isFetching ? 'Consultando API BCV...' : 'Sincronizar API Ahora'}</span>
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          background: 'rgba(0, 0, 0, 0.25)',
          padding: 16,
          borderRadius: 'var(--radius-md)'
        }}>
          <div>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tasa Actual Activa en la App</span>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FBBF24', marginTop: 4 }}>
              1 USD = Bs. {exchangeRate.toFixed(2)}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
              Última actualización: {(() => {
                try {
                  const d = new Date(exchangeRateData?.lastUpdated);
                  return isNaN(d.getTime()) ? 'Hoy' : d.toLocaleTimeString();
                } catch (e) {
                  return 'Hoy';
                }
              })()}
            </div>
          </div>

          {/* Form to manually override rate */}
          <form onSubmit={handleSaveCustomRate} style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label className="input-label" style={{ fontSize: 12 }}>Ajuste Manual de Tasa (Bs/$)</label>
              <input
                type="number"
                step="0.01"
                min="10"
                value={customRateInput}
                onChange={(e) => setCustomRateInput(e.target.value)}
                className="input-field"
                style={{ padding: '8px 12px', fontSize: 14 }}
              />
            </div>
            <button
              type="submit"
              className="btn-outline"
              style={{ padding: '9px 16px', fontSize: 13, borderColor: '#F59E0B', color: '#FBBF24', height: 42 }}
            >
              <Check size={15} />
              <span>Guardar Tasa</span>
            </button>
          </form>
        </div>

        {rateUpdatedSuccess && (
          <div style={{
            marginTop: 10,
            padding: 8,
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#34D399',
            fontSize: 12,
            textAlign: 'center'
          }}>
            ✓ Tasa cambiaria actualizada a Bs. {parseFloat(customRateInput).toFixed(2)}. Toda la aplicación se recalcula al instante.
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Verification of Merchants & Riders */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 17, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} style={{ color: '#10B981' }} />
            Aprobación y Verificación de Usuarios (RBAC)
          </h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
            Activa o desactiva credenciales de comercios y repartidores
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {profiles
              .filter(p => p.role !== 'admin')
              .map((prof) => (
                <div
                  key={prof.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 14 }}>{prof.full_name}</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Rol: <strong style={{ textTransform: 'uppercase', color: 'var(--brand-orange)' }}>{prof.role}</strong> • {prof.phone}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
                      Saldo: <strong style={{ color: 'var(--text-main)' }}>${prof.wallet_balance.toFixed(2)}</strong> <span style={{ color: '#FBBF24' }}>· {formatBs(prof.wallet_balance)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      soundManager.playTap();
                      onToggleVerification(prof.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 12,
                      fontWeight: 700,
                      background: prof.is_verified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: prof.is_verified ? '#34D399' : '#F87171',
                      border: prof.is_verified ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    {prof.is_verified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    <span>{prof.is_verified ? 'Verificado' : 'Sin Verificar'}</span>
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Manual Top-up tool via Pago Movil */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 17, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={18} style={{ color: 'var(--brand-orange)' }} />
            Recarga Manual de Saldo Prepagado
          </h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
            Abona saldo a riders o comercios tras validar su Pago Móvil
          </p>

          <form onSubmit={handleTopupSubmit}>
            <div className="input-group">
              <label className="input-label">Seleccionar Usuario Beneficiario</label>
              <select
                value={selectedUserToTopup}
                onChange={(e) => setSelectedUserToTopup(e.target.value)}
                className="input-field"
                style={{ background: 'var(--bg-surface-elevated)' }}
              >
                {profiles
                  .filter(p => p.role !== 'admin')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role.toUpperCase()}) - Saldo: ${p.wallet_balance.toFixed(2)} ({formatBs(p.wallet_balance)})
                    </option>
                  ))}
              </select>
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label">Monto a Recargar en Dólares ($)</label>
                <span style={{ fontSize: 11.5, color: '#FBBF24', fontWeight: 700 }}>
                  Equivale a: {formatBs(parseFloat(topupAmount) || 0)}
                </span>
              </div>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="input-field"
                placeholder="20.00"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Referencia de Pago Móvil Recibido</label>
              <input
                type="text"
                required
                placeholder="Ej: REF-994821 (Banco Venezuela / Banesco)"
                value={pagoMovilRef}
                onChange={(e) => setPagoMovilRef(e.target.value)}
                className="input-field"
              />
            </div>

            {topupSuccess && (
              <div style={{
                padding: 10,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34D399',
                fontSize: 13,
                textAlign: 'center',
                marginBottom: 12
              }}>
                ✓ Saldo de ${topupAmount} ({formatBs(topupAmount)}) abonado exitosamente y registrado en auditoría.
              </div>
            )}

            <button type="submit" className="btn-brand" style={{ width: '100%', padding: '12px' }}>
              <PlusCircle size={16} />
              <span>Acreditar Saldo a la Billetera</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
