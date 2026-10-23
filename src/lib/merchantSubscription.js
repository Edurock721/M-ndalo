export const DEFAULT_PAYMENT_METHODS = {
  cash: true,
  pagoMovil: true,
  transferencia: true,
  divisas: true,
  contraEntrega: true
};

export const PAYMENT_METHOD_OPTIONS = [
  { id: 'cash', label: 'Efectivo en Bolívares' },
  { id: 'pagoMovil', label: 'Pago Móvil' },
  { id: 'transferencia', label: 'Transferencia Bancaria' },
  { id: 'divisas', label: 'Divisas (USD)' },
  { id: 'contraEntrega', label: 'Pago contra entrega' }
];

export const DEFAULT_PAYMENT_CONFIG = {
  titular: '',
  cedula: '',
  telefonoPagoMovil: '',
  banco: '',
  numeroCuenta: '',
  aceptaDivisas: true
};

const readValue = (merchant, camelCase, snakeCase) =>
  merchant?.[camelCase] ?? merchant?.[snakeCase];

export function getSubscriptionState(merchant, now = new Date()) {
  const plan = merchant?.plan || 'trial';
  const subscriptionStatus = readValue(merchant, 'subscriptionStatus', 'subscription_status') || 'active';
  const trialEnd = readValue(merchant, 'trialEnd', 'trial_end');
  const subscriptionEnd = readValue(merchant, 'subscriptionEnd', 'subscription_end');
  const endDate = plan === 'trial' ? trialEnd : subscriptionEnd;
  const endTime = endDate ? new Date(endDate).getTime() : null;
  const planHasExpiry = ['trial', 'pro'].includes(plan);
  const expired = planHasExpiry && (
    subscriptionStatus === 'expired' || endTime === null || Number.isNaN(endTime) || endTime <= now.getTime()
  );
  const verified = merchant?.verified ?? merchant?.is_verified ?? merchant?.is_active ?? true;
  const daysRemaining = endTime === null || Number.isNaN(endTime)
    ? null
    : Math.max(0, Math.ceil((endTime - now.getTime()) / 86400000));

  return {
    plan,
    status: expired ? 'expired' : subscriptionStatus,
    expired,
    verified: Boolean(verified),
    daysRemaining,
    endDate
  };
}

export function canReceiveOrders(merchant, now = new Date()) {
  const state = getSubscriptionState(merchant, now);
  return state.verified && !state.expired && merchant?.is_active !== false;
}

export function isMerchantVisible(merchant) {
  return Boolean(merchant?.verified ?? merchant?.is_verified ?? merchant?.is_active ?? true);
}

export function canPublishProduct(merchant, productCount, now = new Date()) {
  const { plan } = getSubscriptionState(merchant, now);
  return plan !== 'free' || productCount < 10;
}

export function getPaymentMethods(merchant) {
  const methods = readValue(merchant, 'paymentMethods', 'payment_methods');
  return { ...DEFAULT_PAYMENT_METHODS, ...(methods || {}) };
}

export function getPaymentConfig(merchant) {
  const config = readValue(merchant, 'paymentConfig', 'payment_config');
  return { ...DEFAULT_PAYMENT_CONFIG, ...(config || {}) };
}