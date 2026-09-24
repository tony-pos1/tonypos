export type Language = 'th' | 'en';

export type ServiceMode = 'fine_dining' | 'quick_service';

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export type DeliveryChannel = 'own' | 'grab' | 'lineman' | 'shopeefood' | 'robinhood' | 'other';

export type OrderSource = 'pos' | 'qr' | 'online';

export type OrderStatus = 'open' | 'held' | 'billed' | 'paid' | 'cancelled' | 'voided';

export type LineStatus = 'unsent' | 'sent' | 'voided';

export type PaymentMethod = 'cash' | 'promptpay' | 'credit_card' | 'digital_wallet';

export interface OptionItem {
  id: string;
  name_th: string;
  name_en: string;
  priceDelta: number; // e.g. +10, +0
}

export interface OptionGroup {
  id: string;
  name_th: string;
  name_en: string;
  required: boolean;
  type: 'single' | 'multiple';
  minSelections?: number;
  maxSelections?: number;
  options: OptionItem[];
}

export interface MenuItem {
  id: string;
  name_th: string;
  name_en: string;
  description_th?: string;
  description_en?: string;
  price: number;
  cost?: number; // food cost
  category_id: string;
  type: 'food' | 'drink' | 'dessert' | 'other';
  image?: string; // data URL or blob URL or emoji icon
  emoji?: string;
  printDestination?: 'kitchen' | 'bar' | 'none';
  optionGroups?: OptionGroup[];
  isAvailable: boolean;
  sortOrder: number;
  isFavorite?: boolean;
}

export interface MenuCategory {
  id: string;
  name_th: string;
  name_en: string;
  icon?: string;
  sortOrder: number;
  defaultPrintDestination?: 'kitchen' | 'bar' | 'none';
}

export interface SelectedOption {
  groupId: string;
  groupName_th: string;
  groupName_en: string;
  optionId: string;
  optionName_th: string;
  optionName_en: string;
  priceDelta: number;
}

export interface OrderLine {
  id: string;
  menuItemId: string;
  name_th: string;
  name_en: string;
  basePrice?: number;
  unitPrice: number;
  cost?: number;
  quantity: number;
  subtotal?: number;
  selectedOptions: SelectedOption[];
  modifiers: string[]; // quick notes like "เผ็ดน้อย"
  notes?: string;
  round?: number;
  status: LineStatus;
  sentAt?: number;
  voidReason?: string;
  printDestination?: 'kitchen' | 'bar' | 'none';
}

export interface PaymentRecord {
  id: string;
  method: PaymentMethod;
  amount: number;
  receivedAmount?: number;
  changeAmount?: number;
  timestamp: number;
  reference?: string; // Card last 4 or transaction ref
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "ORD-20260920-0001"
  queueNumber?: number; // daily queue 1..999
  orderType: OrderType;
  source: OrderSource;
  status: OrderStatus;
  tableId?: string;
  tableName?: string;
  customerCount?: number;
  guestCount?: number;
  lines: OrderLine[];
  
  // Financials
  subtotal: number;
  discountAmount: number;
  discountReason?: string;
  serviceChargeRate: number; // e.g. 10%
  serviceChargeAmount: number;
  vatRate: number; // e.g. 7%
  vatAmount: number;
  netTotal: number;
  
  // Delivery details if takeaway/delivery
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryFee?: number;
  deliveryChannel?: DeliveryChannel;

  // Payments
  payments: PaymentRecord[];
  isPaid: boolean;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
  waiterName?: string;
}

export interface AppSettings {
  id: string;
  shopName_th: string;
  shopName_en: string;
  shopAddress_th: string;
  shopAddress_en: string;
  shopPhone: string;
  shopTaxId?: string;
  receiptFooter_th: string;
  receiptFooter_en: string;
  logoUrl?: string;
  
  currency: string; // 'THB'
  language: Language;
  serviceMode: ServiceMode; // fine_dining or quick_service
  
  // Tax and Service Charge
  vatEnabled: boolean;
  vatRate: number; // 7
  serviceChargeEnabled: boolean;
  serviceChargeRate: number; // 10
  priceIncludeTax: boolean; // true = tax included in menu price, false = added on top
  
  // PromptPay
  promptPayEnabled: boolean;
  promptPayIdType: 'phone' | 'national_id';
  promptPayId: string; // e.g. "0812345678" or "1234567890123"
  promptPayName?: string;
  customPromptPayQrImage?: string; // base64 data URL of custom PromptPay QR image uploaded by shop
  useCustomPromptPayQr?: boolean; // true = show uploaded QR, false = dynamic generated QR
  customerScreenWelcome_th?: string; // Welcome banner on 2nd screen
  customerScreenWelcome_en?: string;
  
  // POS configs
  quickModifiers: string[];
  autoPrintKitchenTicket: boolean;
  queueNumberResetDate: string; // YYYY-MM-DD
  lastDailyQueue: number;
  lastBackupDate?: string;
  
  // Feature flags
  customerQrOrderingEnabled: boolean; // OFF by default
  printerPaperSize?: '80mm' | '58mm';
  printerCopies?: number;
  printerType?: 'bluetooth' | 'serial' | 'system';
  printerDeviceName?: string;
  printerAutoPrintReceipt?: boolean;
  printerOpenCashDrawer?: boolean;
  printerThaiRasterMode?: boolean;
}

export interface Promotion {
  id: string;
  name_th: string;
  name_en: string;
  type: 'percent' | 'amount';
  value: number;
  minSpend?: number;
  isActive: boolean;
}

export type TableShape = 'square' | 'round' | 'rectangle' | 'long' | 'bar' | 'sofa';
export type FloorItemType = 'table' | 'chair' | 'decor';
export type ChairType = 'standard' | 'stool' | 'bench';

export interface FloorZone {
  id: string;
  name: string;
  sortOrder: number;
}

export interface DiningTable {
  id: string;
  name: string;
  zone: string;
  seats: number;
  shape: TableShape;
  itemType?: FloorItemType; // default 'table'
  chairType?: ChairType;
  showAutoChairs?: boolean; // whether to draw auto-arranged chairs around table
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  status: 'available' | 'occupied' | 'billed' | 'reserved' | 'dirty';
  currentOrderId?: string;
  seatedAt?: number;
  runningTotal?: number;
  reservationNote?: {
    name: string;
    phone: string;
    time: string;
  };
}

export interface ShiftRecord {
  id: string;
  openedAt: number;
  closedAt?: number;
  openedBy: string;
  closedBy?: string;
  startCashFloat: number;
  cashSales: number;
  cashPayouts: number;
  cashIns: number;
  expectedCash: number;
  actualCountedCash?: number;
  variance?: number; // over or short
  notes?: string;
  status: 'open' | 'closed';
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  birthday?: string;
  notes?: string;
  points: number;
  totalSpend: number;
  visitCount: number;
  createdAt: number;
  lastVisitAt?: number;
}

export type UserRole = 'owner' | 'cashier' | 'waiter';

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  pin?: string;
}

export interface InAppNotification {
  id: string;
  type: 'call_waiter' | 'request_bill' | 'order' | 'info' | 'system';
  message_th: string;
  message_en: string;
  tableName?: string;
  timestamp: number;
  read: boolean;
}
