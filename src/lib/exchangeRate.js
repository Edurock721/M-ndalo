// Service for the official BCV rate, read from the BCV page via Jina Reader.
// The reader adds browser CORS support; the last successful rate stays cached locally.

const BCV_READER_URL = 'https://r.jina.ai/http://www.bcv.org.ve/';
const STORAGE_KEY_RATE = 'mandalo_bcv_rate';
const STORAGE_KEY_DATE = 'mandalo_bcv_updated';
export const DEFAULT_FALLBACK_RATE = 884.75; // Real official BCV rate

class ExchangeRateService {
  constructor() {
    this.listeners = new Set();
    this.rate = this.loadInitialRate();
    this.lastUpdated = this.loadInitialDate();
    this.isFetching = false;
    this.error = null;

    // Auto-fetch on initialization
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.fetchLiveRate();
      }, 100);

      // Periodic auto-update every 10 minutes
      setInterval(() => {
        this.fetchLiveRate();
      }, 10 * 60 * 1000);
    }
  }

  loadInitialDate() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY_DATE);
        if (stored) return stored;
      }
    } catch (e) {
      console.warn('Storage read warning:', e);
    }
    return new Date().toISOString();
  }

  loadInitialRate() {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(STORAGE_KEY_RATE);
        if (cached) {
          const parsed = parseFloat(cached);
          if (!isNaN(parsed) && parsed > 50) return parsed;
        }
      }
    } catch (e) {
      console.warn('Storage read warning:', e);
    }
    return DEFAULT_FALLBACK_RATE;
  }

  async fetchLiveRate() {
    if (this.isFetching) return;
    this.isFetching = true;
    this.error = null;
    this.notify();
    let timeoutId;

    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(`${BCV_READER_URL}?nocache=${Date.now()}`, {
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'Accept': 'text/plain',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const page = await res.text();
      const rateMatch = page.match(/dollar-[^\n)]*\)\s*USD\s*\*\*([\d.,]+)\*\*/i);
      if (!rateMatch) throw new Error('No se encontró la tasa USD en la página oficial del BCV');

      const rateText = rateMatch[1].trim();
      const parsedRate = Number(rateText.includes(',')
        ? rateText.replace(/\./g, '').replace(',', '.')
        : rateText);
      if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
        throw new Error('La tasa recibida del BCV no es válida');
      }

      this.rate = parseFloat(parsedRate.toFixed(2));
      const publishedAt = page.match(/^Published Time:\s*(.+)$/mi)?.[1];
      const publishedDate = publishedAt ? new Date(publishedAt) : new Date();
      this.lastUpdated = Number.isNaN(publishedDate.getTime())
        ? new Date().toISOString()
        : publishedDate.toISOString();
      try {
        localStorage.setItem(STORAGE_KEY_RATE, this.rate.toString());
        localStorage.setItem(STORAGE_KEY_DATE, this.lastUpdated);
      } catch (e) {}
      console.log(`[BCV API] Tasa oficial actualizada exitosamente: Bs. ${this.rate}`);
    } catch (err) {
      console.warn('[BCV API] No se pudo obtener la tasa en vivo, usando tasa guardada:', err.message);
      this.error = err.message;
    } finally {
      clearTimeout(timeoutId);
      this.isFetching = false;
      this.notify();
    }
  }

  setManualRate(newRate) {
    const num = parseFloat(newRate);
    if (!isNaN(num) && num > 0) {
      this.rate = parseFloat(num.toFixed(2));
      this.lastUpdated = new Date().toISOString();
      try {
        localStorage.setItem(STORAGE_KEY_RATE, this.rate.toString());
        localStorage.setItem(STORAGE_KEY_DATE, this.lastUpdated);
      } catch (e) {}
      this.notify();
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener({
          rate: this.rate || DEFAULT_FALLBACK_RATE,
          lastUpdated: this.lastUpdated,
          isFetching: this.isFetching,
          error: this.error
        });
      } catch (e) {
        console.error('Error notifying exchange rate listener:', e);
      }
    });
  }

  toBs(usdAmount) {
    const rate = this.rate || DEFAULT_FALLBACK_RATE;
    if (usdAmount === null || usdAmount === undefined || isNaN(usdAmount)) return 0;
    return parseFloat((Number(usdAmount) * rate).toFixed(2));
  }

  toUSD(bsAmount) {
    const rate = this.rate || DEFAULT_FALLBACK_RATE;
    if (bsAmount === null || bsAmount === undefined || isNaN(bsAmount) || rate === 0) return 0;
    return parseFloat((Number(bsAmount) / rate).toFixed(2));
  }

  formatUSD(usdAmount) {
    const val = Number(usdAmount) || 0;
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatBs(usdAmount) {
    const bsVal = this.toBs(usdAmount);
    return `Bs. ${bsVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDual(usdAmount) {
    return {
      usd: this.formatUSD(usdAmount),
      bs: this.formatBs(usdAmount)
    };
  }
}

export const exchangeRateService = new ExchangeRateService();
