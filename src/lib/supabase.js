import { createClient } from '@supabase/supabase-js';
import { 
  INITIAL_PROFILES, 
  INITIAL_MERCHANTS, 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_MESSAGES 
} from './mockData';
import { soundManager } from './soundEffects';
import { canPublishProduct, canReceiveOrders, DEFAULT_PAYMENT_CONFIG, DEFAULT_PAYMENT_METHODS } from './merchantSubscription';

const STORAGE_KEYS = {
  CONFIG: 'mandalo_supabase_config',
  PROFILES: 'mandalo_profiles',
  MERCHANTS: 'mandalo_merchants',
  PRODUCTS: 'mandalo_products',
  ORDERS: 'mandalo_orders',
  MESSAGES: 'mandalo_messages',
  CURRENT_USER_ID: 'mandalo_current_user_id',
  DELETED_IDS: 'mandalo_deleted_ids'
};

// Check for configured Supabase credentials
export function getSupabaseConfig() {
  const localConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
  if (localConfig) {
    try {
      return JSON.parse(localConfig);
    } catch (e) {
      console.warn('Error reading local supabase config:', e);
    }
  }
  return {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    isLive: false
  };
}

export function saveSupabaseConfig(url, anonKey) {
  const config = {
    url: url.trim(),
    anonKey: anonKey.trim(),
    isLive: Boolean(url.trim() && anonKey.trim())
  };
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  return config;
}

// Create Supabase client if live credentials exist
let supabaseClient = null;
const initialConfig = getSupabaseConfig();
if (initialConfig.url && initialConfig.anonKey) {
  try {
    supabaseClient = createClient(initialConfig.url, initialConfig.anonKey);
  } catch (err) {
    console.warn('Failed to init Supabase client:', err);
  }
}

export { supabaseClient };

// Cross-tab broadcast channel for real-time sync across simulation roles
const broadcastChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('mandalo_realtime_events') 
  : null;

