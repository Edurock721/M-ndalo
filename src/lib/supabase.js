import { createClient } from '@supabase/supabase-js';
import { 
  INITIAL_PROFILES, 
  INITIAL_MERCHANTS, 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_MESSAGES 
} from './mockData';
import { soundManager } from './soundEffects';

const STORAGE_KEYS = {
  CONFIG: 'mandalo_supabase_config',
  PROFILES: 'mandalo_profiles',
  MERCHANTS: 'mandalo_merchants',
  PRODUCTS: 'mandalo_products',
  ORDERS: 'mandalo_orders',
  MESSAGES: 'mandalo_messages',
  CURRENT_USER_ID: 'mandalo_current_user_id'
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
      this.profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES)) || INITIAL_PROFILES;
      this.merchants = JSON.parse(localStorage.getItem(STORAGE_KEYS.MERCHANTS)) || INITIAL_MERCHANTS;
      this.products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || INITIAL_PRODUCTS;
      let storedOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
      const existingIds = new Set(storedOrders.map(o => o.id));
      const missingOrders = INITIAL_ORDERS.filter(o => !existingIds.has(o.id));
      if (missingOrders.length > 0) {
        storedOrders = [...storedOrders, ...missingOrders];
      }
      this.orders = storedOrders.length > 0 ? storedOrders : INITIAL_ORDERS;
      this.messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES)) || INITIAL_MESSAGES;
      this.currentUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user-client-1';
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
        // Credit rider wallet with delivery fee
        if (order.rider_id) {
          this.adjustWallet(order.rider_id, order.delivery_fee, `Ganancia despacho #${order.id.slice(-4)}`);
        }
        // Credit admin wallet with platform fee
        const admin = this.profiles.find(p => p.role === 'admin');
        if (admin) {
          this.adjustWallet(admin.id, order.platform_fee || 0.50, `Comisión Mándalo! orden #${order.id.slice(-4)}`);
        }
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

  addProduct(productData) {
    const newProd = {
      id: `prod-${Date.now().toString().slice(-6)}`,
      is_available: true,
      ...productData
    };
    this.products.push(newProd);
    this.saveToStorage();
    return newProd;
  }

  updateProduct(productId, updates) {
    const idx = this.products.findIndex(p => p.id === productId);
    if (idx !== -1) {
      this.products[idx] = { ...this.products[idx], ...updates };
      this.saveToStorage();
    }
  }

  deleteProduct(productId) {
    this.products = this.products.filter(p => p.id !== productId);
    this.saveToStorage();
  }

  // --- Profiles & Admin Wallet API ---
  adjustWallet(userId, amount, reason = '') {
    const user = this.profiles.find(p => p.id === userId);
    if (user) {
      user.wallet_balance = Math.max(0, parseFloat((user.wallet_balance + amount).toFixed(2)));
      this.saveToStorage();
    }
  }

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
}

export const localStore = new LocalStore();
