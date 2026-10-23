import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Clock, RefreshCw, LogOut, CheckCircle, Car, Store, User } from 'lucide-react';

/**
 * ProtectedRoute: Valida autenticación, rol permitido y estado de verificación
 * @param {Array<string>} allowedRoles - Roles autorizados ('client', 'rider', 'merchant', 'admin')
 * @param {React.ReactNode} children - Vista a renderizar si cumple las políticas
 */
export function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, profile, loading, isConfigured, signOut, refreshProfile } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(false);

  const currentRole = profile?.role || user?.user_metadata?.role || 'client';
  const isVerified = profile?.is_verified ?? (currentRole === 'client');

  // Auto-comprobar aprobación cada 3.5 segundos en segundo plano mientras esté en revisión
  React.useEffect(() => {
    if (loading || isVerified || !user?.id) return;
    const interval = setInterval(() => {
      refreshProfile();
    }, 3500);
    return () => clearInterval(interval);
  }, [loading, isVerified, user?.id]);

  // 1. Estado de carga inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16] flex flex-col items-center justify-center p-6 text-white">
        <div className="relative w-16 h-16 mb-4">
          <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-orange-400">
            M!
          </div>
        </div>
        <p className="text-gray-400 text-sm font-medium animate-pulse">
          Verificando credenciales de acceso...
        </p>
      </div>
    );
  }

  // 2. Si no hay sesión activa, redirigir a Login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Pantalla de Cuenta en Revisión para Conductor o Comercio no verificado
  if (!isVerified && (currentRole === 'rider' || currentRole === 'merchant')) {
    const handleRecheck = async () => {
      setChecking(true);
      await refreshProfile();
      setTimeout(() => setChecking(false), 800);
    };

    return (
      <div className="min-h-screen bg-[#090D16] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#131B2E] border border-orange-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-orange-950/40 text-center relative overflow-hidden">
          {/* Glow decorativo */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Icono de estado */}
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-3 uppercase tracking-wider">
            {currentRole === 'rider' ? 'Registro de Conductor' : 'Registro de Comercio'}
          </span>

          <h2 className="text-2xl font-extrabold text-white mb-2">
            Cuenta en revisión
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-6">
            Hola <span className="text-white font-semibold">{profile?.full_name || user.email}</span>. Tu solicitud para unirte como {currentRole === 'rider' ? 'conductor / repartidor' : 'comercio afiliado'} ha sido recibida y nuestro equipo administrativo está validando tus documentos y datos.
          </p>

          <div className="bg-[#0D1322] border border-gray-800 rounded-2xl p-4 text-left mb-6 space-y-2.5 text-xs text-gray-300">
            <div className="flex items-center gap-2 text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              Detalles registrados:
            </div>
            <div className="flex justify-between border-b border-gray-800/80 pb-1.5">
              <span className="text-gray-400">Rol:</span>
              <span className="text-white font-medium capitalize">{currentRole === 'rider' ? 'Conductor' : 'Comercio'}</span>
            </div>
            {currentRole === 'rider' && (
              <>
                <div className="flex justify-between border-b border-gray-800/80 pb-1.5">
                  <span className="text-gray-400">Cédula:</span>
                  <span className="text-white font-mono font-medium">{profile?.identity_doc || 'Registrada'}</span>
                </div>
                {profile?.cooperative && (
                  <div className="flex justify-between border-b border-gray-800/80 pb-1.5">
                    <span className="text-gray-400">Cooperativa / Línea:</span>
                    <span className="text-amber-400 font-medium">{profile.cooperative}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-gray-800/80 pb-1.5">
                  <span className="text-gray-400">Vehículo:</span>
                  <span className="text-white font-medium capitalize">{profile?.vehicle_type === 'car' ? 'Carro / Taxi' : 'Moto Taxi'}</span>
                </div>
                {profile?.vehicle_plate && (
                  <div className="flex justify-between border-b border-gray-800/80 pb-1.5">
                    <span className="text-gray-400">Placa y Modelo:</span>
                    <span className="text-orange-400 font-mono font-bold">{profile.vehicle_plate} ({profile?.vehicle_model || 'N/A'})</span>
                  </div>
                )}
              </>
            )}

            {currentRole === 'merchant' && (
              <>
                <div className="flex justify-between border-b border-gray-800/80 pb-1.5">
                  <span className="text-gray-400">Comercio:</span>
                  <span className="text-white font-bold">{profile?.merchant_name || profile?.full_name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800/80 pb-1.5">
                  <span className="text-gray-400">Encargado:</span>
                  <span className="text-white font-medium">{profile?.manager_name || 'Registrado'}</span>
                </div>
                {profile?.merchant_rif && (
                  <div className="flex justify-between border-b border-gray-800/80 pb-1.5">
                    <span className="text-gray-400">RIF / Cédula:</span>
                    <span className="text-amber-400 font-mono font-bold">{profile.merchant_rif}</span>
                  </div>
                )}
                {profile?.address && (
                  <div className="flex justify-between border-b border-gray-800/80 pb-1.5">
                    <span className="text-gray-400">Dirección:</span>
                    <span className="text-gray-300 truncate max-w-[200px]">{profile.address}</span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between">
              <span className="text-gray-400">Estado:</span>
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                En espera de aprobación administrativa
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleRecheck}
              disabled={checking}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Consultando estado...' : 'Comprobar activación'}
            </button>

            <button
              onClick={() => signOut()}
              className="w-full py-3 px-4 rounded-xl font-medium text-xs text-gray-400 hover:text-white bg-gray-800/40 hover:bg-gray-800/80 border border-gray-700/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Control de acceso por Rol: Si el rol no está entre los autorizados, redirigir a su panel
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    let targetRoute = '/cliente';
    if (currentRole === 'rider') targetRoute = '/conductor';
    else if (currentRole === 'merchant') targetRoute = '/comercio';
    else if (currentRole === 'admin') targetRoute = '/admin';

    return <Navigate to={targetRoute} replace />;
  }

  // 5. Autorizado y verificado
  return children;
}

export default ProtectedRoute;
