import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Bike, 
  Store, 
  Car, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Lock, 
  FileText, 
  ArrowRight,
  AlertCircle,
  Sparkles,
  MapPin,
  Briefcase,
  Clock
} from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  // Selector principal de Rol
  const [role, setRole] = useState('client'); // 'client' | 'rider' | 'merchant'

  // Campos comunes
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Campos para Cliente
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientIdentityDoc, setClientIdentityDoc] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  // Campos para Taxista / Repartidor
  const [riderFirstName, setRiderFirstName] = useState('');
  const [riderLastName, setRiderLastName] = useState('');
  const [riderIdentityDoc, setRiderIdentityDoc] = useState('');
  const [riderCooperative, setRiderCooperative] = useState('');
  const [vehicleType, setVehicleType] = useState('moto'); // 'moto' | 'car'
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');

  // Campos para Comercio
  const [merchantName, setMerchantName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [merchantRif, setMerchantRif] = useState('');
  const [merchantAddress, setMerchantAddress] = useState('');
  const [merchantCategory, setMerchantCategory] = useState('Comida Rápida');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim() || !phone.trim()) {
      setErrorMsg('Por favor completa el correo, contraseña y teléfono.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener un mínimo de 6 caracteres.');
      return;
    }

    let payload = { email, password, phone, role };

    if (role === 'client') {
      if (!clientFirstName.trim() || !clientLastName.trim() || !clientIdentityDoc.trim() || !clientAddress.trim()) {
        setErrorMsg('Por favor completa tus nombres, apellidos, cédula y dirección.');
        return;
      }
      payload = {
        ...payload,
        firstName: clientFirstName.trim(),
        lastName: clientLastName.trim(),
        fullName: `${clientFirstName.trim()} ${clientLastName.trim()}`,
        identityDoc: clientIdentityDoc.trim(),
        address: clientAddress.trim()
      };
    } else if (role === 'rider') {
      if (!riderFirstName.trim() || !riderLastName.trim() || !riderIdentityDoc.trim() || !vehiclePlate.trim() || !vehicleModel.trim()) {
        setErrorMsg('Por favor completa tus nombres, apellidos, cédula, placa y modelo del vehículo.');
        return;
      }
      payload = {
        ...payload,
        firstName: riderFirstName.trim(),
        lastName: riderLastName.trim(),
        fullName: `${riderFirstName.trim()} ${riderLastName.trim()}`,
        identityDoc: riderIdentityDoc.trim(),
        cooperative: riderCooperative.trim() || 'Particular / Independiente',
        vehicleType: vehicleType,
        vehiclePlate: vehiclePlate.toUpperCase().trim(),
        vehicleModel: vehicleModel.trim()
      };
    } else if (role === 'merchant') {
      if (!merchantName.trim() || !managerName.trim() || !merchantRif.trim() || !merchantAddress.trim()) {
        setErrorMsg('Por favor completa el nombre del comercio, encargado, RIF y dirección física.');
        return;
      }
      payload = {
        ...payload,
        merchantName: merchantName.trim(),
        managerName: managerName.trim(),
        fullName: merchantName.trim(),
        merchantRif: merchantRif.toUpperCase().trim(),
        address: merchantAddress.trim(),
        merchantCategory: merchantCategory
      };
    }

    setLoading(true);

    try {
      await signUp(payload);
      setSuccessMsg('¡Registro completado exitosamente!');

      setTimeout(() => {
        if (role === 'rider') navigate('/conductor');
        else if (role === 'merchant') navigate('/comercio');
        else navigate('/cliente');
      }, 1000);

    } catch (err) {
      console.error('Error de registro:', err);
      if (err.message?.includes('User already registered')) {
        setErrorMsg('Este correo ya está registrado. Intenta iniciar sesión.');
      } else if (err.message?.includes('Password should be')) {
        setErrorMsg('La contraseña debe tener mínimo 6 caracteres.');
      } else {
        setErrorMsg(err.message || 'Error al crear la cuenta. Verifica tus datos.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-white flex flex-col justify-center items-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-2xl">
        
        {/* Encabezado con logo y espaciado */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-600 to-amber-500 shadow-2xl shadow-orange-500/30 mb-4 ring-4 ring-orange-500/10">
            <span className="text-3xl font-black text-white tracking-tighter">M!</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Mándalo! <Sparkles className="w-6 h-6 text-amber-400" />
          </h1>
          <p className="text-sm text-gray-400 mt-2 font-medium">
            Selecciona tu perfil y completa tus datos oficiales
          </p>
        </div>

        {/* Tarjeta de Registro Principal */}
        <div className="bg-[#101626] border border-slate-800 rounded-[32px] p-6 sm:p-10 shadow-2xl shadow-black/80">
          <form onSubmit={handleSubmit}>
            
            {/* 1. Selector de Rol con Tarjetas Amplias y Separadas */}
            <div className="mb-8">
              <label className="auth-label mb-3">
                Tipo de Cuenta en Mándalo
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Opción Cliente */}
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    role === 'client'
                      ? 'bg-gradient-to-b from-orange-500/25 to-orange-600/10 border-orange-500 text-white shadow-lg shadow-orange-500/20 ring-2 ring-orange-500/40'
                      : 'bg-[#151F35] border-[#2B3D5D] text-gray-400 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  <User className={`w-7 h-7 mb-2 ${role === 'client' ? 'text-orange-400' : 'text-gray-400'}`} />
                  <span className="text-sm font-bold block">Cliente</span>
                  <span className="text-[11px] text-gray-400 mt-0.5">Pedir y Comprar</span>
                </button>

                {/* Opción Conductor / Taxista */}
                <button
                  type="button"
                  onClick={() => setRole('rider')}
                  className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    role === 'rider'
                      ? 'bg-gradient-to-b from-orange-500/25 to-orange-600/10 border-orange-500 text-white shadow-lg shadow-orange-500/20 ring-2 ring-orange-500/40'
                      : 'bg-[#151F35] border-[#2B3D5D] text-gray-400 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  <Bike className={`w-7 h-7 mb-2 ${role === 'rider' ? 'text-orange-400' : 'text-gray-400'}`} />
                  <span className="text-sm font-bold block">Taxista / Rider</span>
                  <span className="text-[11px] text-gray-400 mt-0.5">Llevar y Despachar</span>
                </button>

                {/* Opción Comercio */}
                <button
                  type="button"
                  onClick={() => setRole('merchant')}
                  className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    role === 'merchant'
                      ? 'bg-gradient-to-b from-orange-500/25 to-orange-600/10 border-orange-500 text-white shadow-lg shadow-orange-500/20 ring-2 ring-orange-500/40'
                      : 'bg-[#151F35] border-[#2B3D5D] text-gray-400 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  <Store className={`w-7 h-7 mb-2 ${role === 'merchant' ? 'text-orange-400' : 'text-gray-400'}`} />
                  <span className="text-sm font-bold block">Comercio</span>
                  <span className="text-[11px] text-gray-400 mt-0.5">Vender Productos</span>
                </button>
              </div>
            </div>

            {/* Aviso de aprobación administrativa para Taxistas y Comercios */}
            {role !== 'client' && (
              <div className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs sm:text-sm text-amber-200/90 flex items-start gap-3">
                <Clock className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <strong className="block text-amber-300 font-bold mb-0.5">
                    Aprobación Administrativa Previa
                  </strong>
                  <p className="leading-relaxed">
                    {role === 'rider'
                      ? 'El área de administración validará tu documento, cooperativa o línea de taxis y vehículo antes de activar tu acceso operativo.'
                      : 'Tu comercio será verificado por la administración para habilitar la recepción de órdenes y catálogo.'}
                  </p>
                </div>
              </div>
            )}

            {/* 2. DATOS DEL PERFIL (BLOQUE 1) */}
            <div className="auth-card-section">
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                {role === 'client' && <><User className="w-4 h-4" /> Datos Personales del Cliente</>}
                {role === 'rider' && <><Bike className="w-4 h-4" /> Datos del Conductor y Vehículo</>}
                {role === 'merchant' && <><Store className="w-4 h-4" /> Datos del Comercio y Encargado</>}
              </h3>

              {/* CAMPOS DE CLIENTE */}
              {role === 'client' && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="auth-label">Nombres *</label>
                      <input
                        type="text"
                        placeholder="Ej. Juan Carlos"
                        value={clientFirstName}
                        onChange={(e) => setClientFirstName(e.target.value)}
                        className="auth-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="auth-label">Apellidos *</label>
                      <input
                        type="text"
                        placeholder="Ej. Rodríguez"
                        value={clientLastName}
                        onChange={(e) => setClientLastName(e.target.value)}
                        className="auth-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="auth-label">Cédula de Identidad *</label>
                      <div className="relative">
                        <FileText className="w-5 h-5 text-gray-400 absolute left-4 top-4 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Ej. V-18234567"
                          value={clientIdentityDoc}
                          onChange={(e) => setClientIdentityDoc(e.target.value)}
                          className="auth-input auth-input-icon"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="auth-label">Teléfono Móvil *</label>
                      <div className="relative">
                        <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-4 pointer-events-none" />
                        <input
                          type="tel"
                          placeholder="Ej. 0414-1234567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="auth-input auth-input-icon"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="auth-label">Dirección de Entrega / Habitación *</label>
                    <div className="relative">
                      <MapPin className="w-5 h-5 text-gray-400 absolute left-4 top-4 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Ej. Sector Centro, Calle 5, Casa #12, Frente a la Plaza"
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        className="auth-input auth-input-icon"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CAMPOS DE CONDUCTOR / TAXISTA */}
              {role === 'rider' && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="auth-label">Nombres *</label>
                      <input
                        type="text"
                        placeholder="Ej. Pedro José"
                        value={riderFirstName}
                        onChange={(e) => setRiderFirstName(e.target.value)}
                        className="auth-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="auth-label">Apellidos *</label>
                      <input
                        type="text"
                        placeholder="Ej. Mendoza"
                        value={riderLastName}
                        onChange={(e) => setRiderLastName(e.target.value)}
                        className="auth-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="auth-label">Cédula de Identidad *</label>
                      <div className="relative">
                        <FileText className="w-5 h-5 text-gray-400 absolute left-4 top-4 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Ej. V-22345678"
                          value={riderIdentityDoc}
                          onChange={(e) => setRiderIdentityDoc(e.target.value)}
                          className="auth-input auth-input-icon"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="auth-label">Teléfono Móvil *</label>
                      <div className="relative">
                        <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-4 pointer-events-none" />
                        <input
                          type="tel"
                          placeholder="Ej. 0412-9876543"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="auth-input auth-input-icon"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="auth-label">Cooperativa o Línea de Taxis a la que pertenece</label>
                    <div className="relative">
                      <Briefcase className="w-5 h-5 text-gray-400 absolute left-4 top-4 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Ej. Línea Taxi Plaza Bolívar / Cooperativa Los Libertadores"
                        value={riderCooperative}
                        onChange={(e) => setRiderCooperative(e.target.value)}
                        className="auth-input auth-input-icon"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="auth-label">Tipo de Vehículo *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setVehicleType('moto')}
                        className={`h-12 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer ${
                          vehicleType === 'moto'
                            ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                            : 'bg-[#151F35] border-[#2B3D5D] text-gray-400'
                        }`}
                      >
                        <Bike className="w-5 h-5" /> Moto Taxi / Moto
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleType('car')}
                        className={`h-12 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer ${
                          vehicleType === 'car'
                            ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                            : 'bg-[#151F35] border-[#2B3D5D] text-gray-400'
                        }`}
                      >
                        <Car className="w-5 h-5" /> Carro / Taxi
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="auth-label">Placa del Vehículo *</label>
                      <input
                        type="text"
                        placeholder="Ej. AB123CD"
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        className="auth-input uppercase font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="auth-label">Marca y Modelo *</label>
                      <input
                        type="text"
                        placeholder="Ej. Chevrolet Spark / Bera SBR 150"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        className="auth-input"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CAMPOS DE COMERCIO */}
              {role === 'merchant' && (
                <div>
                  <div className="mb-4">
                    <label className="auth-label">Nombre Comercial del Negocio *</label>
                    <div className="relative">
                      <Store className="w-5 h-5 text-gray-400 absolute left-4 top-4 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Ej. Pizzería & Hamburguesas Don Pepe"
                        value={merchantName}
                        onChange={(e) => setMerchantName(e.target.value)}
                        className="auth-input auth-input-icon"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="auth-label">Nombre del Encargado / Responsable *</label>
                      <input
                        type="text"
                        placeholder="Ej. Carlos Martínez"
                        value={managerName}
                        onChange={(e) => setManagerName(e.target.value)}
                        className="auth-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="auth-label">RIF o Cédula Fiscal *</label>
                      <input
                        type="text"
                        placeholder="Ej. J-40123456-7"
                        value={merchantRif}
                        onChange={(e) => setMerchantRif(e.target.value)}
                        className="auth-input uppercase font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="auth-label">Teléfono del Negocio *</label>
                      <div className="relative">
                        <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-4 pointer-events-none" />
                        <input
                          type="tel"
                          placeholder="Ej. 0212-5551234 / 0414-9998877"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="auth-input auth-input-icon"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="auth-label">Categoría Comercial</label>
                      <select
                        value={merchantCategory}
                        onChange={(e) => setMerchantCategory(e.target.value)}
                        className="auth-input cursor-pointer"
                      >
                        <option value="Comida Rápida">Comida Rápida</option>
                        <option value="Restaurante">Restaurante / Gourmet</option>
                        <option value="Bodegón / Supermercado">Bodegón / Supermercado</option>
                        <option value="Farmacia">Farmacia</option>
                        <option value="Panadería y Repostería">Panadería y Repostería</option>
                        <option value="Repuestos y Servicios">Repuestos y Servicios</option>
                        <option value="Tienda y Variedades">Tienda y Variedades</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="auth-label">Dirección Física del Local *</label>
                    <div className="relative">
                      <MapPin className="w-5 h-5 text-gray-400 absolute left-4 top-4 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Ej. Av. Bolívar, Centro Comercial Mándalo, Local 4"
                        value={merchantAddress}
                        onChange={(e) => setMerchantAddress(e.target.value)}
                        className="auth-input auth-input-icon"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. CREDENCIALES DE ACCESO UNIVERSALES (BLOQUE 2) */}
            <div className="auth-card-section">
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Credenciales de Acceso a tu Cuenta
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="auth-label">Correo Electrónico *</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-4 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="ejemplo@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="auth-input auth-input-icon"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="auth-label">Contraseña de Ingreso *</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-4 pointer-events-none" />
                    <input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="auth-input auth-input-icon"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mensajes de error o éxito */}
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-500/15 border border-red-500/40 rounded-2xl text-red-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-300 text-sm flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Botón Principal de Envío */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl font-black text-base bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-orange-500/25 text-white cursor-pointer disabled:opacity-50 tracking-wide mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>
                    Crear Cuenta como {role === 'rider' ? 'Taxista / Conductor' : role === 'merchant' ? 'Comercio' : 'Cliente'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Enlace para ir a Login */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-sm text-gray-400">
              ¿Ya tienes una cuenta registrada?{' '}
              <Link to="/login" className="text-orange-400 font-bold hover:text-orange-300 hover:underline ml-1">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Register;