// Reactive state container for demo/mock mode with persistent local storage
class LocalStore {
  constructor() {
    this.listeners = new Set();
    this.init();

    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'STATE_UPDATED') {
          this.loadFromStorage();
          this.notify();
        }
      };
    }
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MERCHANTS)) {
      localStorage.setItem(STORAGE_KEYS.MERCHANTS, JSON.stringify(INITIAL_MERCHANTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'user-client-1');
    }
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      this.profiles = (JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES)) || INITIAL_PROFILES)
        .map(({ wallet_balance, ...profile }) => profile);
      this.merchants = (JSON.parse(localStorage.getItem(STORAGE_KEYS.MERCHANTS)) || INITIAL_MERCHANTS)
        .map(merchant => ({
          ...merchant,
          verified: merchant.verified ?? merchant.is_active ?? false,
          plan: merchant.plan || 'free',
          subscription_status: merchant.subscription_status || 'active',
          payment_methods: { ...DEFAULT_PAYMENT_METHODS, ...(merchant.payment_methods || {}) },
          payment_config: { ...DEFAULT_PAYMENT_CONFIG, ...(merchant.payment_config || {}) }
        }));
      this.products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || INITIAL_PRODUCTS;
      let storedOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
      const existingIds = new Set(storedOrders.map(o => o.id));
      const missingOrders = INITIAL_ORDERS.filter(o => !existingIds.has(o.id));
      if (missingOrders.length > 0) {
        storedOrders = [...storedOrders, ...missingOrders];
      }
      this.orders = (storedOrders.length > 0 ? storedOrders : INITIAL_ORDERS).map(({
        platform_fee,
        payment_method,
        payment_receipt_url,
        pago_movil_ref,
        ...order
      }) => ({
        ...order,
        total: Math.max(0, Number(order.total || 0) - Number(platform_fee || 0))
      }));
      this.messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES)) || INITIAL_MESSAGES;
      this.currentUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user-client-1';
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(this.profiles));
      localStorage.setItem(STORAGE_KEYS.MERCHANTS, JSON.stringify(this.merchants));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
    } catch (e) {
      console.warn('Error loading storage, resetting to initial', e);
      this.resetToDefaults();
    }
  }

  saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(this.profiles));
    localStorage.setItem(STORAGE_KEYS.MERCHANTS, JSON.stringify(this.merchants));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(this.messages));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, this.currentUserId);

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'STATE_UPDATED' });
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error('Listener notification error:', e);
      }
    }
  }

  resetToDefaults() {
    this.profiles = [...INITIAL_PROFILES];
    this.merchants = [...INITIAL_MERCHANTS];
    this.products = [...INITIAL_PRODUCTS];
    this.orders = [...INITIAL_ORDERS];
    this.messages = [...INITIAL_MESSAGES];
    this.currentUserId = 'user-client-1';
    this.saveToStorage();
  }

  // Current active user
  getCurrentUser() {
    return this.profiles.find(p => p.id === this.currentUserId) || this.profiles[0];
  }

  setCurrentUser(userId) {
    this.currentUserId = userId;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    this.notify();
  }

  // --- Orders API ---
  getOrders() {
    return [...this.orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getOrderById(id) {
    return this.orders.find(o => o.id === id);
  }

  createOrder(orderData) {
    if (orderData.order_type === 'store_purchase') {
      const merchant = this.merchants.find(item => item.id === orderData.merchant_id);
      if (merchant && !canReceiveOrders(merchant)) {
        throw new Error('Este comercio no puede recibir pedidos nuevos en este momento.');
      }
    }

    const newOrder = {
      id: `ord-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString(),
      status: 'pending',
      ...orderData
    };
    this.orders.unshift(newOrder);
    this.saveToStorage();

    // Trigger procedural sound
    soundManager.playOrderAlert();

    return newOrder;
  }

  updateOrderStatus(orderId, newStatus, riderId = null) {
    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      const order = this.orders[orderIndex];
      order.status = newStatus;
      if (riderId) {
        order.rider_id = riderId;
        const rider = this.profiles.find(p => p.id === riderId);
        if (rider) {
          order.rider_name = rider.full_name;
          order.rider_phone = rider.phone;
        }
      }
      this.orders[orderIndex] = { ...order };
      this.saveToStorage();

      if (newStatus === 'delivered') {
        soundManager.playSuccessFanfare();
      } else {
        soundManager.playTap();
      }
    }
  }

  // --- Contextual Messages API ---
  getMessagesByOrder(orderId, channel = null) {
    return this.messages.filter(m => {
      const matchesOrder = m.order_id === orderId;
      if (!channel) return matchesOrder;
      return matchesOrder && m.channel === channel;
    });
  }

  sendMessage({ orderId, senderId, senderName, senderRole, channel, message, mediaUrl = null }) {
    const newMessage = {
      id: `msg-${Date.now().toString().slice(-6)}`,
      order_id: orderId,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      channel,
      message,
      media_url: mediaUrl,
      created_at: new Date().toISOString()
    };
    this.messages.push(newMessage);
    this.saveToStorage();
    soundManager.playMessagePop();
    return newMessage;
  }

  // --- Products Catalog CRUD ---
  getProductsByMerchant(merchantId) {
    return this.products.filter(p => p.merchant_id === merchantId);
  }

  async addProduct(productData) {
    const merchant = this.merchants.find(item => item.id === productData.merchant_id);
    const productCount = this.products.filter(item => item.merchant_id === productData.merchant_id).length;
    if (merchant && !canPublishProduct(merchant, productCount)) {
      throw new Error('El plan gratuito permite publicar hasta 10 productos.');
    }

    const newProd = {
      id: `prod-${Date.now().toString().slice(-6)}`,
      is_available: true,
      created_at: new Date().toISOString(),
      ...productData
    };
    this.products.unshift(newProd);
    this.saveToStorage();

    try {
      const { supabase, isSupabaseConfigured } = await import('./supabaseClient');
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.from('products').insert([{
            merchant_id: newProd.merchant_id,
          name: newProd.name,
          description: newProd.description,
          price: newProd.price,
          image_url: newProd.image_url,
          is_available: newProd.is_available ?? true
        }]).select();
        if (!error && data?.[0]) {
          newProd.id = data[0].id;
          this.saveToStorage();
        }
      }
    } catch (e) {
      console.warn('Sync addProduct to Supabase skipped:', e);
    }

    return newProd;
  }

  async updateProduct(productId, updates) {
    const idx = this.products.findIndex(p => p.id === productId);
    if (idx !== -1) {
      this.products[idx] = { ...this.products[idx], ...updates, updated_at: new Date().toISOString() };
      this.saveToStorage();

      try {
        const { supabase, isSupabaseConfigured } = await import('./supabaseClient');
        if (isSupabaseConfigured()) {
          await supabase.from('products').update(updates).eq('id', productId);
        }
      } catch (e) {
        console.warn('Sync updateProduct to Supabase error:', e);
      }
    }
  }

  async deleteProduct(productId) {
    this.products = this.products.filter(p => p.id !== productId);
    this.saveToStorage();

    try {
      const { supabase, isSupabaseConfigured } = await import('./supabaseClient');
      if (isSupabaseConfigured()) {
        await supabase.from('products').delete().eq('id', productId);
      }
    } catch (e) {
      console.warn('Sync deleteProduct to Supabase error:', e);
    }
  }

  // --- Profiles & Merchants API ---
  toggleVerification(userId) {
    const user = this.profiles.find(p => p.id === userId);
    if (user) {
      user.is_verified = !user.is_verified;
      this.saveToStorage();
    }
  }

  toggleMerchantActive(merchantId) {
    const merch = this.merchants.find(m => m.id === merchantId);
    if (merch) {
      merch.is_active = !merch.is_active;
      this.saveToStorage();
    }
  }

  upsertMerchant(merchant) {
    const idx = this.merchants.findIndex(item => item.id === merchant.id || (
      merchant.owner_id && item.owner_id === merchant.owner_id
    ));
    if (idx === -1) this.merchants.unshift(merchant);
    else this.merchants[idx] = { ...this.merchants[idx], ...merchant };
    this.saveToStorage();
  }

  deleteMerchant(merchantId) {
    if (!merchantId) return;
    this.markDeleted(merchantId);
    this.merchants = this.merchants.filter(merchant => merchant.id !== merchantId);
    this.saveToStorage();
    this.notify();
  }

  upsertProducts(products) {
    const productsById = new Map(this.products.map(product => [product.id, product]));
    products.forEach(product => productsById.set(product.id, product));
    this.products = [...productsById.values()];
    this.saveToStorage();
  }

  async updateMerchant(merchantId, updates) {
    const idx = this.merchants.findIndex(item => item.id === merchantId);
    if (idx !== -1) {
      this.merchants[idx] = { ...this.merchants[idx], ...updates, updated_at: new Date().toISOString() };
      this.saveToStorage();
    }

    try {
      const { supabase, isSupabaseConfigured } = await import('./supabaseClient');
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('merchants').update(updates).eq('id', merchantId);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error al actualizar el comercio:', error);
      throw error;
    }
  }

  updateProfile(userId, updates) {
    const idx = this.profiles.findIndex(p => p.id === userId);
    if (idx !== -1) {
      this.profiles[idx] = { ...this.profiles[idx], ...updates, updated_at: new Date().toISOString() };
      if (this.profiles[idx].role === 'merchant') {
        const mIdx = this.merchants.findIndex(m => m.owner_id === userId || m.id === userId);
        if (mIdx !== -1) {
          this.merchants[mIdx] = {
            ...this.merchants[mIdx],
            name: updates.merchant_name || updates.full_name || this.merchants[mIdx].name,
            address: updates.address || this.merchants[mIdx].address,
            phone: updates.phone || this.merchants[mIdx].phone,
            ...(typeof updates.verified === 'boolean' ? { verified: updates.verified, is_active: updates.verified } : {})
          };
        }
      }
      this.saveToStorage();
      return;
    }

    this.profiles.unshift({ id: userId, ...updates, updated_at: new Date().toISOString() });
    this.saveToStorage();
  }

  markDeleted(id) {
    if (!id) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DELETED_IDS);
      const set = new Set(stored ? JSON.parse(stored) : []);
      set.add(String(id));
      localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify([...set]));
    } catch (e) {
      console.warn('Error saving deleted ID:', e);
    }
  }

  unmarkDeleted(id) {
    if (!id) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DELETED_IDS);
      if (stored) {
        const set = new Set(JSON.parse(stored));
        set.delete(String(id));
        localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify([...set]));
      }
    } catch (e) {
      console.warn('Error unmarking deleted ID:', e);
    }
  }

  isDeleted(id) {
    if (!id) return false;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DELETED_IDS);
      if (!stored) return false;
      const set = new Set(JSON.parse(stored));
      return set.has(String(id));
    } catch (e) {
      return false;
    }
  }

  deleteProfile(userId) {
    if (!userId) return;
    this.markDeleted(userId);
    this.profiles = this.profiles.filter(p => p.id !== userId);
    this.merchants = this.merchants.filter(m => m.owner_id !== userId && m.id !== userId);
    this.saveToStorage();
    this.notify();
  }
}

export const localStore = new LocalStore();
