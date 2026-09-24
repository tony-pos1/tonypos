import { AppSettings, AppUser, DiningTable, FloorZone, MenuCategory, MenuItem } from '../types';

export const DEFAULT_SHOP_PROMPTPAY_QR_STAND =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 560" width="440" height="560">
  <defs>
    <linearGradient id="hdrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#002D5A" />
      <stop offset="100%" stop-color="#001B36" />
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="436" height="556" rx="28" fill="#ffffff" stroke="#cbd5e1" stroke-width="4" />
  <path d="M 4 28 Q 4 4 28 4 L 412 4 Q 436 4 436 28 L 436 96 L 4 96 Z" fill="url(#hdrGrad)" />
  <text x="220" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">THAI QR PAYMENT</text>
  <text x="220" y="70" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#38bdf8" text-anchor="middle" letter-spacing="1">PROMPTPAY • พร้อมเพย์</text>
  <rect x="55" y="125" width="330" height="330" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
  <rect x="80" y="150" width="70" height="70" rx="6" fill="#002D5A" />
  <rect x="94" y="164" width="42" height="42" rx="4" fill="#ffffff" />
  <rect x="104" y="174" width="22" height="22" rx="2" fill="#002D5A" />
  <rect x="290" y="150" width="70" height="70" rx="6" fill="#002D5A" />
  <rect x="304" y="164" width="42" height="42" rx="4" fill="#ffffff" />
  <rect x="314" y="174" width="22" height="22" rx="2" fill="#002D5A" />
  <rect x="80" y="360" width="70" height="70" rx="6" fill="#002D5A" />
  <rect x="94" y="374" width="42" height="42" rx="4" fill="#ffffff" />
  <rect x="104" y="384" width="22" height="22" rx="2" fill="#002D5A" />
  <g fill="#002D5A">
    <rect x="175" y="155" width="14" height="14" rx="2"/><rect x="200" y="155" width="14" height="14" rx="2"/><rect x="235" y="155" width="14" height="14" rx="2"/><rect x="255" y="155" width="14" height="14" rx="2"/>
    <rect x="160" y="175" width="14" height="14" rx="2"/><rect x="185" y="175" width="14" height="14" rx="2"/><rect x="220" y="175" width="14" height="14" rx="2"/><rect x="250" y="175" width="14" height="14" rx="2"/>
    <rect x="170" y="200" width="14" height="14" rx="2"/><rect x="210" y="200" width="14" height="14" rx="2"/><rect x="240" y="200" width="14" height="14" rx="2"/><rect x="260" y="200" width="14" height="14" rx="2"/>
    <rect x="85" y="240" width="14" height="14" rx="2"/><rect x="115" y="240" width="14" height="14" rx="2"/><rect x="140" y="240" width="14" height="14" rx="2"/><rect x="290" y="240" width="14" height="14" rx="2"/><rect x="320" y="240" width="14" height="14" rx="2"/><rect x="345" y="240" width="14" height="14" rx="2"/>
    <rect x="85" y="270" width="14" height="14" rx="2"/><rect x="125" y="270" width="14" height="14" rx="2"/><rect x="155" y="270" width="14" height="14" rx="2"/><rect x="280" y="270" width="14" height="14" rx="2"/><rect x="310" y="270" width="14" height="14" rx="2"/><rect x="340" y="270" width="14" height="14" rx="2"/>
    <circle cx="220" cy="290" r="26" fill="#002D5A" stroke="#ffffff" stroke-width="4" />
    <path d="M 210 290 L 220 278 L 230 290 L 220 302 Z" fill="#38bdf8" />
    <rect x="85" y="300" width="14" height="14" rx="2"/><rect x="115" y="300" width="14" height="14" rx="2"/><rect x="145" y="300" width="14" height="14" rx="2"/><rect x="290" y="300" width="14" height="14" rx="2"/><rect x="320" y="300" width="14" height="14" rx="2"/><rect x="345" y="300" width="14" height="14" rx="2"/>
    <rect x="175" y="360" width="14" height="14" rx="2"/><rect x="205" y="360" width="14" height="14" rx="2"/><rect x="235" y="360" width="14" height="14" rx="2"/><rect x="260" y="360" width="14" height="14" rx="2"/>
    <rect x="160" y="385" width="14" height="14" rx="2"/><rect x="190" y="385" width="14" height="14" rx="2"/><rect x="220" y="385" width="14" height="14" rx="2"/><rect x="250" y="385" width="14" height="14" rx="2"/>
    <rect x="180" y="410" width="14" height="14" rx="2"/><rect x="210" y="410" width="14" height="14" rx="2"/><rect x="240" y="410" width="14" height="14" rx="2"/><rect x="280" y="410" width="14" height="14" rx="2"/><rect x="315" y="410" width="14" height="14" rx="2"/><rect x="340" y="410" width="14" height="14" rx="2"/>
  </g>
  <text x="220" y="488" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" fill="#0f172a" text-anchor="middle">ร้านครัวไทยอารีย์ (KinD POS)</text>
  <text x="220" y="512" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#475569" text-anchor="middle">พร้อมเพย์: 089-123-4567 (นายสมศักดิ์)</text>
  <text x="220" y="534" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="#94a3b8" text-anchor="middle">สแกนจ่ายได้ทุกธนาคาร ไม่มีค่าธรรมเนียม</text>
