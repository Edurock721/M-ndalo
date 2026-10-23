import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localStore } from '../../lib/supabase';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { exchangeRateService } from '../../lib/exchangeRate';
import { getSubscriptionState } from '../../lib/merchantSubscription';
import { 
  ShieldCheck, 
  Bike, 
  Car, 
  Store, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  LogOut, 
  Sparkles,
  Phone,
  FileText,
  MapPin,
  Briefcase,
  Pencil,
  Trash2,
  Search,
  Filter,
  X,
  Save,
  AlertTriangle,
  UserCheck,
  UserX,
} from 'lucide-react';

export function AdminPortal() {
  const { 
    user, 
    profile, 
    signOut, 
    updateUserVerification, 
    adminUpdateUser, 
    adminDeleteUser 
  } = useAuth();

  const [storeState, setStoreState] = useState(() => ({
    profiles: localStore.profiles,
    merchants: localStore.merchants
  }));

  const [rateData, setRateData] = useState(() => ({
    rate: exchangeRateService.rate,
    lastUpdated: exchangeRateService.lastUpdated,
    isFetching: exchangeRateService.isFetching
  }));

  // Tabs: 'riders' | 'merchants' | 'clients'
  const [activeTab, setActiveTab] = useState('riders');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  // Sync with Supabase on mount and changes
  const fetchSupabaseProfiles = async () => {
    if (isSupabaseConfigured()) {
      try {
        const [{ data, error }, { data: merchantData, error: merchantError }] = await Promise.all([
          supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
          supabase.from('merchants').select('*').order('created_at', { ascending: false })
        ]);

        if (error) throw error;
        if (merchantError) console.warn('AdminPortal: No se pudieron cargar los planes de comercios:', merchantError);
        if (data) {
          const loadedMerchants = merchantData || [];
          loadedMerchants.forEach(merchant => localStore.upsertMerchant(merchant));
          data.forEach(p => {
            const merchant = loadedMerchants.find(item => item.owner_id === p.id);
            localStore.updateProfile(p.id, {
              ...p,
              merchant_id: merchant?.id,
              verified: merchant?.verified,
              plan: merchant?.plan,
              subscription_status: merchant?.subscription_status,
              trial_start: merchant?.trial_start,
              trial_end: merchant?.trial_end,
              subscription_end: merchant?.subscription_end
            });
          });
        }
      } catch (err) {
        console.warn('AdminPortal: No se pudieron sincronizar perfiles de Supabase:', err);
      }
    }
  };

  useEffect(() => {
    fetchSupabaseProfiles();

    let adminChannel;
    if (isSupabaseConfigured()) {
      adminChannel = supabase
        .channel('admin-merchant-approvals')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
          if (payload.eventType === 'DELETE') {
            localStore.deleteProfile(payload.old.id);
          } else if (payload.new?.role === 'merchant') {
            localStore.updateProfile(payload.new.id, payload.new);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'merchants' }, payload => {
          if (payload.eventType === 'DELETE') localStore.deleteMerchant(payload.old.id);
          else if (payload.new) localStore.upsertMerchant(payload.new);
        })
        .subscribe();
    }

    const unsubStore = localStore.subscribe(() => {
      setStoreState({
        profiles: [...localStore.profiles],
        merchants: [...localStore.merchants]
      });
    });

    const unsubRate = exchangeRateService.subscribe((data) => {
      setRateData({ ...data });
    });

    return () => {
      unsubStore();
      unsubRate();
      adminChannel?.unsubscribe();
    };
  }, []);

  const currentRate = rateData.rate;

  const showNotification = (msg, type = 'success') => {
    setActionNotice({ msg, type });
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Listas divididas por Rol
  const riders = useMemo(() => 
    storeState.profiles.filter(p => p.role === 'rider'), 
    [storeState.profiles]
  );

  const merchantsList = useMemo(() => 
    storeState.profiles.filter(p => p.role === 'merchant'), 
    [storeState.profiles]
  );

  const clientsList = useMemo(() => 
    storeState.profiles.filter(p => p.role === 'client'), 
    [storeState.profiles]
  );

  const pendingRidersCount = useMemo(() => 
    riders.filter(r => !r.is_verified).length, 
    [riders]
  );

  const pendingMerchantsCount = useMemo(() => 
    merchantsList.filter(m => !m.is_verified).length, 
    [merchantsList]
  );
  const merchantPlanCounts = useMemo(() => ({
    total: merchantsList.length,
    active: merchantsList.filter(m => m.is_verified && !getSubscriptionState(m).expired).length,
    trial: merchantsList.filter(m => getSubscriptionState(m).plan === 'trial' && !getSubscriptionState(m).expired).length,
    free: merchantsList.filter(m => getSubscriptionState(m).plan === 'free').length,
    pro: merchantsList.filter(m => getSubscriptionState(m).plan === 'pro' && !getSubscriptionState(m).expired).length,
    expired: merchantsList.filter(m => getSubscriptionState(m).expired).length
  }), [merchantsList]);

  // Filtrado reactivo según búsqueda y estado
  const filterList = (list) => {
    return list.filter(item => {
      // Filtro de texto
      const query = searchQuery.toLowerCase().trim();
      const matchQuery = !query || 
        (item.full_name && item.full_name.toLowerCase().includes(query)) ||
        (item.phone && item.phone.toLowerCase().includes(query)) ||
        (item.identity_doc && item.identity_doc.toLowerCase().includes(query)) ||
        (item.merchant_name && item.merchant_name.toLowerCase().includes(query)) ||
        (item.cooperative && item.cooperative.toLowerCase().includes(query)) ||
        (item.address && item.address.toLowerCase().includes(query)) ||
        (item.email && item.email.toLowerCase().includes(query));

      // Filtro de estado
      if (statusFilter === 'pending') return matchQuery && !item.is_verified;
      if (statusFilter === 'verified') return matchQuery && item.is_verified;
      if (statusFilter === 'active') {
        return matchQuery && item.is_verified && !getSubscriptionState(item).expired;
      }
      if (['trial', 'free', 'pro', 'expired'].includes(statusFilter)) {
        const subscription = getSubscriptionState(item);
        if (statusFilter === 'expired') return matchQuery && subscription.expired;
        return matchQuery && subscription.plan === statusFilter && !subscription.expired;
      }
      return matchQuery;
    });
  };

  const filteredRiders = filterList(riders);
  const filteredMerchants = filterList(merchantsList);
  const filteredClients = filterList(clientsList);

  // Acciones administrativas
  const handleToggleVerification = async (userId, newStatus, userName, role) => {
    try {
      await updateUserVerification(userId, newStatus, role);
      showNotification(
        newStatus 
          ? `✓ Se ha aprobado y activado a "${userName}"` 
          : `⏸ Se ha suspendido a "${userName}"`
      );
    } catch (e) {
      console.error('Error al cambiar el estado del usuario:', e);
      showNotification(e.message || 'Error al cambiar el estado del usuario', 'error');
    }
  };

  const handleOpenEdit = (userItem) => {
    setEditingUser({
      id: userItem.id,
      role: userItem.role,
      full_name: userItem.full_name || '',
      first_name: userItem.first_name || '',
      last_name: userItem.last_name || '',
      email: userItem.email || '',
      phone: userItem.phone || '',
      identity_doc: userItem.identity_doc || '',
      address: userItem.address || '',
      is_verified: userItem.is_verified ?? true,
      // Rider
      cooperative: userItem.cooperative || '',
      vehicle_type: userItem.vehicle_type || 'moto',
      vehicle_plate: userItem.vehicle_plate || '',
      vehicle_model: userItem.vehicle_model || '',
      // Merchant
      merchant_name: userItem.merchant_name || userItem.full_name || '',
      manager_name: userItem.manager_name || userItem.full_name || '',
      merchant_rif: userItem.merchant_rif || '',
      merchant_category: userItem.merchant_category || 'Comercio General'
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);

    try {
      const calculatedFullName = editingUser.role === 'merchant'
        ? (editingUser.merchant_name || editingUser.full_name)
        : (editingUser.full_name || `${editingUser.first_name} ${editingUser.last_name}`.trim());

      const updates = {
        ...editingUser,
        full_name: calculatedFullName
      };

      await adminUpdateUser(editingUser.id, updates);
      showNotification(`✓ Usuario "${calculatedFullName}" actualizado exitosamente`);
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      showNotification('Error al guardar los cambios del usuario', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      const name = userToDelete.full_name || userToDelete.merchant_name || 'Usuario';
      await adminDeleteUser(userToDelete.id);
      showNotification(`✓ "${name}" ha sido eliminado del sistema exitosamente`);
      setUserToDelete(null);
    } catch (err) {
      console.error(err);
      showNotification('Error al eliminar usuario', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-white pb-24 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Toast de Notificaciones */}
      {actionNotice && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl text-sm font-extrabold flex items-center gap-3 border ${
            actionNotice.type === 'error'
              ? 'bg-red-950/95 text-red-200 border-red-500/60 shadow-red-950/60'
              : 'bg-emerald-950/95 text-emerald-200 border-emerald-500/60 shadow-emerald-950/60'
          }`}>
            <span>{actionNotice.msg}</span>
          </div>
        </div>
      )}

      {/* Header Superior Principal con Espaciado Generoso */}
      <header className="sticky top-0 z-30 bg-[#0B101E]/95 backdrop-blur-md border-b border-gray-800/80 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center font-black text-white shadow-lg shadow-emerald-500/25">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider">Super Administrador</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <h1 className="truncate text-base sm:text-xl font-black text-white tracking-tight">
                Panel Central MÁNDALO!
              </h1>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm shadow-sm">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-gray-400 hidden md:inline font-medium text-xs">Tasa BCV:</span>
              <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm">{currentRate.toFixed(2)} Bs/$</span>
            </div>

            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-bold text-gray-200">{profile?.full_name || 'Admin'}</span>
              <span className="text-[11px] text-gray-400">{user?.email || 'edurock721@gmail.com'}</span>
            </div>

            {/* Botón Salir Grande y Fácil de Tocar */}
            <button
              onClick={() => signOut()}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-red-300 hover:text-white text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 min-h-[44px]"
              title="Cerrar sesión de Administrador"
            >
              <LogOut className="w-5 h-5 text-red-400 flex-shrink-0" strokeWidth={2.3} />
              <span className="hidden sm:inline text-xs sm:text-sm font-black">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal con Áreas Amplias y Separadas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-10">
        
        {/* Banner de Auditoría y Resumen Superior */}
        <section className="bg-gradient-to-r from-[#0F172A] via-[#111C35] to-[#0D1528] border border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                Gestión Integral de Usuarios, Comercios & Auditoría
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Control Central de Validaciones y Usuarios
              </h2>
              <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
                Supervisa a taxistas, repartidores, comercios aliados y clientes. Aprueba o suspende credenciales, edita cualquier campo y mantén la plataforma segura.
              </p>
            </div>

            {/* 4 Métricas Clave Espaciadas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div 
                onClick={() => { setActiveTab('merchants'); setStatusFilter('all'); }}
                className="bg-[#15203B]/80 hover:bg-[#1A284A] border border-amber-500/30 hover:border-amber-500/60 p-4 sm:p-5 rounded-2xl text-center cursor-pointer transition-all shadow-lg"
              >
                <span className="text-[11px] text-gray-400 uppercase tracking-wider block font-bold">Total comercios</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-1 block">
                  {merchantPlanCounts.total}
                </span>
              </div>

              <div 
                onClick={() => { setActiveTab('merchants'); setStatusFilter('pending'); }}
                className="bg-[#15203B]/80 hover:bg-[#1A284A] border border-amber-500/30 hover:border-amber-500/60 p-4 sm:p-5 rounded-2xl text-center cursor-pointer transition-all shadow-lg"
              >
                <span className="text-[11px] text-gray-400 uppercase tracking-wider block font-bold">Comercios pendientes por validar</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-1 block">
                  {pendingMerchantsCount}
                </span>
              </div>

              <div 
                onClick={() => { setActiveTab('merchants'); setStatusFilter('active'); }}
                className="bg-[#15203B]/80 hover:bg-[#1A284A] border border-cyan-500/30 hover:border-cyan-500/60 p-4 sm:p-5 rounded-2xl text-center cursor-pointer transition-all shadow-lg"
              >
                <span className="text-[11px] text-gray-400 uppercase tracking-wider block font-bold">Comercios activos</span>
                <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono mt-1 block">
                  {merchantPlanCounts.active}
                </span>
              </div>

              <div 
                onClick={() => { setActiveTab('merchants'); setStatusFilter('pro'); }}
                className="bg-[#15203B]/80 hover:bg-[#1A284A] border border-emerald-500/30 hover:border-emerald-500/60 p-4 sm:p-5 rounded-2xl text-center cursor-pointer transition-all shadow-lg"
              >
                <span className="text-[11px] text-gray-400 uppercase tracking-wider block font-bold">Comercios Pro</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1 block">
                  {merchantPlanCounts.pro}
                </span>
              </div>

              <div onClick={() => { setActiveTab('merchants'); setStatusFilter('trial'); }} className="bg-[#15203B]/80 border border-blue-500/30 p-4 sm:p-5 rounded-2xl text-center cursor-pointer">
                <span className="text-[11px] text-gray-400 uppercase tracking-wider block font-bold">Comercios en prueba</span>
                <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono mt-1 block">{merchantPlanCounts.trial}</span>
              </div>

              <div onClick={() => { setActiveTab('merchants'); setStatusFilter('expired'); }} className="bg-[#15203B]/80 border border-red-500/30 p-4 sm:p-5 rounded-2xl text-center cursor-pointer">
                <span className="text-[11px] text-gray-400 uppercase tracking-wider block font-bold">Comercios vencidos</span>
                <span className="text-2xl sm:text-3xl font-black text-red-400 font-mono mt-1 block">{merchantPlanCounts.expired}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Barra de Navegación por Pestañas con Amplia Separación */}
        <section className="space-y-6">
          <div className="flex gap-4 overflow-x-auto pb-3 border-b border-gray-800">
            <button
              onClick={() => { setActiveTab('riders'); setStatusFilter('all'); }}
              className={`px-6 py-4 rounded-2xl font-black text-sm sm:text-base flex items-center gap-3 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'riders'
                  ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/25 scale-[1.02]'
                  : 'bg-[#12192B] text-gray-300 hover:text-white hover:bg-[#18233D] border border-gray-800'
              }`}
            >
              <Bike className="w-5 h-5" />
              <span>Taxistas y Repartidores</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                activeTab === 'riders' ? 'bg-black/30 text-white' : 'bg-gray-800 text-gray-300'
              }`}>
                {riders.length}
              </span>
              {pendingRidersCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black font-black text-xs animate-pulse">
                  {pendingRidersCount} pend
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('merchants'); setStatusFilter('all'); }}
              className={`px-6 py-4 rounded-2xl font-black text-sm sm:text-base flex items-center gap-3 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'merchants'
                  ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/25 scale-[1.02]'
                  : 'bg-[#12192B] text-gray-300 hover:text-white hover:bg-[#18233D] border border-gray-800'
              }`}
            >
              <Store className="w-5 h-5" />
              <span>Comercios Afiliados</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                activeTab === 'merchants' ? 'bg-black/30 text-white' : 'bg-gray-800 text-gray-300'
              }`}>
                {merchantsList.length}
              </span>
              {pendingMerchantsCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black font-black text-xs animate-pulse">
                  {pendingMerchantsCount} pend
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('clients'); setStatusFilter('all'); }}
              className={`px-6 py-4 rounded-2xl font-black text-sm sm:text-base flex items-center gap-3 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'clients'
                  ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/25 scale-[1.02]'
                  : 'bg-[#12192B] text-gray-300 hover:text-white hover:bg-[#18233D] border border-gray-800'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Clientes Registrados</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                activeTab === 'clients' ? 'bg-black/30 text-white' : 'bg-gray-800 text-gray-300'
              }`}>
                {clientsList.length}
              </span>
            </button>

          </div>

          {/* Panel de Búsqueda y Filtros con Espaciado Amplio y Desahogado */}
          {(
            <div className="bg-[#0D1424] border border-[#233352] rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
              {/* Buscador a Ancho Completo */}
              <div className="relative w-full">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'riders' 
                      ? "Buscar taxista o repartidor por nombre, cédula, cooperativa, placa o teléfono..." 
                      : activeTab === 'merchants'
                      ? "Buscar comercio por nombre del local, encargado, RIF o dirección..."
                      : "Buscar cliente por nombre, cédula, teléfono o dirección de entrega..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 bg-[#141F38] border-2 border-[#2B3D5D] focus:border-orange-500 rounded-2xl pl-12 pr-12 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none transition-all shadow-inner"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Fila de Botones de Filtro Grandes y Separados */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-800">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-gray-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5 mr-2">
                    <Filter className="w-4 h-4 text-orange-400" /> Filtrar estado:
                  </span>
                  
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-[#141F38] text-gray-300 hover:text-white border border-[#2B3D5D] hover:border-gray-500'
                    }`}
                  >
                    Todos ({activeTab === 'riders' ? riders.length : activeTab === 'merchants' ? merchantsList.length : clientsList.length})
                  </button>

                  {activeTab !== 'clients' && (
                    <>
                      <button
                        onClick={() => setStatusFilter('pending')}
                        className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                          statusFilter === 'pending'
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25 font-black'
                            : 'bg-[#141F38] text-amber-300 border border-amber-500/40 hover:bg-amber-500/10'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        <span>En Espera / Revisión</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-200 text-xs font-black">
                          {activeTab === 'riders' ? pendingRidersCount : pendingMerchantsCount}
                        </span>
                      </button>

                      <button
                        onClick={() => setStatusFilter('verified')}
                        className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                          statusFilter === 'verified'
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 font-black'
                            : 'bg-[#141F38] text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/10'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{activeTab === 'merchants' ? 'Comercios aprobados' : 'Aprobados y activos'}</span>
                      </button>
                      {activeTab === 'merchants' && ['trial', 'free', 'pro', 'expired'].map(planStatus => (
                        <button
                          key={planStatus}
                          onClick={() => setStatusFilter(planStatus)}
                          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold capitalize ${statusFilter === planStatus ? 'bg-blue-500 text-white' : 'bg-[#141F38] text-blue-200 border border-blue-500/30'}`}
                        >
                          {planStatus === 'trial' ? 'En prueba' : planStatus === 'free' ? 'Gratuitos' : planStatus === 'pro' ? 'Pro' : 'Vencidos'}
                        </button>
                      ))}
                    </>
                  )}
                </div>

                <div className="text-xs text-gray-400 font-medium">
                  Mostrando <strong className="text-white font-bold">{activeTab === 'riders' ? filteredRiders.length : activeTab === 'merchants' ? filteredMerchants.length : filteredClients.length}</strong> registros
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ============================================================== */}
        {/* 1. SECCIÓN: TAXISTAS Y REPARTIDORES */}
        {/* ============================================================== */}
        {activeTab === 'riders' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  Taxistas y Repartidores ({filteredRiders.length})
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Valida la línea de transporte, vehículo, placa y decide la activación o suspensión del conductor.
                </p>
              </div>
            </div>

            {filteredRiders.length === 0 ? (
              <div className="bg-[#0D1424] border border-gray-800 rounded-3xl p-16 text-center text-gray-400">
                <Bike className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-lg font-bold text-gray-200">No se encontraron taxistas o repartidores</p>
                <p className="text-xs text-gray-400 mt-1">Prueba cambiando los términos de búsqueda o el filtro de estado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredRiders.map((r) => {
                  const isVerified = Boolean(r.is_verified);
                  return (
                    <div 
                      key={r.id}
                      className={`bg-[#0D1424] border-2 rounded-3xl p-6 sm:p-8 shadow-xl transition-all space-y-6 ${
                        isVerified 
                          ? 'border-[#233352] hover:border-gray-600' 
                          : 'border-amber-500/60 bg-[#11192E] shadow-amber-950/25'
                      }`}
                    >
                      {/* Cabecera Superior Amplia */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                            r.vehicle_type === 'car'
                              ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
                              : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                          }`}>
                            {r.vehicle_type === 'car' ? <Car className="w-8 h-8" /> : <Bike className="w-8 h-8" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-lg sm:text-xl font-black text-white">
                                {r.full_name}
                              </h4>
                              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold capitalize">
                                {r.vehicle_type === 'car' ? 'Carro / Taxi' : 'Moto Taxi'}
                              </span>
                            </div>
                            <span className="text-sm text-gray-300 flex items-center gap-2 mt-1 font-semibold">
                              <Phone className="w-4 h-4 text-orange-400" /> {r.phone || 'Sin teléfono'}
                            </span>
                          </div>
                        </div>

                        {/* Estado de validación */}
                        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                          <span className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm ${
                            isVerified 
                              ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300' 
                              : 'bg-amber-500/20 border border-amber-500/50 text-amber-300 animate-pulse'
                          }`}>
                            {isVerified ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            {isVerified ? 'Aprobado y Activo' : 'En Espera de Revisión'}
                          </span>
                        </div>
                      </div>

                      {/* Cuadrícula de Especificaciones Técnica en 4 Columnas Holgadas */}
                      <div className="bg-[#141F38] border border-[#253554] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
                        <div className="space-y-1">
                          <span className="text-gray-400 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                            <FileText className="w-3.5 h-3.5 text-gray-400" /> Cédula de Identidad:
                          </span>
                          <span className="font-mono text-white font-bold block text-sm">{r.identity_doc || 'No indicada'}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-gray-400 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                            <Briefcase className="w-3.5 h-3.5 text-gray-400" /> Cooperativa / Línea:
                          </span>
                          <span className="text-amber-400 font-bold block text-sm truncate">{r.cooperative || 'Particular / Sin línea'}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-gray-400 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                            Placa & Modelo:
                          </span>
                          <span className="text-orange-400 font-mono font-black block text-sm truncate">
                            {r.vehicle_plate || 'Sin Placa'} · {r.vehicle_model || 'Sin Modelo'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-gray-400 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> Domicilio / Zona:
                          </span>
                          <span className="text-gray-300 font-medium block truncate">{r.address || 'Sin dirección registrada'}</span>
                        </div>
                      </div>

                      {/* Barra de Acciones Amplia e Independiente */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-800">
                        <div className="flex items-center gap-3 flex-wrap">
                          {!isVerified ? (
                            <button
                              onClick={() => handleToggleVerification(r.id, true, r.full_name, r.role)}
                              className="h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
                            >
                              <CheckCircle className="w-5 h-5" />
                              <span>Aprobar y Activar Conductor</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleVerification(r.id, false, r.full_name, r.role)}
                              className="h-12 px-6 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
                            >
                              <UserX className="w-5 h-5" />
                              <span>Pausar / Suspender</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="h-12 px-6 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/40 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                            <span>Editar Datos</span>
                          </button>
                        </div>

                        <button
                          onClick={() => setUserToDelete(r)}
                          className="h-12 px-5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/40 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* 2. SECCIÓN: COMERCIOS AFILIADOS */}
        {/* ============================================================== */}
        {activeTab === 'merchants' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  {statusFilter === 'pending' ? 'Comercios pendientes por validar' : 'Comercios y Locales Afiliados'} ({filteredMerchants.length})
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Valida la información comercial, número de RIF, encargado del establecimiento y habilita el catálogo de productos.
                </p>
              </div>
            </div>

            {filteredMerchants.length === 0 ? (
              <div className="bg-[#0D1424] border border-gray-800 rounded-3xl p-16 text-center text-gray-400">
                <Store className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-lg font-bold text-gray-200">No se encontraron comercios</p>
                <p className="text-xs text-gray-400 mt-1">Prueba cambiando los términos de búsqueda o el filtro de estado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredMerchants.map((m) => {
                  const isVerified = Boolean(m.is_verified);
                  const storeName = m.merchant_name || m.full_name;
                  return (
                    <div 
                      key={m.id}
                      className={`bg-[#0D1424] border-2 rounded-3xl p-6 sm:p-8 shadow-xl transition-all space-y-6 ${
                        isVerified 
                          ? 'border-[#233352] hover:border-gray-600' 
                          : 'border-amber-500/60 bg-[#11192E] shadow-amber-950/25'
                      }`}
                    >
                      {/* Cabecera */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-lg">
                            <Store className="w-8 h-8" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-lg sm:text-xl font-black text-white">
                                {storeName}
                              </h4>
                              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
                                {m.merchant_category || 'Comercio General'}
                              </span>
                            </div>
                            <span className="text-sm text-gray-300 flex items-center gap-2 mt-1 font-semibold">
                              <Phone className="w-4 h-4 text-orange-400" /> {m.phone || 'Sin teléfono'}
                            </span>
                          </div>
                        </div>

                        {/* Plan y estado */}
                        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                          <span className="px-4 py-2.5 rounded-2xl text-xs font-black uppercase border border-blue-500/40 bg-blue-500/10 text-blue-300">
                            {getSubscriptionState(m).expired ? 'Vencido' : getSubscriptionState(m).plan.toUpperCase()}
                          </span>

                          <span className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm ${
                            isVerified 
                              ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300' 
                              : 'bg-amber-500/20 border border-amber-500/50 text-amber-300 animate-pulse'
                          }`}>
                            {isVerified ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            {isVerified ? 'Comercio Aprobado' : 'En Validación'}
                          </span>
                        </div>
                      </div>

                      {/* Cuadrícula de Especificaciones Técnica en 4 Columnas Holgadas */}
                      <div className="bg-[#141F38] border border-[#253554] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
                        <div className="space-y-1">
                          <span className="text-gray-400 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                            Encargado Responsable:
                          </span>
                          <span className="text-white font-bold block text-sm">{m.manager_name || m.full_name || 'No indicado'}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-gray-400 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                            RIF / Cédula Fiscal:
                          </span>
                          <span className="font-mono text-amber-400 font-bold block text-sm">{m.merchant_rif || 'No especificado'}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-gray-400 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                            Categoría Comercial:
                          </span>
                          <span className="text-white font-medium block text-sm">{m.merchant_category || 'Comercio General'}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-gray-400 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> Dirección Física / Local:
                          </span>
                          <span className="text-gray-300 font-medium block truncate">{m.address || 'Sin dirección física'}</span>
                        </div>
                      </div>

                      {/* Barra de Acciones */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-800">
                        <div className="flex items-center gap-3 flex-wrap">
                          {!isVerified ? (
                            <button
                              onClick={() => handleToggleVerification(m.id, true, storeName, m.role)}
                              className="h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
                            >
                              <CheckCircle className="w-5 h-5" />
                              <span>Aprobar y Activar Comercio</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleVerification(m.id, false, storeName, m.role)}
                              className="h-12 px-6 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
                            >
                              <UserX className="w-5 h-5" />
                              <span>Pausar Comercio</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="h-12 px-6 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/40 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                            <span>Editar Comercio</span>
                          </button>
                        </div>

                        <button
                          onClick={() => setUserToDelete(m)}
                          className="h-12 px-5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/40 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* 3. SECCIÓN: CLIENTES REGISTRADOS */}
        {/* ============================================================== */}
        {activeTab === 'clients' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  Clientes Registrados ({filteredClients.length})
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Visualiza a los usuarios compradores y actualiza sus datos de contacto y despacho.
                </p>
              </div>
            </div>

            {filteredClients.length === 0 ? (
              <div className="bg-[#0D1424] border border-gray-800 rounded-3xl p-16 text-center text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-lg font-bold text-gray-200">No se encontraron clientes</p>
                <p className="text-xs text-gray-400 mt-1">Prueba buscando por otro término de búsqueda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredClients.map((c) => {
                  return (
                    <div 
                      key={c.id}
                      className="bg-[#0D1424] border-2 border-[#233352] hover:border-gray-600 rounded-3xl p-6 sm:p-8 shadow-xl transition-all space-y-6"
                    >
                      {/* Cabecera */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg">
                            <Users className="w-8 h-8" />
                          </div>
                          <div>
                            <h4 className="text-lg sm:text-xl font-black text-white">
                              {c.full_name}
                            </h4>
                            <span className="text-sm text-gray-300 flex items-center gap-2 mt-1 font-semibold">
                              <Phone className="w-4 h-4 text-orange-400" /> {c.phone || 'Sin teléfono'}
                            </span>
                          </div>
                        </div>

                        {/* Estado de cuenta */}
                        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">

                          <span className="px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center gap-2">
                            <UserCheck className="w-4 h-4" />
                            Cliente Activo
                          </span>
                        </div>
                      </div>

                      {/* Cuadrícula de Especificaciones Técnica en 3 Columnas Holgadas */}
                      <div className="bg-[#141F38] border border-[#253554] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                        <div className="space-y-1">
                          <span className="text-gray-400 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                            <FileText className="w-3.5 h-3.5 text-gray-400" /> Documento / Cédula:
                          </span>
                          <span className="font-mono text-white font-bold block text-sm">{c.identity_doc || 'No registrada'}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-gray-400 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-gray-400" /> Teléfono Registrado:
                          </span>
                          <span className="text-gray-200 font-bold block text-sm">{c.phone || 'Sin teléfono'}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-gray-400 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> Dirección de Entrega Guardada:
                          </span>
                          <span className="text-gray-300 font-medium block truncate">{c.address || 'Sin dirección guardada'}</span>
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-800">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="h-12 px-6 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/40 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Editar Datos del Cliente</span>
                        </button>

                        <button
                          onClick={() => setUserToDelete(c)}
                          className="h-12 px-5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/40 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

      </main>

      {/* ============================================================== */}
      {/* MODAL DE EDICIÓN DE USUARIO (AMPLIO Y DESAHOGADO) */}
      {/* ============================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-[#0F172A] border-2 border-gray-700 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                  <Pencil className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    Editar Datos ({editingUser.role === 'rider' ? 'Taxista / Repartidor' : editingUser.role === 'merchant' ? 'Comercio' : 'Cliente'})
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Modifica los datos personales o fiscales.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario Dinámico con Gran Separación */}
            <form onSubmit={handleSaveEdit} className="space-y-6">
              
              {/* Campos para Comercio */}
              {editingUser.role === 'merchant' && (
                <div className="bg-[#141F38] border border-orange-500/30 rounded-2xl p-5 space-y-5">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                    Datos del Comercio / Negocio
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-2">Nombre del Local / Comercio</label>
                      <input
                        type="text"
                        value={editingUser.merchant_name}
                        onChange={(e) => setEditingUser({ ...editingUser, merchant_name: e.target.value })}
                        required
                        className="w-full h-12 bg-[#0D1527] border border-gray-700 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-2">RIF / Cédula Fiscal</label>
                      <input
                        type="text"
                        value={editingUser.merchant_rif}
                        onChange={(e) => setEditingUser({ ...editingUser, merchant_rif: e.target.value })}
                        placeholder="J-12345678-9"
                        className="w-full h-12 bg-[#0D1527] border border-gray-700 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-2">Nombre del Encargado</label>
                      <input
                        type="text"
                        value={editingUser.manager_name}
                        onChange={(e) => setEditingUser({ ...editingUser, manager_name: e.target.value })}
                        className="w-full h-12 bg-[#0D1527] border border-gray-700 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-2">Categoría Comercial</label>
                      <input
                        type="text"
                        value={editingUser.merchant_category}
                        onChange={(e) => setEditingUser({ ...editingUser, merchant_category: e.target.value })}
                        placeholder="Ej. Comida Rápida, Farmacia, Víveres"
                        className="w-full h-12 bg-[#0D1527] border border-gray-700 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Campos para Taxista / Repartidor */}
              {editingUser.role === 'rider' && (
                <div className="bg-[#141F38] border border-amber-500/30 rounded-2xl p-5 space-y-5">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Datos del Conductor & Vehículo
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-2">Cooperativa / Línea de Taxi</label>
                      <input
                        type="text"
                        value={editingUser.cooperative}
                        onChange={(e) => setEditingUser({ ...editingUser, cooperative: e.target.value })}
                        placeholder="Ej. Línea Los Próceres o Particular"
                        className="w-full h-12 bg-[#0D1527] border border-gray-700 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-2">Tipo de Vehículo</label>
                      <select
                        value={editingUser.vehicle_type}
                        onChange={(e) => setEditingUser({ ...editingUser, vehicle_type: e.target.value })}
                        className="w-full h-12 bg-[#0D1527] border border-gray-700 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="moto">Moto Taxi / Repartidor</option>
                        <option value="car">Carro / Taxi Particular</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-2">Placa del Vehículo</label>
                      <input
                        type="text"
                        value={editingUser.vehicle_plate}
                        onChange={(e) => setEditingUser({ ...editingUser, vehicle_plate: e.target.value })}
                        placeholder="AB123CD"
                        className="w-full h-12 bg-[#0D1527] border border-gray-700 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-orange-500 font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-2">Modelo y Marca</label>
                      <input
                        type="text"
                        value={editingUser.vehicle_model}
                        onChange={(e) => setEditingUser({ ...editingUser, vehicle_model: e.target.value })}
                        placeholder="Ej. Bera SBR 150 / Toyota Corolla"
                        className="w-full h-12 bg-[#0D1527] border border-gray-700 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Datos Personales Comunes (Nombres, Cédula, Teléfono, Dirección) */}
              <div className="bg-[#141F38] border border-gray-700/80 rounded-2xl p-5 space-y-5">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Información Personal</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-2">Nombre Completo</label>
                    <input
                      type="text"
                      value={editingUser.full_name}
                      onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                      required
                      className="w-full h-12 bg-[#0D1527] border border-gray-700 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-2">Cédula de Identidad</label>
                    <input
                      type="text"
                      value={editingUser.identity_doc}
                      onChange={(e) => setEditingUser({ ...editingUser, identity_doc: e.target.value })}
                      placeholder="V-12345678"
                      className="w-full h-12 bg-[#0D1527] border border-gray-700 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-2">Número de Teléfono</label>
                    <input
                      type="tel"
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      placeholder="0414-1234567"
                      className="w-full h-12 bg-[#0D1527] border border-gray-700 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-2">Dirección Física / Despacho</label>
                  <input
                    type="text"
                    value={editingUser.address}
                    onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                    placeholder="Urb., Calle, Edificio, Punto de Referencia"
                    className="w-full h-12 bg-[#0D1527] border border-gray-700 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Botones de Guardar / Cancelar */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="h-12 px-6 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-sm transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 px-8 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                >
                  <Save className="w-5 h-5" />
                  <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {/* ============================================================== */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#111827] border border-red-500/50 rounded-3xl w-full max-w-lg p-7 sm:p-8 shadow-2xl space-y-6 text-center">
            
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/50 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/25">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">¿Eliminar Usuario?</h3>
              <p className="text-sm text-gray-300 leading-relaxed max-w-md mx-auto">
                Estás a punto de eliminar a <strong className="text-white">"{userToDelete.full_name || userToDelete.merchant_name}"</strong> ({userToDelete.role}). 
                Esta acción borrará sus credenciales, perfil y registros de manera irreversible.
              </p>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 h-12 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-sm transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                <Trash2 className="w-5 h-5" />
                <span>{isSubmitting ? 'Eliminando...' : 'Sí, Eliminar'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AdminPortal;
