import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localStore } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  // Fetch user profile from public.profiles
  const fetchProfile = async (userId) => {
    if (!userId || !isConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error al obtener perfil:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Excepción al consultar perfil:', err);
      return null;
    }
  };

  // Sync auth state on mount and listener
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isConfigured) {
        // Fallback for initial setup before user provides real keys
        setLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            const p = await fetchProfile(initialSession.user.id);
            if (mounted) setProfile(p);
          } else {
            // Restaurar sesión demo si existe para permitir recargas con F5
            const savedDemo = localStorage.getItem('mandalo_demo_session');
            if (savedDemo) {
              try {
                const parsed = JSON.parse(savedDemo);
                if (parsed.user) {
                  setUser(parsed.user);
                  setProfile(parsed.profile);
                  setSession({ user: parsed.user });
                }
              } catch (_) {}
            }
          }
        }
      } catch (err) {
        console.error('Error al inicializar sesión:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase auth events
    let subscription = null;
    if (isConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          if (!mounted) return;
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            const p = await fetchProfile(currentSession.user.id);
            if (mounted) setProfile(p);
          } else {
            if (mounted) setProfile(null);
          }
          setLoading(false);
        }
      );
      subscription = authListener.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [isConfigured]);

  // Sign in
  const signIn = async (email, password) => {
    if (!isConfigured) {
      throw new Error('Supabase no está configurado. Por favor configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env');
    }

    localStorage.removeItem('mandalo_demo_session');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Fetch and return profile alongside user
    let userProfile = await fetchProfile(data.user.id);
    setProfile(userProfile);
    return { user: data.user, profile: userProfile };
  };

  // Sign up con datos específicos según el rol
  const signUp = async ({
    email,
    password,
    role = 'client',
    firstName = '',
    lastName = '',
    fullName = '',
    phone = '',
    address = '',
    identityDoc = '',
    // Específicos para Taxista / Repartidor
    cooperative = '',
    vehicleType = 'none',
    vehiclePlate = null,
    vehicleModel = null,
    // Específicos para Comercio
    merchantName = '',
    managerName = '',
    merchantRif = '',
    merchantCategory = 'Comercio General'
  }) => {
    if (!isConfigured) {
      throw new Error('Supabase no está configurado. Por favor configura las credenciales en .env');
    }

    const calculatedFullName = fullName || `${firstName} ${lastName}`.trim() || merchantName || 'Usuario Mándalo';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: calculatedFullName,
          first_name: firstName,
          last_name: lastName,
          phone,
          address,
          identity_doc: identityDoc,
          // Datos de conductor
          cooperative: role === 'rider' ? cooperative : null,
          vehicle_type: role === 'rider' ? vehicleType : 'none',
          vehicle_plate: role === 'rider' ? vehiclePlate : null,
          vehicle_model: role === 'rider' ? vehicleModel : null,
          // Datos de comercio
          merchant_name: role === 'merchant' ? merchantName : null,
          manager_name: role === 'merchant' ? managerName : null,
          merchant_rif: role === 'merchant' ? merchantRif : null,
          merchant_category: role === 'merchant' ? merchantCategory : null
        }
      }
    });

    if (error) throw error;

    // Si la sesión se creó de inmediato (auto-confirmación)
    if (data.user) {
      const userProfile = await fetchProfile(data.user.id);
      setProfile(userProfile);
      return { user: data.user, profile: userProfile, session: data.session };
    }

    return { user: data.user, session: null };
  };

  // Comprobación de formato UUID válido para evitar errores 22P02 en Supabase con perfiles simulados
  const isValidUuid = (id) => {
    return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };

  // Actualizar estado de verificación de un usuario (para Administrador)
  const updateUserVerification = async (userId, isVerified, role) => {
    let cloudSynced = false;
    let cloudError = null;

    // Si es un ID de Supabase válido y Supabase está configurado, sincronizar con la nube
    if (isConfigured && isValidUuid(userId)) {
      try {
        // 1. Si es comercio, ejecutar RPC específico admin_set_merchant_verified
        if (role === 'merchant') {
          try {
            const { error: merchantRpcError } = await supabase.rpc('admin_set_merchant_verified', {
              p_owner_id: userId,
              p_verified: isVerified
            });
            if (!merchantRpcError) {
              cloudSynced = true;
            } else {
              console.warn('RPC admin_set_merchant_verified no disponible o con error:', merchantRpcError.message || merchantRpcError);
              cloudError = merchantRpcError.message;
            }
          } catch (rpcErr) {
            console.warn('Excepción al invocar RPC admin_set_merchant_verified:', rpcErr);
            cloudError = rpcErr.message;
          }

          // Fallback directo a la tabla merchants si la función RPC aún no está en Supabase
          if (!cloudSynced) {
            try {
              const { error: directErr } = await supabase
                .from('merchants')
                .update({ is_active: isVerified, verified: isVerified })
                .eq('owner_id', userId);

              if (!directErr) {
                cloudSynced = true;
              } else {
                // Si la columna verified aún no fue migrada, actualizar sólo is_active
                const { error: isActErr } = await supabase
                  .from('merchants')
                  .update({ is_active: isVerified })
                  .eq('owner_id', userId);
                if (!isActErr) cloudSynced = true;
                else cloudError = isActErr.message || directErr.message;
              }
            } catch (fallbackErr) {
              console.warn('Fallback update en merchants falló:', fallbackErr);
            }
          }
        }

        // 2. Intentar actualizar en public.profiles (o vía admin_set_user_verified)
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_verified: isVerified, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (!profileError) {
          cloudSynced = true;
        } else {
          console.warn('Advertencia actualizando profiles:', profileError.message || profileError);
          try {
            const { error: rpcUserErr } = await supabase.rpc('admin_set_user_verified', {
              p_user_id: userId,
              p_verified: isVerified
            });
            if (!rpcUserErr) cloudSynced = true;
            else if (!cloudSynced) cloudError = profileError.message || rpcUserErr.message;
          } catch (_) {}
        }

        if (!cloudSynced && cloudError) {
          console.error('No se pudo persistir el cambio en Supabase:', cloudError);
          throw new Error(`No se pudo guardar en Supabase: ${cloudError}. Por favor ejecuta el script SQL en Supabase para habilitar permisos.`);
        }
      } catch (e) {
        console.error('Error general actualizando verificación en Supabase:', e);
        throw e;
      }
    }

    // Actualizar siempre en el store local para reactividad inmediata sin bloquear la UI
    localStore.updateProfile(userId, { is_verified: isVerified, verified: isVerified });
    if (user?.id === userId) {
      await refreshProfile();
    }
  };

  // Actualizar datos de cualquier usuario (para Administrador)
  const adminUpdateUser = async (userId, updates) => {
    if (isConfigured && isValidUuid(userId)) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (error) {
          console.error('Error actualizando perfil en Supabase:', error);
        }

        // Si se actualizaron datos de comercio, reflejar en la tabla merchants
        if (updates.merchant_name || updates.address || updates.phone || typeof updates.is_verified === 'boolean') {
          const merchantUpdates = {};
          if (updates.merchant_name) merchantUpdates.name = updates.merchant_name;
          if (updates.address) merchantUpdates.address = updates.address;
          if (updates.phone) merchantUpdates.phone = updates.phone;
          if (typeof updates.is_verified === 'boolean') {
            merchantUpdates.is_active = updates.is_verified;
            merchantUpdates.verified = updates.is_verified;
          }
          
          if (Object.keys(merchantUpdates).length > 0) {
            const { error: mErr } = await supabase
              .from('merchants')
              .update(merchantUpdates)
              .eq('owner_id', userId);
            
            if (mErr) {
              delete merchantUpdates.verified;
              await supabase
                .from('merchants')
                .update(merchantUpdates)
                .eq('owner_id', userId);
            }
          }

          if (typeof updates.is_verified === 'boolean') {
            try {
              await supabase.rpc('admin_set_merchant_verified', {
                p_owner_id: userId,
                p_verified: updates.is_verified
              });
            } catch (_) {}
          }
        }
      } catch (e) {
        console.error('Excepción actualizando usuario en Supabase:', e);
      }
    }

    // Actualizar en el localStore
    localStore.updateProfile(userId, updates);
    if (user?.id === userId) {
      await refreshProfile();
    }
    return true;
  };

  // Eliminar usuario o comercio permanentemente (para Administrador)
  const adminDeleteUser = async (userId, merchantId = null) => {
    // 1. Marcar inmediatamente como eliminado localmente
    if (userId) localStore.markDeleted(userId);
    if (merchantId) localStore.markDeleted(merchantId);

    if (isConfigured) {
      const targetId = userId || merchantId;
      let cloudDeleted = false;

      // 2. Intentar llamar al RPC admin_delete_user en Supabase
      if (isValidUuid(targetId)) {
        try {
          const { error } = await supabase.rpc('admin_delete_user', {
            p_user_id: targetId
          });
          if (!error) {
            cloudDeleted = true;
          } else {
            console.warn('admin_delete_user RPC no disponible aún o falló:', error);
          }
        } catch (rpcErr) {
          console.warn('Excepción ejecutando admin_delete_user RPC:', rpcErr);
        }
      }

      // 3. Si no se pudo por RPC, intentar borrado directo
      if (!cloudDeleted) {
        try {
          if (merchantId && isValidUuid(merchantId)) {
            await supabase.from('products').delete().eq('merchant_id', merchantId);
            await supabase.from('merchants').delete().eq('id', merchantId);
          }
          if (userId && isValidUuid(userId)) {
            await supabase.from('merchants').delete().eq('owner_id', userId);
            const { error: profileErr } = await supabase.from('profiles').delete().eq('id', userId);
            if (profileErr) console.warn('Error eliminando perfil directo en Supabase:', profileErr);
          }
        } catch (directErr) {
          console.warn('Error en borrado directo en Supabase:', directErr);
        }
      }
    }

    // 4. Limpiar del localStore
    if (userId) localStore.deleteProfile(userId);
    if (merchantId) localStore.deleteMerchant(merchantId);

    return true;
  };

  // Actualizar contraseña del usuario actual (Administrador o cualquier rol autenticado)
  const updatePassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    if (isConfigured && session?.user) {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }
      return { success: true, data };
    }

    // Modo simulador / local
    return { success: true, simulated: true };
  };

  // Sign out
  const signOut = async () => {
    localStorage.removeItem('mandalo_demo_session');
    if (isConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  // Manual refresh of profile (e.g. after approval check)
  const refreshProfile = async () => {
    if (user?.id) {
      const p = await fetchProfile(user.id);
      setProfile(p);
      return p;
    }
    return null;
  };

  // Login rápido de prueba (útil para verificar UI y transiciones de rol)
  const loginAsDemo = (role, verified = true) => {
    const demoUser = {
      id: `demo-${role}-${verified ? 'ver' : 'unver'}`,
      email: `${role}@mandalo.app`,
      user_metadata: { role }
    };
    
    let demoProfile = {
      id: demoUser.id,
      full_name: role === 'rider' ? (verified ? 'Alejandro (Conductor Activo)' : 'Juan (Conductor en Revisión)') : role === 'merchant' ? (verified ? 'Burger & Pizza Mándalo' : 'Bodegón (En Revisión)') : (role === 'admin' ? 'Administrador Mándalo' : 'Carlos Cliente'),
      first_name: role === 'rider' ? 'Alejandro' : role === 'merchant' ? 'Encargado' : 'Carlos',
      last_name: 'Pérez',
      phone: '0414-1234567',
      address: 'Urb. Las Mercedes, Calle Principal #14',
      identity_doc: 'V-24589123',
      role: role,
      cooperative: role === 'rider' ? 'Línea Expresos Centro' : null,
      vehicle_type: role === 'rider' ? 'moto' : 'none',
      vehicle_plate: role === 'rider' ? 'AB123CD' : null,
      vehicle_model: role === 'rider' ? 'Bera SBR 150' : null,
      merchant_name: role === 'merchant' ? 'Burger & Pizza Mándalo' : null,
      manager_name: role === 'merchant' ? 'Roberto Gómez' : null,
      merchant_rif: role === 'merchant' ? 'J-40192834-1' : null,
      merchant_category: role === 'merchant' ? 'Comida Rápida' : null,
      is_verified: role === 'client' || role === 'admin' ? true : verified
    };

    localStorage.setItem('mandalo_demo_session', JSON.stringify({ user: demoUser, profile: demoProfile }));
    setUser(demoUser);
    setProfile(demoProfile);
    setSession({ user: demoUser });
    return { user: demoUser, profile: demoProfile };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isConfigured,
        signIn,
        signUp,
        signOut,
        updatePassword,
        refreshProfile,
        loginAsDemo,
        updateUserVerification,
        adminUpdateUser,
        adminDeleteUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
