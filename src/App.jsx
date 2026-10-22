import React, { useState, useEffect } from 'react';
import { localStore } from './lib/supabase';
import { exchangeRateService } from './lib/exchangeRate';
import { Navbar } from './components/Navbar';
import { RoleSwitcher } from './components/RoleSwitcher';
import { ClientView } from './components/ClientView';
import { MerchantView } from './components/MerchantView';
import { RiderView } from './components/RiderView';
import { AdminView } from './components/AdminView';
import { CartModal } from './components/CartModal';
import { ContextualChatModal } from './components/ContextualChatModal';
import { ImageCompressorModal } from './components/ImageCompressorModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { soundManager } from './lib/soundEffects';

export function App() {
  // Sync state from reactive local store
  const [storeState, setStoreState] = useState(() => ({
    profiles: localStore.profiles,
    merchants: localStore.merchants,
    products: localStore.products,
    orders: localStore.orders,
    messages: localStore.messages,
    currentUserId: localStore.currentUserId
  }));

  // Dynamic Auto-updating BCV Exchange Rate
  const [exchangeRateData, setExchangeRateData] = useState(() => ({
    rate: exchangeRateService.rate,
    lastUpdated: exchangeRateService.lastUpdated,
    isFetching: exchangeRateService.isFetching,
    error: exchangeRateService.error
  }));

  // Modals and UI state
  const [cart, setCart] = useState([]);
  const [activeCartMerchant, setActiveCartMerchant] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [activeChatOrder, setActiveChatOrder] = useState(null);
  const [showCompressorModal, setShowCompressorModal] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Subscribe to reactive store and exchange rate changes
  useEffect(() => {
    const unsubscribeStore = localStore.subscribe(() => {
      setStoreState({
        profiles: [...localStore.profiles],
        merchants: [...localStore.merchants],
        products: [...localStore.products],
        orders: [...localStore.orders],
        messages: [...localStore.messages],
        currentUserId: localStore.currentUserId
      });
    });

    const unsubscribeRate = exchangeRateService.subscribe((data) => {
      setExchangeRateData({ ...data });
    });

    // PWA install prompt event listener
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      unsubscribeStore();
      unsubscribeRate();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const currentUser = storeState.profiles.find(p => p.id === storeState.currentUserId) || storeState.profiles[0];
  const currentMerchant = storeState.merchants[0]; // Active merchant for merchant role
  const currentRate = exchangeRateData.rate;

  // Cart operations
  const handleAddToCart = (product, merchant, note = '') => {
    if (activeCartMerchant && activeCartMerchant.id !== merchant.id && cart.length > 0) {
      if (!confirm(`Tienes productos de ${activeCartMerchant.name}. ¿Deseas vaciar el carrito para comprar en ${merchant.name}?`)) {
        return;
      }
      setCart([]);
    }
    setActiveCartMerchant(merchant);

    setCart((prev) => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1, note: note || i.note } : i);
      }
      return [...prev, { ...product, quantity: 1, note }];
    });
  };

  const handleUpdateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart(prev => prev.map(i => i.id === productId ? { ...i, quantity: newQuantity } : i));
  };

  const handleRemoveCartItem = (productId) => {
    setCart(prev => prev.filter(i => i.id !== productId));
  };

  const handleCheckout = (orderData) => {
    localStore.createOrder(orderData);
    setCart([]);
    setShowCartModal(false);
    soundManager.playSuccessFanfare();
  };

  // Switch role
  const handleSelectRole = (userId) => {
    localStore.setCurrentUser(userId);
  };

  // Accept dispatch as rider
  const handleAcceptOrder = (orderId) => {
    localStore.updateOrderStatus(orderId, 'accepted', currentUser.id);
  };

  // Update order status
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    localStore.updateOrderStatus(orderId, newStatus);
  };

  // Send message
  const handleSendMessage = (msgData) => {
    localStore.sendMessage(msgData);
  };

  // Trigger PWA prompt
  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPwaModal(false);
      }
    }
  };

  // Pending orders alert count for merchant / rider
  const pendingOrdersCount = storeState.orders.filter(o => o.status === 'pending').length;

  return (
    <div className="app-shell">
      {/* 1. Interactive RBAC Simulator Bar */}
      <RoleSwitcher
        profiles={storeState.profiles}
        currentUserId={storeState.currentUserId}
        onSelectUser={handleSelectRole}
        exchangeRate={currentRate}
      />

      {/* 2. Top Header Navigation with Auto-updating BCV Pill */}
      <Navbar
        currentUser={currentUser}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setShowCartModal(true)}
        onOpenSupabaseModal={() => setShowSupabaseModal(true)}
        onOpenCompressorModal={() => setShowCompressorModal(true)}
        onOpenPwaModal={() => setShowPwaModal(true)}
        pendingOrdersCount={pendingOrdersCount}
        exchangeRateData={exchangeRateData}
        onRefreshRate={() => exchangeRateService.fetchLiveRate()}
      />

      {/* 3. Main Dynamic View According to RBAC Role */}
      <main className="main-content">
        {currentUser.role === 'client' && (
          <ClientView
            merchants={storeState.merchants}
            products={storeState.products}
            orders={storeState.orders}
            currentUser={currentUser}
            onAddToCart={handleAddToCart}
            onCreateOrder={(data) => localStore.createOrder(data)}
            onOpenChat={(order) => setActiveChatOrder(order)}
            exchangeRate={currentRate}
          />
        )}

        {currentUser.role === 'merchant' && (
          <MerchantView
            merchant={currentMerchant}
            products={storeState.products}
            orders={storeState.orders}
            currentUser={currentUser}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAddProduct={(data) => localStore.addProduct(data)}
            onUpdateProduct={(id, updates) => localStore.updateProduct(id, updates)}
            onDeleteProduct={(id) => localStore.deleteProduct(id)}
            onOpenChat={(order) => setActiveChatOrder(order)}
            exchangeRate={currentRate}
          />
        )}

        {currentUser.role === 'rider' && (
          <RiderView
            orders={storeState.orders}
            currentUser={currentUser}
            onAcceptOrder={handleAcceptOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onOpenChat={(order) => setActiveChatOrder(order)}
            exchangeRate={currentRate}
          />
        )}

        {currentUser.role === 'admin' && (
          <AdminView
            profiles={storeState.profiles}
            merchants={storeState.merchants}
            orders={storeState.orders}
            onAdjustWallet={(userId, amount, reason) => localStore.adjustWallet(userId, amount, reason)}
            onToggleVerification={(userId) => localStore.toggleVerification(userId)}
            onResetDefaults={() => localStore.resetToDefaults()}
            exchangeRate={currentRate}
            exchangeRateData={exchangeRateData}
            onSetManualRate={(val) => exchangeRateService.setManualRate(val)}
            onRefreshRate={() => exchangeRateService.fetchLiveRate()}
          />
        )}
      </main>

      {/* 4. Modals */}
      {showCartModal && (
        <CartModal
          cart={cart}
          merchant={activeCartMerchant}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onCheckout={handleCheckout}
          onClose={() => setShowCartModal(false)}
          currentUser={currentUser}
          exchangeRate={currentRate}
        />
      )}

      {activeChatOrder && (
        <ContextualChatModal
          order={activeChatOrder}
          currentUser={currentUser}
          messages={storeState.messages}
          onSendMessage={handleSendMessage}
          onClose={() => setActiveChatOrder(null)}
        />
      )}

      {showCompressorModal && (
        <ImageCompressorModal
          onClose={() => setShowCompressorModal(false)}
        />
      )}

      {showSupabaseModal && (
        <SupabaseConfigModal
          onClose={() => setShowSupabaseModal(false)}
        />
      )}

      {showPwaModal && (
        <PwaInstallModal
          onClose={() => setShowPwaModal(false)}
          deferredPrompt={deferredPrompt}
          onInstallPrompt={handleTriggerInstall}
        />
      )}
    </div>
  );
}

export default App;
