import { AppSettings, MenuCategory, MenuItem } from '../types';

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
  <text x="220" y="488" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" fill="#0f172a" text-anchor="middle">ร้านครัวไทยอารีย์</text>
  <text x="220" y="512" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#475569" text-anchor="middle">พร้อมเพย์: 089-123-4567 (นายสมศักดิ์)</text>
  <text x="220" y="534" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="#94a3b8" text-anchor="middle">สแกนจ่ายได้ทุกธนาคาร ไม่มีค่าธรรมเนียม</text>
</svg>
`);

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
  currency: 'THB',
  language: 'th',
  serviceMode: 'quick_service', // default quick service as tested in Phase 1
  vatEnabled: false, // DEFAULT: VAT OFF as per requirements
  vatRate: 7,
  serviceChargeEnabled: false, // DEFAULT: SC OFF
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
  autoPrintKitchenTicket: true,
  queueNumberResetDate: new Date().toISOString().split('T')[0],
  lastDailyQueue: 0,
  customerQrOrderingEnabled: false, // STRICTLY OFF by default as per requirements
};

export const defaultCategories: MenuCategory[] = [
  { id: 'cat_main', name_th: 'อาหารจานเดียว', name_en: 'Single Dishes', icon: '🍲', sortOrder: 1, defaultPrintDestination: 'kitchen' },
  { id: 'cat_curry', name_th: 'ต้ม & แกง', name_en: 'Soups & Curries', icon: '🥣', sortOrder: 2, defaultPrintDestination: 'kitchen' },
  { id: 'cat_somtum', name_th: 'ส้มตำ & ยำ', name_en: 'Salads & Spicy', icon: '🥗', sortOrder: 3, defaultPrintDestination: 'kitchen' },
  { id: 'cat_drinks', name_th: 'เครื่องดื่ม', name_en: 'Beverages', icon: '🧋', sortOrder: 4, defaultPrintDestination: 'bar' },
  { id: 'cat_dessert', name_th: 'ของหวาน', name_en: 'Desserts', icon: '🍧', sortOrder: 5, defaultPrintDestination: 'kitchen' },
];

export const defaultMenuItems: MenuItem[] = [
  {
    id: 'item_gapao',
    name_th: 'ข้าวกะเพราหมูสับ / ไก่',
    name_en: 'Pad Kra Pao (Minced Pork/Chicken)',
    description_th: 'ผัดกะเพราแท้รสจัดจ้าน ใบกะเพราบ้านหอมกรุ่น',
    description_en: 'Classic spicy stir-fried basil with fragrant Thai garlic and chili',
    price: 65,
    cost: 25,
    category_id: 'cat_main',
    type: 'food',
    emoji: '🍳',
    isAvailable: true,
    sortOrder: 1,
    isFavorite: true,
    printDestination: 'kitchen',
    optionGroups: [
      {
        id: 'opt_meat',
        name_th: 'เลือกเนื้อสัตว์',
        name_en: 'Select Meat',
        required: true,
        type: 'single',
        options: [
          { id: 'm_pork', name_th: 'หมูสับ', name_en: 'Minced Pork', priceDelta: 0 },
          { id: 'm_chicken', name_th: 'ไก่ชิ้น', name_en: 'Chicken', priceDelta: 0 },
          { id: 'm_crispy_pork', name_th: 'หมูกรอบ', name_en: 'Crispy Pork Belly', priceDelta: 25 },
          { id: 'm_beef', name_th: 'เนื้อสับโคขุน', name_en: 'Minced Beef', priceDelta: 30 },
          { id: 'm_seafood', name_th: 'ทะเล (กุ้ง+หมึก)', name_en: 'Seafood', priceDelta: 35 },
        ],
      },
      {
        id: 'opt_egg',
        name_th: 'เพิ่มไข่',
        name_en: 'Add Egg',
        required: false,
        type: 'single',
        options: [
          { id: 'egg_fried', name_th: 'ไข่ดาวกรอบไข่แดงเยิ้ม', name_en: 'Crispy Fried Egg', priceDelta: 12 },
          { id: 'egg_omelet', name_th: 'ไข่เจียวหมูสับเล็ก', name_en: 'Small Omelet', priceDelta: 20 },
        ],
      },
      {
        id: 'opt_spicy',
        name_th: 'ระดับความเผ็ด',
        name_en: 'Spicy Level',
        required: true,
        type: 'single',
        options: [
          { id: 'sp_none', name_th: 'ไม่เผ็ดเลย (พริก 0 เม็ด)', name_en: 'Non-spicy', priceDelta: 0 },
          { id: 'sp_mild', name_th: 'เผ็ดน้อย (พริก 1-2 เม็ด)', name_en: 'Mild', priceDelta: 0 },
          { id: 'sp_normal', name_th: 'เผ็ดปกติมาตรฐาน', name_en: 'Normal Medium', priceDelta: 0 },
          { id: 'sp_hot', name_th: 'เผ็ดมาก (พริกกระเหรี่ยง)', name_en: 'Very Spicy', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'item_padthai',
    name_th: 'ผัดไทยกุ้งสดโบราณ',
    name_en: 'Traditional Pad Thai with Fresh Prawns',
    description_th: 'เส้นจันท์เหนียวนุ่ม ซอสมะขามเคี่ยวเอง กุ้งสดตัวโต',
    description_en: 'Stir-fried rice noodles with tamarind sauce, tofu, peanuts and fresh shrimp',
    price: 90,
    cost: 35,
    category_id: 'cat_main',
    type: 'food',
    emoji: '🍤',
    isAvailable: true,
    sortOrder: 2,
    isFavorite: true,
    printDestination: 'kitchen',
    optionGroups: [
      {
        id: 'opt_padthai_egg',
        name_th: 'รูปแบบห่อไข่',
        name_en: 'Egg Style',
        required: false,
        type: 'single',
        options: [
          { id: 'pt_wrap', name_th: 'ห่อไข่ตาข่ายพิเศษ', name_en: 'Wrapped in Egg Net', priceDelta: 20 },
        ],
      },
    ],
  },
  {
    id: 'item_khao_man_gai',
    name_th: 'ข้าวมันไก่ตอนเนื้อนุ่ม',
    name_en: 'Hainanese Chicken Rice',
    description_th: 'ข้าวหอมมะลิหุงน้ำซุปกระดูก ไก่ตอนต้มเนื้อฉ่ำ น้ำจิ้มเต้าเจี้ยวรสเด็ด',
    description_en: 'Steamed fragrant chicken with seasoned rice, cucumber and spicy ginger bean sauce',
    price: 60,
    cost: 22,
    category_id: 'cat_main',
    type: 'food',
    emoji: '🍗',
    isAvailable: true,
    sortOrder: 3,
    isFavorite: false,
    printDestination: 'kitchen',
    optionGroups: [
      {
        id: 'opt_gai_type',
        name_th: 'ชนิดไก่',
        name_en: 'Chicken Option',
        required: true,
        type: 'single',
        options: [
          { id: 'gai_boil', name_th: 'ไก่ต้มเนื้อน่อง/สะโพก', name_en: 'Steamed Chicken (Thigh)', priceDelta: 0 },
          { id: 'gai_breast', name_th: 'ไก่ต้มอกล้วนไม่เอาหนัง', name_en: 'Steamed Breast (Lean)', priceDelta: 0 },
          { id: 'gai_crispy', name_th: 'ไก่ทอดกรอบ', name_en: 'Crispy Fried Chicken', priceDelta: 5 },
          { id: 'gai_mix', name_th: 'ไก่ผสม (ต้ม + ทอด)', name_en: 'Combo (Steamed + Fried)', priceDelta: 15 },
        ],
      },
    ],
  },
  {
    id: 'item_khao_pad_pu',
    name_th: 'ข้าวผัดปูก้อน',
    name_en: 'Crab Meat Fried Rice',
    description_th: 'ข้าวเรียงเม็ดสวย ผัดไฟแรงกลิ่นกระทะหอม เนื้อปูก้อนเน้นๆ',
    description_en: 'Wok-tossed jasmine rice with sweet lump crab meat, scallions and lime',
    price: 130,
    cost: 55,
    category_id: 'cat_main',
    type: 'food',
    emoji: '🦀',
    isAvailable: true,
    sortOrder: 4,
    isFavorite: true,
    printDestination: 'kitchen',
  },
  {
    id: 'item_tomyum',
    name_th: 'ต้มยำกุ้งแม่น้ำน้ำข้น',
    name_en: 'Creamy Tom Yum Soup with River Prawns',
    description_th: 'สมุนไพรสด ข่า ตะไคร้ ใบมะกรูด มันกุ้งเยิ้มๆ รสเปรี้ยวเผ็ดลงตัว',
    description_en: 'Iconic Thai spicy and sour soup with river prawns, mushrooms and herbs',
    price: 160,
    cost: 65,
    category_id: 'cat_curry',
    type: 'food',
    emoji: '🍲',
    isAvailable: true,
    sortOrder: 1,
    isFavorite: true,
    printDestination: 'kitchen',
    optionGroups: [
      {
        id: 'opt_tomyum_soup',
        name_th: 'ประเภทน้ำต้มยำ',
        name_en: 'Soup Broth Style',
        required: true,
        type: 'single',
        options: [
          { id: 'ty_thick', name_th: 'น้ำข้น (ใส่นมสดและน้ำพริกเผา)', name_en: 'Creamy (Milk & Chili Jam)', priceDelta: 0 },
          { id: 'ty_clear', name_th: 'น้ำใสโบราณ (หอมมะนาวสด)', name_en: 'Clear Broth (Fresh Lime)', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'item_green_curry',
    name_th: 'แกงเขียวหวานไก่ยอดมะพร้าว',
    name_en: 'Green Curry Chicken with Coconut Shoots',
    description_th: 'กะทิคั้นสด เครื่องแกงตำเอง ยอดมะพร้าวอ่อนกรอบ',
    description_en: 'Aromatic green coconut curry with tender chicken, Thai eggplants and sweet basil',
    price: 110,
    cost: 40,
    category_id: 'cat_curry',
    type: 'food',
    emoji: '🥣',
    isAvailable: true,
    sortOrder: 2,
    isFavorite: false,
    printDestination: 'kitchen',
  },
  {
    id: 'item_somtum_thai',
    name_th: 'ส้มตำไทยไข่เค็ม',
    name_en: 'Som Tum Thai with Salted Egg',
    description_th: 'เส้นมะละกอกรอบ ตำสดครกต่อครก ถั่วลิสงคั่วใหม่',
    description_en: 'Crispy green papaya salad with roasted peanuts, cherry tomatoes and salted duck egg',
    price: 75,
    cost: 20,
    category_id: 'cat_somtum',
    type: 'food',
    emoji: '🥗',
    isAvailable: true,
    sortOrder: 1,
    isFavorite: true,
    printDestination: 'kitchen',
    optionGroups: [
      {
        id: 'opt_somtum_spicy',
        name_th: 'ความเผ็ด (จำนวนพริก)',
        name_en: 'Chili Count',
        required: true,
        type: 'single',
        options: [
          { id: 'st_sp1', name_th: 'พริก 1 เม็ด (เผ็ดน้อยมาก)', name_en: '1 Chili (Very mild)', priceDelta: 0 },
          { id: 'st_sp3', name_th: 'พริก 3 เม็ด (เผ็ดกำลังดี)', name_en: '3 Chilies (Medium)', priceDelta: 0 },
          { id: 'st_sp5', name_th: 'พริก 5 เม็ด (เผ็ดแซ่บ)', name_en: '5 Chilies (Spicy)', priceDelta: 0 },
          { id: 'st_sp10', name_th: 'พริก 10 เม็ด (เผ็ดน้ำตาไหล)', name_en: '10 Chilies (Extra hot)', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'item_somtum_plara',
    name_th: 'ส้มตำปูปลาร้าแซ่บนัว',
    name_en: 'Isan Som Tum with Fermented Fish Sauce',
    description_th: 'น้ำปลาร้าต้มสุกสูตรเด็ด หอมนัวไม่เหม็นคาว ปูดองสดสะอาด',
    description_en: 'Authentic northeastern green papaya salad with rich fermented fish sauce and salted crab',
    price: 65,
    cost: 18,
    category_id: 'cat_somtum',
    type: 'food',
    emoji: '🌶️',
    isAvailable: true,
    sortOrder: 2,
    isFavorite: false,
    printDestination: 'kitchen',
  },
  {
    id: 'item_larb_moo',
    name_th: 'ลาบหมูคั่วข้าวคั่วหอม',
    name_en: 'Spicy Minced Pork Salad (Larb Moo)',
    description_th: 'หมูสับรวนสุกพอดี คลุกพริกป่น ข้าวคั่วใหม่ ใบสะระแหน่หอมสดชื่น',
    description_en: 'Minced pork salad seasoned with fresh lime, toasted crushed rice, chili and fresh mint',
    price: 85,
    cost: 30,
    category_id: 'cat_somtum',
    type: 'food',
    emoji: '🥩',
    isAvailable: true,
    sortOrder: 3,
    isFavorite: false,
    printDestination: 'kitchen',
  },
  {
    id: 'item_cha_yen',
    name_th: 'ชาไทยเย็นโบราณสูตรเข้มข้น',
    name_en: 'Traditional Thai Iced Milk Tea',
    description_th: 'ชาใบแท้คัดเกรด ชงสดแก้วต่อแก้ว หวานมันกลมกล่อม',
    description_en: 'Slow-brewed authentic Ceylon tea with sweetened condensed milk over crushed ice',
    price: 45,
    cost: 12,
    category_id: 'cat_drinks',
    type: 'drink',
    emoji: '🧋',
    isAvailable: true,
    sortOrder: 1,
    isFavorite: true,
    printDestination: 'bar',
    optionGroups: [
      {
        id: 'opt_sweetness',
        name_th: 'ระดับความหวาน',
        name_en: 'Sweetness Level',
        required: true,
        type: 'single',
        options: [
          { id: 'sw_100', name_th: 'หวานปกติ (100%)', name_en: 'Regular Sweet (100%)', priceDelta: 0 },
          { id: 'sw_50', name_th: 'หวานน้อย (50%)', name_en: 'Less Sweet (50%)', priceDelta: 0 },
          { id: 'sw_25', name_th: 'หวานน้อยมาก (25%)', name_en: 'Slightly Sweet (25%)', priceDelta: 0 },
          { id: 'sw_0', name_th: 'ไม่หวานเลย (0%)', name_en: 'No Sweetness (0%)', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'item_cha_keow',
    name_th: 'ชาเขียวมะลิเย็น',
    name_en: 'Iced Jasmine Green Tea',
    description_th: 'หอมกรุ่นกลิ่นมะลิ สดชื่นดับกระหาย',
    description_en: 'Chilled jasmine-scented green tea, refreshing and aromatic',
    price: 40,
    cost: 10,
    category_id: 'cat_drinks',
    type: 'drink',
    emoji: '🍵',
    isAvailable: true,
    sortOrder: 2,
    isFavorite: false,
    printDestination: 'bar',
  },
  {
    id: 'item_nom_yen',
    name_th: 'นมเย็นสีชมพู (นมสดเฮลบลูบอย)',
    name_en: 'Pink Milk (Nom Yen)',
    description_th: 'นมสดแท้ผสมน้ำหวานสละ หวานละมุนชื่นใจ',
    description_en: 'Classic Thai pink sala milk drink with condensed milk',
    price: 45,
    cost: 12,
    category_id: 'cat_drinks',
    type: 'drink',
    emoji: '🥛',
    isAvailable: true,
    sortOrder: 3,
    isFavorite: false,
    printDestination: 'bar',
  },
  {
    id: 'item_mango_sticky_rice',
    name_th: 'ข้าวเหนียวมะม่วงน้ำดอกไม้',
    name_en: 'Mango Sticky Rice with Coconut Cream',
    description_th: 'มะม่วงน้ำดอกไม้สุกหอมหวาน ข้าวเหนียวมูนกะทิสด ราดกะทิข้นและถั่วทอง',
    description_en: 'Sweet ripe Nam Dok Mai mango served with warm coconut sticky rice and crispy mung beans',
    price: 95,
    cost: 38,
    category_id: 'cat_dessert',
    type: 'dessert',
    emoji: '🥭',
    isAvailable: true,
    sortOrder: 1,
    isFavorite: true,
    printDestination: 'kitchen',
  },
  {
    id: 'item_tub_tim_krob',
    name_th: 'ทับทิมกรอบน้ำกะทิอบควันเทียน',
    name_en: 'Tub Tim Krob (Water Chestnut Rubies in Coconut Milk)',
    description_th: 'แห้วกรอบเคลือบแป้งมัน กะทิสดหอมควันเทียน ใส่น้ำแข็งเกล็ดหิมะ',
    description_en: 'Crunchy water chestnut rubies in fragrant smoked coconut syrup with crushed ice',
    price: 50,
    cost: 16,
    category_id: 'cat_dessert',
    type: 'dessert',
    emoji: '🍧',
    isAvailable: true,
    sortOrder: 2,
    isFavorite: false,
    printDestination: 'kitchen',
  },
];