</svg>
`);

export const demoUsers: AppUser[] = [
  { id: 'user_owner', name: 'คุณสมศักดิ์ (Owner)', role: 'owner' },
  { id: 'user_cashier', name: 'น้องฟ้า (Cashier)', role: 'cashier' },
  { id: 'user_waiter', name: 'น้องนนท์ (Waiter)', role: 'waiter' },
];

export const defaultSettings: AppSettings = {
  id: 'global_settings',
  shopName_th: 'ร้านครัวไทยอารีย์',
  shopName_en: 'Krua Thai Aree Restaurant',
  shopAddress_th: '128/4 ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพฯ 10400',
  shopAddress_en: '128/4 Phahonyothin Rd, Samsen Nai, Phaya Thai, Bangkok 10400',
  shopPhone: '089-123-4567',
  shopTaxId: '0105560123456',
  receiptFooter_th: 'ขอบคุณที่มาอุดหนุนครัวไทยอารีย์ ขอให้มีความสุขกับมื้ออาหารค่ะ',
  receiptFooter_en: 'Thank you for dining with us at Krua Thai Aree!',
  currency: '฿',
  language: 'th',
  serviceMode: 'quick_service',
  vatEnabled: false,
  vatRate: 7,
  serviceChargeEnabled: false,
  serviceChargeRate: 10,
  priceIncludeTax: true,
  promptPayEnabled: true,
  promptPayIdType: 'phone',
  promptPayId: '0891234567',
  promptPayName: 'ร้านครัวไทยอารีย์ (นายสมศักดิ์)',
  customPromptPayQrImage: DEFAULT_SHOP_PROMPTPAY_QR_STAND,
  useCustomPromptPayQr: true,
  customerScreenWelcome_th: 'ยินดีต้อนรับสู่ร้านครัวไทยอารีย์ ขอบคุณที่มาอุดหนุนค่ะ',
  customerScreenWelcome_en: 'Welcome to Krua Thai Aree Restaurant',
  quickModifiers: [
    'เผ็ดน้อย / Less spicy',
    'ไม่ใส่ผัก / No vegetables',
    'ขอซอสเพิ่ม / Extra sauce',
    'หวานน้อย / Less sweet',
    'ไม่ใส่ผงชูรส / No MSG',
    'แยกน้ำ / Ice separated',
  ],
  autoPrintKitchenTicket: false,
  queueNumberResetDate: new Date().toISOString().split('T')[0],
  lastDailyQueue: 0,
  customerQrOrderingEnabled: false,
};

export const defaultZones: FloorZone[] = [
  { id: 'zone_indoor', name: 'Indoor / ในร้าน', sortOrder: 1 },
  { id: 'zone_outdoor', name: 'Outdoor / หน้าร้าน', sortOrder: 2 },
  { id: 'zone_vip', name: 'VIP / ห้องวีไอพี', sortOrder: 3 },
];

export const defaultCategories: MenuCategory[] = [
  { id: 'cat_single', name_th: 'อาหารจานเดียว', name_en: 'Single Dishes', icon: '🍲', sortOrder: 1 },
  { id: 'cat_soup', name_th: 'ต้มและแกง', name_en: 'Soups and Curries', icon: '🥣', sortOrder: 2 },
  { id: 'cat_salad', name_th: 'ส้มตำและยำ', name_en: 'Papaya Salad & Spicy', icon: '🥗', sortOrder: 3 },
  { id: 'cat_snacks', name_th: 'ของทานเล่น', name_en: 'Snacks & Appetizers', icon: '🍢', sortOrder: 4 },
  { id: 'cat_drinks_dessert', name_th: 'เครื่องดื่มและของหวาน', name_en: 'Drinks & Desserts', icon: '🧋', sortOrder: 5 },
];

export const defaultTables: DiningTable[] = [
  // Indoor (4 tables)
  { id: 'table_t1', name: 'T1', zone: 'Indoor / ในร้าน', seats: 4, shape: 'square', itemType: 'table', showAutoChairs: true, x: 50, y: 60, width: 90, height: 90, rotation: 0, status: 'available' },
  { id: 'table_t2', name: 'T2', zone: 'Indoor / ในร้าน', seats: 4, shape: 'square', itemType: 'table', showAutoChairs: true, x: 230, y: 60, width: 90, height: 90, rotation: 0, status: 'available' },
  { id: 'table_t3', name: 'T3', zone: 'Indoor / ในร้าน', seats: 6, shape: 'rectangle', itemType: 'table', showAutoChairs: true, x: 50, y: 220, width: 130, height: 90, rotation: 0, status: 'available' },
  { id: 'table_t4', name: 'T4', zone: 'Indoor / ในร้าน', seats: 6, shape: 'rectangle', itemType: 'table', showAutoChairs: true, x: 230, y: 220, width: 130, height: 90, rotation: 0, status: 'available' },

  // Outdoor (4 tables)
  { id: 'table_t5', name: 'T5', zone: 'Outdoor / หน้าร้าน', seats: 2, shape: 'round', itemType: 'table', showAutoChairs: true, x: 50, y: 60, width: 85, height: 85, rotation: 0, status: 'available' },
  { id: 'table_t6', name: 'T6', zone: 'Outdoor / หน้าร้าน', seats: 2, shape: 'round', itemType: 'table', showAutoChairs: true, x: 230, y: 60, width: 85, height: 85, rotation: 0, status: 'available' },
  { id: 'table_t7', name: 'T7', zone: 'Outdoor / หน้าร้าน', seats: 4, shape: 'square', itemType: 'table', showAutoChairs: true, x: 50, y: 220, width: 90, height: 90, rotation: 0, status: 'available' },
  { id: 'table_t8', name: 'T8', zone: 'Outdoor / หน้าร้าน', seats: 4, shape: 'square', itemType: 'table', showAutoChairs: true, x: 230, y: 220, width: 90, height: 90, rotation: 0, status: 'available' },

  // VIP (4 tables)
  { id: 'table_v1', name: 'V1', zone: 'VIP / ห้องวีไอพี', seats: 8, shape: 'round', itemType: 'table', showAutoChairs: true, x: 60, y: 60, width: 110, height: 110, rotation: 0, status: 'available' },
  { id: 'table_v2', name: 'V2', zone: 'VIP / ห้องวีไอพี', seats: 8, shape: 'rectangle', itemType: 'table', showAutoChairs: true, x: 250, y: 60, width: 140, height: 100, rotation: 0, status: 'available' },
  { id: 'table_v3', name: 'V3', zone: 'VIP / ห้องวีไอพี', seats: 6, shape: 'sofa', itemType: 'table', showAutoChairs: true, x: 60, y: 240, width: 120, height: 90, rotation: 0, status: 'available' },
  { id: 'table_v4', name: 'V4', zone: 'VIP / ห้องวีไอพี', seats: 4, shape: 'bar', itemType: 'table', showAutoChairs: true, x: 250, y: 240, width: 130, height: 75, rotation: 0, status: 'available' },
];

export const defaultMenuItems: MenuItem[] = [
  // Category 1: Single dishes (5 items)
  {
    id: 'item_gapao',
    name_th: 'ข้าวกะเพราแท้',
    name_en: 'Pad Kra Pao',
    description_th: 'ผัดกะเพราแท้รสจัดจ้าน ใบกะเพราบ้านหอมกรุ่น เลือกเนื้อสัตว์ได้ตามใจชอบ',
    description_en: 'Authentic Thai basil stir-fry with fragrant garlic, bird eye chilies and your choice of meat',
    price: 65,
    cost: 25,
    category_id: 'cat_single',
    type: 'food',
    emoji: '🍳',
    isAvailable: true,
    sortOrder: 1,
    isFavorite: true,
    optionGroups: [
      {
        id: 'opt_meat',
        name_th: 'เลือกเนื้อสัตว์',
        name_en: 'Select Meat',
        required: true,
        type: 'single',
        options: [
          { id: 'm_pork', name_th: 'หมูสับ', name_en: 'Minced Pork', priceDelta: 0 },
          { id: 'm_chicken', name_th: 'ไก่ชิ้น', name_en: 'Sliced Chicken', priceDelta: 0 },
          { id: 'm_crispy_pork', name_th: 'หมูกรอบ', name_en: 'Crispy Pork Belly', priceDelta: 25 },
          { id: 'm_beef', name_th: 'เนื้อสับโคขุน', name_en: 'Minced Beef', priceDelta: 30 },
          { id: 'm_seafood', name_th: 'ทะเลรวม', name_en: 'Seafood Mix', priceDelta: 35 },
        ],
      },
      {
        id: 'opt_egg',
        name_th: 'เพิ่มไข่',
        name_en: 'Add Egg',
        required: false,
        type: 'single',
        options: [
          { id: 'egg_fried', name_th: 'ไข่ดาวกรอบ', name_en: 'Crispy Fried Egg', priceDelta: 12 },
          { id: 'egg_omelet', name_th: 'ไข่เจียว', name_en: 'Thai Omelet', priceDelta: 15 },
        ],
      },
      {
        id: 'opt_spicy',
        name_th: 'ระดับความเผ็ด',
        name_en: 'Spiciness',
        required: false,
        type: 'single',
        options: [
          { id: 'sp_mild', name_th: 'เผ็ดน้อย', name_en: 'Mild', priceDelta: 0 },
          { id: 'sp_normal', name_th: 'เผ็ดปกติ', name_en: 'Normal Medium', priceDelta: 0 },
          { id: 'sp_hot', name_th: 'เผ็ดมาก', name_en: 'Extra Spicy', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'item_padthai',
    name_th: 'ผัดไทยกุ้งสด',
    name_en: 'Pad Thai Shrimp',
    description_th: 'เส้นจันท์เหนียวนุ่ม ซอสมะขามเปียกเคี่ยวเอง กุ้งสดตัวโต ถั่วงอกกุยช่าย',
    description_en: 'Chewy rice noodles in house tamarind sauce with fresh shrimp, tofu, peanuts and lime',
    price: 90,
    cost: 35,
    category_id: 'cat_single',
    type: 'food',
    emoji: '🍤',
    isAvailable: true,
    sortOrder: 2,
    isFavorite: true,
    optionGroups: [
      {
        id: 'opt_pt_style',
        name_th: 'รูปแบบ',
        name_en: 'Style',
        required: true,
        type: 'single',
        options: [
          { id: 'pt_normal', name_th: 'ผัดไทยปกติ', name_en: 'Classic Pad Thai', priceDelta: 0 },
          { id: 'pt_wrap', name_th: 'ห่อไข่ตาข่ายพิเศษ', name_en: 'Wrapped in Egg Net', priceDelta: 20 },
        ],
      },
    ],
  },
  {
    id: 'item_khao_man_gai',
    name_th: 'ข้าวมันไก่ตอน',
    name_en: 'Hainanese Chicken Rice',
    description_th: 'ข้าวหอมมะลิหุงน้ำซุปกระดูก ไก่ตอนต้มเนื้อฉ่ำ น้ำจิ้มเต้าเจี้ยวขิงรสเด็ด',
    description_en: 'Tender poached chicken served over fragrant jasmine rice with ginger chili sauce',
    price: 60,
    cost: 22,
    category_id: 'cat_single',
    type: 'food',
    emoji: '🍗',
    isAvailable: true,
    sortOrder: 3,
    isFavorite: false,
    optionGroups: [
      {
        id: 'opt_gai',
        name_th: 'เลือกชนิดไก่',
        name_en: 'Chicken Option',
        required: true,
        type: 'single',
        options: [
          { id: 'gai_boil', name_th: 'ไก่ต้มเนื้อน่อง/สะโพก', name_en: 'Steamed Chicken Thigh', priceDelta: 0 },
          { id: 'gai_breast', name_th: 'ไก่ต้มอกล้วน (ไม่หนัง)', name_en: 'Lean Breast Meat', priceDelta: 0 },
          { id: 'gai_crispy', name_th: 'ไก่ทอดกรอบ', name_en: 'Crispy Fried Chicken', priceDelta: 10 },
          { id: 'gai_mix', name_th: 'ผสม 2 อย่าง (ต้ม+ทอด)', name_en: 'Combo (Steamed + Fried)', priceDelta: 15 },
        ],
      },
    ],
  },
  {
    id: 'item_khao_pad_pu',
    name_th: 'ข้าวผัดปูก้อน',
    name_en: 'Crab Meat Fried Rice',
    description_th: 'ข้าวเรียงเม็ดสวย ผัดไฟแรงกลิ่นกระทะหอม เนื้อปูก้อนเน้นๆ เสิร์ฟคู่น้ำปลาพริกมะนาว',
    description_en: 'Wok-charred fragrant jasmine rice loaded with sweet lump crab meat and scallions',
    price: 130,
    cost: 55,
    category_id: 'cat_single',
    type: 'food',
    emoji: '🦀',
    isAvailable: true,
    sortOrder: 4,
    isFavorite: true,
    optionGroups: [
      {
        id: 'opt_size',
        name_th: 'ขนาดจาน',
        name_en: 'Portion Size',
        required: true,
        type: 'single',
        options: [
          { id: 'size_reg', name_th: 'จานปกติ (1 ท่าน)', name_en: 'Regular (1 person)', priceDelta: 0 },
          { id: 'size_large', name_th: 'จานใหญ่พิเศษ (2 ท่าน)', name_en: 'Large (2 persons)', priceDelta: 70 },
        ],
      },
    ],
  },
  {
    id: 'item_rad_na',
    name_th: 'ราดหน้าเส้นใหญ่หมูนุ่ม',
    name_en: 'Rad Na Flat Noodles',
    description_th: 'ก๋วยเตี๋ยวเส้นใหญ่ผัดซีอิ๊วหอมไฟ ราดน้ำเกรวี่เหนียวข้น คะน้าฮ่องกงกรอบ',
    description_en: 'Wide rice noodles charred in wok with thick savory gravy, pork and Chinese broccoli',
    price: 70,
    cost: 26,
    category_id: 'cat_single',
    type: 'food',
    emoji: '🍜',
    isAvailable: true,
    sortOrder: 5,
    isFavorite: false,
    optionGroups: [
      {
        id: 'opt_radna_meat',
        name_th: 'เนื้อสัตว์',
        name_en: 'Meat',
        required: true,
        type: 'single',
        options: [
          { id: 'rn_pork', name_th: 'หมูนุ่มหมักสูตรโบราณ', name_en: 'Tender Marinated Pork', priceDelta: 0 },
          { id: 'rn_crispy_pork', name_th: 'หมูกรอบ', name_en: 'Crispy Pork Belly', priceDelta: 25 },
          { id: 'rn_seafood', name_th: 'กุ้งและปลาหมึก', name_en: 'Seafood', priceDelta: 30 },
        ],
      },
    ],
  },

  // Category 2: Soups and curries (5 items)
  {
    id: 'item_tomyum',
    name_th: 'ต้มยำกุ้งแม่น้ำน้ำข้น',
    name_en: 'Tom Yum Goong',
    description_th: 'กุ้งแม่น้ำตัวโต มันกุ้งหอมมัน น้ำซุปสมุนไพรพริกเผารสจัดจ้าน',
    description_en: 'Aromatic spicy and sour soup with river prawns, lemongrass, galangal and chili paste',
    price: 180,
    cost: 75,
    category_id: 'cat_soup',
    type: 'food',
    emoji: '🍲',
    isAvailable: true,
    sortOrder: 1,
    isFavorite: true,
    optionGroups: [
      {
        id: 'opt_broth',
        name_th: 'ชนิดน้ำซุป',
        name_en: 'Broth Style',
        required: true,
        type: 'single',
        options: [
          { id: 'br_creamy', name_th: 'น้ำข้น (ใส่นมสดและพริกเผา)', name_en: 'Creamy Broth', priceDelta: 0 },
          { id: 'br_clear', name_th: 'น้ำใส (สมุนไพรรสเปรี้ยวจัด)', name_en: 'Clear Broth', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'item_tomkha',
    name_th: 'ต้มข่าไก่บ้านใส่เห็ด',
    name_en: 'Tom Kha Gai',
    description_th: 'กะทิคั้นสด ข่าอ่อนหอมละมุน ไก่บ้านเนื้อแน่น เห็ดฟางกรุบกรอบ',
    description_en: 'Velvety coconut soup infused with galangal, kaffir lime, tender chicken and straw mushrooms',
    price: 140,
    cost: 50,
    category_id: 'cat_soup',
    type: 'food',
    emoji: '🥣',
    isAvailable: true,
    sortOrder: 2,
    isFavorite: false,
    optionGroups: [
      {
        id: 'opt_meat_tomkha',
        name_th: 'ชนิดเนื้อ',
        name_en: 'Meat Selection',
        required: true,
        type: 'single',
        options: [
          { id: 'tk_chicken', name_th: 'ไก่บ้าน', name_en: 'Free-range Chicken', priceDelta: 0 },
          { id: 'tk_seafood', name_th: 'ทะเลรวม', name_en: 'Mixed Seafood', priceDelta: 30 },
        ],
      },
    ],
  },
  {
    id: 'item_green_curry',
    name_th: 'แกงเขียวหวานไก่ยอดมะพร้าว',
    name_en: 'Green Curry Chicken',
    description_th: 'พริกแกงเขียวหวานตำเอง กะทิสด ยอดมะพร้าวอ่อนกรอบ มะเขือเปราะ',
    description_en: 'Spicy green curry with chicken, coconut milk, tender coconut shoots and sweet basil',
    price: 130,
    cost: 45,
    category_id: 'cat_soup',
    type: 'food',
    emoji: '🍛',
    isAvailable: true,
    sortOrder: 3,
    isFavorite: true,
    optionGroups: [
      {
        id: 'opt_gc_meat',
        name_th: 'เลือกเนื้อสัตว์',
        name_en: 'Meat Selection',
        required: true,
        type: 'single',
        options: [
          { id: 'gc_chicken', name_th: 'ไก่สะโพก', name_en: 'Chicken', priceDelta: 0 },
          { id: 'gc_beef', name_th: 'เนื้อน่องลายตุ๋น', name_en: 'Braised Beef Shank', priceDelta: 40 },
        ],
      },
    ],
  },
  {
    id: 'item_gaeng_som',
    name_th: 'แกงส้มชะอมกุ้งสด',
    name_en: 'Gaeng Som Cha-om Goong',
    description_th: 'น้ำแกงส้มข้นเนื้อปลา ไข่เจียวชะอมทอดใหม่ กุ้งสดหวานกรอบ รสเปรี้ยวนำเค็มตาม',
    description_en: 'Sweet and sour tamarind soup with acacia omelet bites and fresh prawns',
    price: 160,
    cost: 60,
    category_id: 'cat_soup',
    type: 'food',
    emoji: '🥘',
    isAvailable: true,
    sortOrder: 4,
    isFavorite: false,
    optionGroups: [
      {
        id: 'opt_gs_style',
        name_th: 'เครื่องแกงส้ม',
        name_en: 'Add-ons',
        required: true,
        type: 'single',
        options: [
          { id: 'gs_both', name_th: 'ไข่ชะอม + กุ้งสด', name_en: 'Acacia Omelet + Prawns', priceDelta: 0 },
          { id: 'gs_prawn_only', name_th: 'กุ้งสดล้วน', name_en: 'Prawns Only', priceDelta: 20 },
        ],
      },
    ],
  },
  {
    id: 'item_massaman',
    name_th: 'แกงมัสมั่นเนื้อน่องลาย',
    name_en: 'Massaman Beef Curry',
    description_th: 'แกงมัสมั่นเครื่องเทศหอมกรุ่น เนื้อน่องลายตุ๋นเปื่อยนุ่ม ละลายในปาก มันฝรั่งและถั่วลิสง',
    description_en: 'Rich and mild massaman curry with braised beef shank, potatoes, onions and roasted peanuts',
    price: 190,
    cost: 75,
    category_id: 'cat_soup',
    type: 'food',
    emoji: '🍲',
    isAvailable: true,
    sortOrder: 5,
    isFavorite: true,
    optionGroups: [
      {
        id: 'opt_massaman_meat',
        name_th: 'ชนิดเนื้อ',
        name_en: 'Meat Option',
        required: true,
        type: 'single',
        options: [
          { id: 'mm_beef', name_th: 'เนื้อน่องลายตุ๋น', name_en: 'Braised Beef Shank', priceDelta: 0 },
          { id: 'mm_chicken', name_th: 'น่องไก่ติดสะโพก', name_en: 'Chicken Drumstick', priceDelta: -30 },
        ],
      },
    ],
  },

  // Category 3: Papaya salad and spicy salads (5 items)
  {
    id: 'item_somtum_thai',
    name_th: 'ส้มตำไทยไข่เค็ม',
    name_en: 'Som Tum Thai Salted Egg',
    description_th: 'มะละกอสับกรอบ ถั่วลิสงคั่วหอม กุ้งแห้งตัวโต ไข่เค็มไชยามันเยิ้ม',
    description_en: 'Crispy green papaya salad tossed with dried shrimp, peanuts, lime and rich salted egg',
    price: 75,
    cost: 25,
    category_id: 'cat_salad',
    type: 'food',
    emoji: '🥗',
    isAvailable: true,
    sortOrder: 1,
    isFavorite: true,
    optionGroups: [
      {
        id: 'opt_somtum_spicy',
        name_th: 'ระดับพริก',
        name_en: 'Chili Level',
        required: true,
        type: 'single',
        options: [
          { id: 'st_sp1', name_th: 'เผ็ดน้อย (พริก 1-2 เม็ด)', name_en: 'Mild (1-2 chilies)', priceDelta: 0 },
          { id: 'st_sp2', name_th: 'เผ็ดกลาง (พริก 3-4 เม็ด)', name_en: 'Medium (3-4 chilies)', priceDelta: 0 },
          { id: 'st_sp3', name_th: 'เผ็ดจัดจ้าน (พริก 5+ เม็ด)', name_en: 'Hot (5+ chilies)', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'item_somtum_plara',
    name_th: 'ส้มตำปูปลาร้าแซ่บนัว',
    name_en: 'Som Tum Poo Pla Ra',
    description_th: 'น้ำปลาร้าต้มสุกหอมนัว ปูดองเค็ม มะละกอกรอบ รสแซ่บสะใจอีสานแท้',
    description_en: 'Authentic northeastern papaya salad with fermented fish sauce and salted crab',
    price: 65,
    cost: 20,
    category_id: 'cat_salad',
    type: 'food',
    emoji: '🌶️',
    isAvailable: true,
    sortOrder: 2,
    isFavorite: true,
    optionGroups: [
      {
        id: 'opt_plara_spicy',
        name_th: 'ระดับความแซ่บ',
        name_en: 'Spice Level',
        required: true,
        type: 'single',
        options: [
          { id: 'pr_normal', name_th: 'แซ่บปกติ', name_en: 'Classic Spicy', priceDelta: 0 },
          { id: 'pr_hot', name_th: 'แซ่บไฟลุกพริกแห้ง', name_en: 'Super Hot Dried Chili', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'item_larb_moo',
    name_th: 'ลาบหมูคั่วพริกหอม',
    name_en: 'Spicy Minced Pork Salad',
    description_th: 'หมูสับลวกสุกกำลังดี คลุกเคล้าข้าวคั่วใหม่ หอมแดง ต้นหอม ผักชีฝรั่ง มะนาวแท้',
    description_en: 'Minced pork tossed with toasted ground rice, shallots, mint, chili and fresh lime',
    price: 85,
    cost: 32,
    category_id: 'cat_salad',
    type: 'food',
    emoji: '🥩',
    isAvailable: true,
    sortOrder: 3,
    isFavorite: false,
    optionGroups: [
      {
        id: 'opt_larb_offal',
        name_th: 'เครื่องใน',
        name_en: 'Pork Offal',
        required: true,
        type: 'single',
        options: [
          { id: 'lb_pure', name_th: 'หมูสับล้วน (ไม่เครื่องใน)', name_en: 'Pure Minced Pork', priceDelta: 0 },
          { id: 'lb_mixed', name_th: 'ใส่ตับหมูและหนังหมู', name_en: 'With Liver and Pork Skin', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'item_namtok_moo',
    name_th: 'น้ำตกคอหมูย่าง',
    name_en: 'Spicy Grilled Pork Neck',
    description_th: 'คอหมูย่างเตาถ่านหอมนุ่ม คลุกน้ำยำรสแซ่ว ข้าวคั่วหอมกรุ่น สะระแหน่สด',
    description_en: 'Charcoal-grilled juicy pork neck sliced and tossed in zesty herb and chili dressing',
    price: 110,
    cost: 45,
    category_id: 'cat_salad',
    type: 'food',
    emoji: '🍖',
    isAvailable: true,
    sortOrder: 4,
    isFavorite: true,
    optionGroups: [
      {
        id: 'opt_namtok_spicy',
        name_th: 'ระดับความเผ็ด',
        name_en: 'Spice Level',
        required: true,
        type: 'single',
        options: [
          { id: 'nt_mild', name_th: 'เผ็ดน้อย', name_en: 'Mild', priceDelta: 0 },
          { id: 'nt_normal', name_th: 'เผ็ดปกติ', name_en: 'Medium', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'item_yum_woonsen',
    name_th: 'ยำวุ้นเส้นรวมมิตรทะเล',
    name_en: 'Spicy Glass Noodle Seafood',
    description_th: 'วุ้นเส้นเหนียวนุ่ม กุ้งสด หมึกสด หมูสับ น้ำยำมะนาวพริกสดจัดจ้าน',
    description_en: 'Glass noodle salad with fresh prawns, squid, minced pork, celery and tangy chili lime dressing',
    price: 120,
    cost: 48,
    category_id: 'cat_salad',
    type: 'food',
    emoji: '🦐',
    isAvailable: true,
    sortOrder: 5,
    isFavorite: false,
    optionGroups: [
      {
        id: 'opt_yum_style',
        name_th: 'สูตรน้ำยำ',
        name_en: 'Dressing Style',
        required: true,
        type: 'single',
        options: [
          { id: 'ym_classic', name_th: 'ยำโบราณ (ใส่ถั่วลิสง)', name_en: 'Traditional Style with Peanuts', priceDelta: 0 },
          { id: 'ym_fresh', name_th: 'ยำพริกสดมะนาวแท้', name_en: 'Fresh Chili & Lime', priceDelta: 0 },
        ],
      },
    ],
  },

  // Category 4: Snacks (5 items)
  {
    id: 'item_wings',
    name_th: 'ปีกไก่ทอดน้ำปลา',
    name_en: 'Deep Fried Chicken Wings',
    description_th: 'ปีกไก่กลางหมักน้ำปลาแท้อย่างดี ทอดกรอบนอกนุ่มฉ่ำใน เสิร์ฟพร้อมน้ำจิ้มแจ่ว',
    description_en: 'Crispy fried marinated chicken wings coated with aromatic fish sauce and spicy dip',
    price: 89,
    cost: 35,
    category_id: 'cat_snacks',
    type: 'food',
    emoji: '🍗',
    isAvailable: true,
    sortOrder: 1,
    isFavorite: true,
    optionGroups: [
      {
        id: 'opt_wings_portion',
        name_th: 'จำนวนชิ้น',
        name_en: 'Portion Size',
        required: true,
        type: 'single',
        options: [
          { id: 'wg_5', name_th: 'ชุดเล็ก (5 ชิ้น)', name_en: 'Small (5 pcs)', priceDelta: 0 },
          { id: 'wg_10', name_th: 'ชุดใหญ่ (10 ชิ้น)', name_en: 'Large (10 pcs)', priceDelta: 80 },
        ],
      },
    ],
  },
  {
    id: 'item_satay',
    name_th: 'หมูสะเต๊ะชุด 10 ไม้',
    name_en: 'Pork Satay (10 Skewers)',
    description_th: 'เนื้อสะโพกหมูหมักเครื่องเทศกะทิ ย่างไฟอ่อน น้ำจิ้มถั่วสูตรเข้มข้น และอาจาดแตงกวา',
    description_en: 'Tender grilled pork skewers served with rich peanut sauce and pickled cucumber relish',
    price: 99,
    cost: 40,
    category_id: 'cat_snacks',
    type: 'food',
    emoji: '🍢',
    isAvailable: true,
    sortOrder: 2,
    isFavorite: true,
    optionGroups: [
      {
        id: 'opt_toast',
        name_th: 'ขนมปังปิ้ง',
        name_en: 'Toast',
        required: false,
        type: 'single',
        options: [
          { id: 'toast_add', name_th: 'เพิ่มขนมปังปิ้ง 2 แผ่น', name_en: 'Add Grilled Toast (2 pcs)', priceDelta: 20 },
        ],
      },
    ],
  },
  {
    id: 'item_shrimp_cake',
    name_th: 'ทอดมันกุ้งเนื้อเด้ง',
    name_en: 'Deep Fried Shrimp Cakes',
    description_th: 'เนื้อกุ้งสดล้วนบดเด้ง ชุบเกล็ดขนมปังทอดสีเหลืองทอง เสิร์ฟพร้อมน้ำจิ้มบ๊วยเจี่ยหวาน',
    description_en: 'Golden crispy panko-crusted shrimp patties served with sweet plum sauce',
    price: 120,
    cost: 50,
    category_id: 'cat_snacks',
    type: 'food',
    emoji: '🍘',
    isAvailable: true,
    sortOrder: 3,
    isFavorite: false,
    optionGroups: [
      {
        id: 'opt_shrimp_portion',
        name_th: 'จำนวนชิ้น',
        name_en: 'Pieces',
        required: true,
        type: 'single',
        options: [
          { id: 'sc_4', name_th: '4 ชิ้น', name_en: '4 pieces', priceDelta: 0 },
          { id: 'sc_6', name_th: '6 ชิ้น', name_en: '6 pieces', priceDelta: 55 },
        ],
      },
    ],
  },
  {
    id: 'item_spring_rolls',
    name_th: 'เปาะเปี๊ยะทอดไส้วุ้นเส้น',
    name_en: 'Crispy Spring Rolls',
    description_th: 'แป้งเปาะเปี๊ยะบางกรอบ ไส้วุ้นเส้น เห็ดหอม กะหล่ำปลี และหมูสับ ทอดไม่อมน้ำมัน',
    description_en: 'Deep fried crispy spring rolls filled with glass noodles, shiitake and minced pork',
    price: 65,
    cost: 22,
    category_id: 'cat_snacks',
    type: 'food',
    emoji: '🥢',
    isAvailable: true,
    sortOrder: 4,
    isFavorite: false,
  },
  {
    id: 'item_tendons',
    name_th: 'เอ็นข้อไก่ทอดสมุนไพร',
    name_en: 'Fried Chicken Tendons',
    description_th: 'เอ็นข้อไก่กรุบกรอบ คลุกแป้งบางทอดพร้อมใบมะกรูดและพริกแห้ง กับแกล้มชั้นดี',
    description_en: 'Crispy deep-fried chicken cartilages with aromatic kaffir lime leaves and chili',
    price: 79,
    cost: 30,
    category_id: 'cat_snacks',
    type: 'food',
    emoji: '🍗',
    isAvailable: true,
    sortOrder: 5,
    isFavorite: false,
  },

  // Category 5: Drinks and desserts (5 items)
  {
    id: 'item_thai_tea',
    name_th: 'ชาไทยเย็นโบราณ',
    name_en: 'Traditional Thai Iced Tea',
    description_th: 'ใบชาคัดพิเศษ หอมกรุ่น นมข้นหวานมันเข้มข้น รสชาติต้นตำรับไทยแท้',
    description_en: 'Slow-brewed aromatic Thai black tea blended with condensed milk over ice',
    price: 45,
    cost: 14,
    category_id: 'cat_drinks_dessert',
    type: 'drink',
    emoji: '🧋',
    isAvailable: true,
    sortOrder: 1,
    isFavorite: true,
    optionGroups: [
      {
        id: 'opt_sweet_tea',
        name_th: 'ระดับความหวาน',
        name_en: 'Sweetness',
        required: true,
        type: 'single',
        options: [
          { id: 'sw_0', name_th: 'ไม่หวานเลย (0%)', name_en: 'No Sugar (0%)', priceDelta: 0 },
          { id: 'sw_50', name_th: 'หวานน้อย (50%)', name_en: 'Less Sweet (50%)', priceDelta: 0 },
          { id: 'sw_100', name_th: 'หวานปกติ (100%)', name_en: 'Normal Sweet (100%)', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'item_thai_coffee',
    name_th: 'กาแฟโบราณเย็น (โอเลี้ยงยกล้อ)',
    name_en: 'Traditional Thai Iced Coffee',
    description_th: 'กาแฟคั่วบดสูตรโบราณ รสเข้มข้นกลมกล่อม ราดฟองนมสดด้านบน',
    description_en: 'Strong traditional Thai dark roasted coffee poured over crushed ice with creamy milk',
    price: 45,
    cost: 14,
    category_id: 'cat_drinks_dessert',
    type: 'drink',
    emoji: '☕',
    isAvailable: true,
    sortOrder: 2,
    isFavorite: false,
    optionGroups: [
      {
        id: 'opt_sweet_coffee',
        name_th: 'ระดับความหวาน',
        name_en: 'Sweetness',
        required: true,
        type: 'single',
        options: [
          { id: 'cf_mild', name_th: 'หวานน้อย', name_en: 'Less Sweet', priceDelta: 0 },
          { id: 'cf_norm', name_th: 'หวานปกติ', name_en: 'Standard Sweet', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'item_lemon_tea',
    name_th: 'ชามะนาวสดแท้',
    name_en: 'Fresh Lemon Iced Tea',
    description_th: 'ชาดำคัดพิเศษ บีบน้ำมะนาวแป้นสดแท้ เปรี้ยวหวานสดชื่น ดับกระหาย',
    description_en: 'Refreshing brewed iced tea mixed with fresh lime juice and sugar syrup',
    price: 50,
    cost: 16,
    category_id: 'cat_drinks_dessert',
    type: 'drink',
    emoji: '🍋',
    isAvailable: true,
    sortOrder: 3,
    isFavorite: true,
  },
  {
    id: 'item_mango_sticky_rice',
    name_th: 'ข้าวเหนียวมะม่วงน้ำดอกไม้',
    name_en: 'Mango Sticky Rice with Coconut Cream',
    description_th: 'มะม่วงน้ำดอกไม้สุกหอมหวาน ข้าวเหนียวมูนกะทิสด ราดกะทิข้นและถั่วทองกรอบ',
    description_en: 'Sweet ripe Nam Dok Mai mango served with warm coconut sticky rice and crispy mung beans',
    price: 95,
    cost: 38,
    category_id: 'cat_drinks_dessert',
    type: 'dessert',
    emoji: '🥭',
    isAvailable: true,
    sortOrder: 4,
    isFavorite: true,
  },
  {
    id: 'item_tub_tim_krob',
    name_th: 'ทับทิมกรอบน้ำกะทิอบควันเทียน',
    name_en: 'Tub Tim Krob (Water Chestnut Rubies)',
    description_th: 'แห้วกรอบเคลือบแป้งมัน กะทิสดหอมควันเทียน ใส่น้ำแข็งเกล็ดหิมะเย็นชื่นใจ',
    description_en: 'Crunchy water chestnut rubies in fragrant smoked coconut syrup with crushed ice',
    price: 50,
    cost: 16,
    category_id: 'cat_drinks_dessert',
    type: 'dessert',
    emoji: '🍧',
    isAvailable: true,
    sortOrder: 5,
    isFavorite: false,
  },
];
