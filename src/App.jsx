import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Páginas de Autenticación
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';

// Páginas Principales por Rol
import { Home as ClientHome } from './pages/Client/Home';
import { DeliveryPool as RiderDeliveryPool } from './pages/Rider/DeliveryPool';
import { Dashboard as MerchantDashboard } from './pages/Merchant/Dashboard';
import { AdminPortal } from './pages/Admin/AdminPortal';

/**
 * Redirección inteligente en la raíz '/' según el estado y rol del usuario
 */
function RootRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16] flex flex-col items-center justify-center text-white">
        <div className="relative w-14 h-14 mb-3">
          <div className="w-14 h-14 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-orange-400">
            M!
          </div>
        </div>
        <p className="text-gray-400 text-xs font-medium animate-pulse">Cargando Mándalo...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = profile?.role || user.user_metadata?.role || 'client';

  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'rider') return <Navigate to="/conductor" replace />;
  if (role === 'merchant') return <Navigate to="/comercio" replace />;
  return <Navigate to="/cliente" replace />;
}

export function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Ruta Raíz Inteligente */}
          <Route path="/" element={<RootRedirect />} />

          {/* Rutas Públicas de Autenticación */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas Protegidas por Rol */}
          <Route
            path="/cliente"
            element={
              <ProtectedRoute allowedRoles={['client', 'admin']}>
                <ClientHome />
              </ProtectedRoute>
            }
          />

          <Route
            path="/conductor"
            element={
              <ProtectedRoute allowedRoles={['rider', 'admin']}>
                <RiderDeliveryPool />
              </ProtectedRoute>
            }
          />

          <Route
            path="/comercio"
            element={
              <ProtectedRoute allowedRoles={['merchant', 'admin']}>
                <MerchantDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPortal />
              </ProtectedRoute>
            }
          />

          {/* Fallback para cualquier ruta desconocida */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
