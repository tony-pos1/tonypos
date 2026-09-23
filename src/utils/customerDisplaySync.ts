import { AppSettings, Order, PaymentMethod } from '../types';

export interface CustomerDisplayState {
  order: Order | null;
  settings: AppSettings | null;
  isPaymentOpen: boolean;
  paymentMethod: PaymentMethod;
  qrDataUrl?: string | null;
  customQrImageUrl?: string | null;
  cashTendered?: number;
  changeDue?: number;
  isPaidSuccess?: boolean;
  paidOrder?: Order | null;
  timestamp: number;
}

const CHANNEL_NAME = 'pos_customer_display_channel';
const STORAGE_KEY = 'pos_customer_display_state';

class CustomerDisplaySyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: ((state: CustomerDisplayState) => void)[] = [];
  private isConnectedListeners: ((connected: boolean) => void)[] = [];
  private lastHeartbeatResponse = 0;
  private heartbeatInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not available, falling back to localStorage', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.notifyListeners(parsed);
          } catch (err) {
            console.error('Failed to parse storage state', err);
          }
        }
      });
    }
  }

  private handleMessage(data: any) {
    if (!data) return;

    if (data.type === 'STATE_UPDATE') {
      this.notifyListeners(data.state);
    } else if (data.type === 'HEARTBEAT_PING') {
      // Customer screen replies that it is alive
      this.send({ type: 'HEARTBEAT_PONG', timestamp: Date.now() });
    } else if (data.type === 'HEARTBEAT_PONG') {
      this.lastHeartbeatResponse = Date.now();
      this.notifyConnectedListeners(true);
    }
  }

  public sendState(state: CustomerDisplayState) {
    const payload = {
      type: 'STATE_UPDATE',
      state: {
        ...state,
        timestamp: Date.now(),
      },
    };

    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (err) {
        console.warn('BroadcastChannel send error', err);
      }
    }

    // Always mirror to localStorage for guaranteed cross-window sync
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.state));
      } catch (err) {
        // quota or privacy mode
      }
    }
  }

  public getState(): CustomerDisplayState | null {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  public subscribe(callback: (state: CustomerDisplayState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public subscribeConnection(callback: (connected: boolean) => void): () => void {
    this.isConnectedListeners.push(callback);
    return () => {
      this.isConnectedListeners = this.isConnectedListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(state: CustomerDisplayState) {
    this.listeners.forEach((cb) => cb(state));
  }

  private notifyConnectedListeners(connected: boolean) {
    this.isConnectedListeners.forEach((cb) => cb(connected));
  }

  public startHeartbeatCheck() {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'HEARTBEAT_PING', timestamp: Date.now() });
      const isAlive = Date.now() - this.lastHeartbeatResponse < 4000;
      this.notifyConnectedListeners(isAlive);
    }, 2000);
  }

  public stopHeartbeatCheck() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public notifyCustomerScreenReady() {
    this.send({ type: 'HEARTBEAT_PONG', timestamp: Date.now() });
  }

  public openCustomerDisplayWindow(): Window | null {
    if (typeof window === 'undefined') return null;

    const url = `${window.location.origin}${window.location.pathname}?display=customer`;

    // Attempt to position on secondary display (typically right of main display)
    const secondaryLeft = window.screen.availWidth || window.innerWidth || 1920;
    const windowFeatures = [
      `left=${secondaryLeft}`,
      'top=0',
      'width=1024',
      'height=768',
      'menubar=no',
      'toolbar=no',
      'location=no',
      'status=no',
      'resizable=yes',
      'scrollbars=yes',
    ].join(',');

    try {
      const win = window.open(url, 'pos_customer_display', windowFeatures);
      if (win) {
        win.focus();
        // Immediately resend current state to newly opened window
        const currentState = this.getState();
        if (currentState) {
          setTimeout(() => {
            this.sendState(currentState);
          }, 300);
        }
      }
      return win;
    } catch (e) {
      console.error('Failed to open customer display window', e);
      return null;
    }
  }

  private send(msg: any) {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (err) {
        // ignore
      }
    }
  }
}

export const customerDisplaySync = new CustomerDisplaySyncManager();
