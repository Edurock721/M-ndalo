import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  Sparkles,
  Zap,
  ChevronDown
} from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, loginAsDemo } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const { user, profile } = await signIn(email, password);
      const role = profile?.role || user?.user_metadata?.role || 'client';

      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'rider') {
        navigate('/conductor');
      } else if (role === 'merchant') {
        navigate('/comercio');
      } else {
        navigate('/cliente');
      }

    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        setErrorMsg('Correo o contraseña incorrectos. Verifica tus datos.');
      } else if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
        setErrorMsg('Tu correo aún no ha sido confirmado por Supabase. Desactiva "Confirm email" en Authentication > Providers > Email de Supabase o ejecuta la sección 11 de schema.sql para activar todas las cuentas.');
      } else {
        setErrorMsg(err.message || 'Error al autenticar. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-white flex flex-col justify-center items-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        
        {/* Encabezado con logo y espaciado */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-600 to-amber-500 shadow-2xl shadow-orange-500/30 mb-4 ring-4 ring-orange-500/10">
            <span className="text-3xl font-black text-white tracking-tighter">M!</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Mándalo! <Sparkles className="w-5 h-5 text-amber-400" />
          </h1>
          <p className="text-sm text-gray-400 mt-1.5 font-medium">
            Inicia sesión con tu correo y contraseña
          </p>
        </div>

        {/* Tarjeta de Formulario Principal */}
        <div className="bg-[#101626] border border-slate-800 rounded-[32px] p-6 sm:p-9 shadow-2xl shadow-black/80">
          <form onSubmit={handleSubmit}>
            
            {/* Campo Correo Electrónico */}
            <div className="mb-5">
              <label className="auth-label">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-4 pointer-events-none" />
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input auth-input-icon"
                  required
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="mb-6">
              <label className="auth-label">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-4 pointer-events-none" />
                <input
                  type="password"
                  placeholder="Tu contraseña secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input auth-input-icon"
                  required
                />
              </div>
            </div>

            {/* Banner de Error */}
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-500/15 border border-red-500/40 rounded-2xl text-red-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Botón Principal de Iniciar Sesión */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl font-black text-base bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-orange-500/25 text-white cursor-pointer disabled:opacity-50 tracking-wide"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Enlace para ir a Registro */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-sm text-gray-400">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="text-orange-400 font-bold hover:text-orange-300 hover:underline ml-1">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Panel de Acceso Rápido de Prueba - Grande, Ergonómico y Fácil de Tocar */}
        <div className="mt-8 bg-[#101626] border border-slate-800 rounded-[28px] p-5 sm:p-7 shadow-2xl">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                Accesos Rápidos de Prueba (Simulador)
              </h3>
              <p className="text-xs text-gray-400">
                Toca cualquier rol para probar el sistema al instante sin escribir credenciales:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800/80">
            {/* Cliente */}
            <button
              type="button"
              onClick={() => {
                loginAsDemo('client', true);
                navigate('/cliente');
              }}
              className="p-3.5 rounded-2xl bg-orange-500/15 hover:bg-orange-500/25 border-2 border-orange-500/40 hover:border-orange-500 text-orange-200 hover:text-white transition-all cursor-pointer flex items-center gap-3 min-h-[54px] shadow-sm active:scale-98"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-md">
                👤
              </div>
              <div className="text-left">
                <span className="block text-sm font-black text-white">Modo Cliente</span>
                <span className="block text-[11px] text-orange-300/80">Comprar y pedir mandaditos</span>
              </div>
            </button>

            {/* Taxista / Conductor */}
            <button
              type="button"
              onClick={() => {
                loginAsDemo('rider', true);
                navigate('/conductor');
              }}
              className="p-3.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border-2 border-emerald-500/40 hover:border-emerald-500 text-emerald-200 hover:text-white transition-all cursor-pointer flex items-center gap-3 min-h-[54px] shadow-sm active:scale-98"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-md">
                🏍️
              </div>
              <div className="text-left">
                <span className="block text-sm font-black text-white">Taxista / Repartidor</span>
                <span className="block text-[11px] text-emerald-300/80">Radar de pedidos y carreras</span>
              </div>
            </button>

            {/* Comercio Aliado */}
            <button
              type="button"
              onClick={() => {
                loginAsDemo('merchant', true);
                navigate('/comercio');
              }}
              className="p-3.5 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 border-2 border-purple-500/40 hover:border-purple-500 text-purple-200 hover:text-white transition-all cursor-pointer flex items-center gap-3 min-h-[54px] shadow-sm active:scale-98"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-md">
                🏪
              </div>
              <div className="text-left">
                <span className="block text-sm font-black text-white">Comercio Aliado</span>
                <span className="block text-[11px] text-purple-300/80">Gestión de menú y órdenes</span>
              </div>
            </button>

            {/* Administrador */}
            <button
              type="button"
              onClick={() => {
                loginAsDemo('admin', true);
                navigate('/admin');
              }}
              className="p-3.5 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border-2 border-cyan-500/40 hover:border-cyan-500 text-cyan-200 hover:text-white transition-all cursor-pointer flex items-center gap-3 min-h-[54px] shadow-sm active:scale-98"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-md">
                🛡️
              </div>
              <div className="text-left">
                <span className="block text-sm font-black text-white">Administrador</span>
                <span className="block text-[11px] text-cyan-300/80">Control total y auditoría</span>
              </div>
            </button>

            {/* Conductor / Comercio en Espera */}
            <button
              type="button"
              onClick={() => {
                loginAsDemo('rider', false);
                navigate('/conductor');
              }}
              className="p-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold transition-all cursor-pointer flex items-center justify-center gap-2 col-span-1 sm:col-span-2 text-xs min-h-[46px]"
            >
              <span>⏳ Probar Modo Conductor en Espera de Validación</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
