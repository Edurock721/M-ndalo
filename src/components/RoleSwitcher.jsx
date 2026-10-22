import React from 'react';
import { User, Store, Bike, Shield, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../lib/soundEffects';

export function RoleSwitcher({ profiles, currentUserId, onSelectUser, exchangeRate = 884.75 }) {
  const roles = [
    {
      id: 'user-client-1',
      label: 'Cliente',
      name: 'Carlos Mendoza',
      sub: 'Cliente particular',
      icon: User,
      color: 'var(--brand-orange)',
      bg: 'rgba(255, 94, 54, 0.12)'
    },
    {
      id: 'user-merchant-1',
      label: 'Comercio',
      name: 'El Rincón Llanero',
      sub: 'Burgers & Grill',
      icon: Store,
      color: '#A855F7',
      bg: 'rgba(168, 85, 247, 0.12)'
    },
    {
      id: 'user-rider-1',
      label: 'Repartidor',
      name: 'Yordanis Gómez',
      sub: 'Moto Bera SBR',
      icon: Bike,
      color: '#00F2FE',
      bg: 'rgba(0, 242, 254, 0.12)'
    },
    {
      id: 'user-admin-1',
      label: 'Admin',
      name: 'Admin Central',
      sub: 'Auditoría & Saldo',
      icon: Shield,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.12)'
    }
  ];

  return (
    <div style={{
      background: 'rgba(14, 20, 36, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '8px 16px',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-dim)',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 8px #10B981'
            }}></span>
            SIMULADOR RBAC:
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          overflowX: 'auto',
          maxWidth: '100%',
          paddingBottom: 2
        }}>
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = currentUserId === r.id;
            const profile = profiles.find(p => p.id === r.id);
            const balance = profile ? profile.wallet_balance : 0;

            return (
              <button
                key={r.id}
                onClick={() => {
                  soundManager.playTap();
                  onSelectUser(r.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: isSelected ? r.bg : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? `1.5px solid ${r.color}` : '1px solid var(--border-subtle)',
                  color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? `0 0 16px -4px ${r.color}` : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected ? r.color : 'rgba(255,255,255,0.08)',
                  color: isSelected ? '#000000' : 'var(--text-muted)'
                }}>
                  <Icon size={12} strokeWidth={2.5} />
                </div>
                <span>{r.label}: <strong style={{ color: isSelected ? '#FFFFFF' : 'var(--text-main)' }}>{r.name.split(' ')[0]}</strong></span>
                <span style={{
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: 'rgba(0,0,0,0.3)',
                  color: isSelected ? r.color : 'var(--text-dim)'
                }}>
                  ${balance.toFixed(2)} · {Math.round(balance * exchangeRate).toLocaleString('es-VE')} Bs
                </span>
                {isSelected && <CheckCircle2 size={13} style={{ color: r.color }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
