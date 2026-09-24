import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppSettings,
  AppUser,
  Customer,
  DiningTable,
  InAppNotification,
  MenuCategory,
  MenuItem,
  Order,
  OrderLine,
  OrderType,
  PaymentRecord,
  SelectedOption,
} from './types';
import {
  customerRepo,
  menuRepo,
  orderRepo,
  settingsRepo,
  tableRepo,
} from './db/repositories';
import { seedDatabaseIfEmpty } from './db/db';
import { useI18n } from './i18n';
import { useBackupWarning } from './hooks/useBackupWarning';
import { sound } from './utils/sound';
import { calculateOrderTotals } from './utils/taxCalculator';
import { defaultSettings, demoUsers } from './db/seedData';

// Layout components
import { Header } from './components/layout/Header';
import { NavigationDrawer, NavView } from './components/layout/NavigationDrawer';
import { CashDrawerModal } from './components/layout/CashDrawerModal';
import { BackupWarningBanner } from './components/common/BackupWarningBanner';

// Auth component
import { LoginView } from './components/auth/LoginView';

// Order screen components
import { CategoryTileGrid } from './components/order/CategoryTileGrid';
import { CategoryTabBar } from './components/order/CategoryTabBar';
import { MenuItemGrid } from './components/order/MenuItemGrid';
import { OrderPanel } from './components/order/OrderPanel';
import { ItemCustomizerModal } from './components/order/ItemCustomizerModal';
import { HeldOrdersModal } from './components/order/HeldOrdersModal';
import { AssignTableModal } from './components/order/AssignTableModal';

// Checkout modals
import { PaymentModal } from './components/checkout/PaymentModal';
import { ReceiptModal } from './components/checkout/ReceiptModal';

// Dual Screen / Customer Facing Display
import { CustomerFacingDisplay } from './components/customer_display/CustomerFacingDisplay';
import { CustomerDisplayControlModal } from './components/customer_display/CustomerDisplayControlModal';
import { customerDisplaySync } from './utils/customerDisplaySync';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { MenuItemEditorModal } from './components/menu/MenuItemEditorModal';
import { TablesView } from './components/tables/TablesView';
import { OrdersHistoryView } from './components/orders/OrdersHistoryView';
import { CustomersView } from './components/customers/CustomersView';
import { PromotionsView } from './components/promotions/PromotionsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

export default function App() {
  // If window was opened with ?display=customer, render pure Customer Display
  const isCustomerDisplayMode =
    typeof window !== 'undefined' &&
    (window.location.search.includes('display=customer') ||
      window.location.hash.includes('display=customer'));

  if (isCustomerDisplayMode) {
    return <CustomerFacingDisplay />;
  }

  const { t, language } = useI18n();
  const { needsBackup, dismissWarning, refreshBackupStatus } = useBackupWarning();

  // Active User State - Default to Owner (No 4-digit PIN required)
  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    if (typeof window !== 'undefined') {
      const savedUserId = localStorage.getItem('kind_pos_active_user_id');
      const found = demoUsers.find((u) => u.id === savedUserId);
      if (found) return found;
    }
    return demoUsers[0];
  });

  const handleSwitchUser = (user: AppUser) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kind_pos_active_user_id', user.id);
    }
  };

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('kind_pos_theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('kind_pos_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('kind_pos_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Start page after opening the app or logging in is ALWAYS the Tables floor plan
  const [currentView, setCurrentView] = useState<NavView>('tables');

  // In-app Notifications State
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  const addNotification = (type: 'call_waiter' | 'request_bill' | 'system', messageTh: string, messageEn: string) => {
    sound.playNotificationChime();
    const newNotif: InAppNotification = {
      id: `notif_${Date.now()}`,
      type,
      message_th: messageTh,
      message_en: messageEn,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);
  };

  // Core Data State
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [heldOrders, setHeldOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Navigation Drawer & Modals State
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isCustomerDisplayControlOpen, setIsCustomerDisplayControlOpen] = useState(false);
  const [isCustomerDisplayConnected, setIsCustomerDisplayConnected] = useState(false);

  // Category State for POS screen
  const [selectedCategory, setSelectedCategory] = useState<string>('categories');

  // Working Order State
  const createFreshOrder = useCallback(
    (orderType: OrderType = 'dine_in', tableName?: string, tableId?: string): Order => {
      const orderNum = orderRepo.generateOrderNumber();
      return {
        id: `ord_${Date.now()}`,
        orderNumber: orderNum,
        orderType,
        source: 'pos',
        tableId,
        tableName: tableName || (orderType === 'takeaway' ? 'Takeaway' : 'Counter'),
        status: 'open',
        isPaid: false,
        lines: [],
        subtotal: 0,
        discountAmount: 0,
        serviceChargeAmount: 0,
        serviceChargeRate: settings.serviceChargeEnabled ? settings.serviceChargeRate : 0,
        vatAmount: 0,
        vatRate: settings.vatEnabled ? settings.vatRate : 0,
        netTotal: 0,
        payments: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    },
    [settings]
  );

  const [currentOrder, setCurrentOrder] = useState<Order>(() => createFreshOrder());

  // Modals State
  const [customizerItem, setCustomizerItem] = useState<MenuItem | null>(null);
  const [editingLine, setEditingLine] = useState<OrderLine | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
  const [itemEditorState, setItemEditorState] = useState<{
    isOpen: boolean;
    item: MenuItem | null;
  }>({ isOpen: false, item: null });
  const [settingsTab, setSettingsTab] = useState<'shop' | 'tax' | 'promptpay' | 'dualscreen' | 'modifiers' | 'backup' | 'printer'>('shop');

  // Initial Load
  const reloadAllData = useCallback(async () => {
    await seedDatabaseIfEmpty();
    const loadedSettings = await settingsRepo.getSettings();
    setSettings(loadedSettings);

    const loadedCats = await menuRepo.getCategories();
    setCategories(loadedCats);

    const loadedItems = await menuRepo.getItems();
    setItems(loadedItems);

    const loadedTables = await tableRepo.getTables();
    setTables(loadedTables);

    const loadedHeld = await orderRepo.getHeldOrders();
    setHeldOrders(loadedHeld);

    const loadedOrders = await orderRepo.getOrders(100);
    setAllOrders(loadedOrders);

    const loadedCust = await customerRepo.getCustomers();
    setCustomers(loadedCust);
  }, []);

  useEffect(() => {
    reloadAllData();
  }, [reloadAllData]);

  // Real-time Multi-Tab Sync with BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('kind_pos_broadcast');
      channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_DATA') {
          reloadAllData();
        }
      };
      return () => {
        channel.close();
      };
    }
  }, [reloadAllData]);

  const broadcastSync = () => {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('kind_pos_broadcast');
        channel.postMessage({ type: 'SYNC_DATA', timestamp: Date.now() });
        channel.close();
      } catch (e) {
        // ignore
      }
    }
  };

  // CFD Connection
  useEffect(() => {
    customerDisplaySync.startHeartbeatCheck();
    const unsub = customerDisplaySync.subscribeConnection((connected) => {
      setIsCustomerDisplayConnected(connected);
    });
    return () => {
      unsub();
      customerDisplaySync.stopHeartbeatCheck();
    };
  }, []);

  // CFD Broadcast
  useEffect(() => {
    customerDisplaySync.sendState({
      order: currentOrder,
      settings,
      isPaymentOpen: showPaymentModal,
      paymentMethod: 'promptpay',
      customQrImageUrl: settings.customPromptPayQrImage,
      timestamp: Date.now(),
    });
  }, [currentOrder, settings, showPaymentModal]);

  // Recalculate totals
  const recalculateCurrentOrder = useCallback(
    (lines: OrderLine[], discountAmount = currentOrder.discountAmount, discountReason = currentOrder.discountReason): Order => {
      const totals = calculateOrderTotals(lines, settings, discountAmount);
      return {
        ...currentOrder,
        lines,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        discountReason,
        serviceChargeAmount: totals.serviceChargeAmount,
        serviceChargeRate: settings.serviceChargeEnabled ? settings.serviceChargeRate : 0,
        vatAmount: totals.vatAmount,
        vatRate: settings.vatEnabled ? settings.vatRate : 0,
        netTotal: totals.netTotal,
        updatedAt: Date.now(),
      };
    },
    [currentOrder, settings]
  );

  // Category selection filter
  const displayedItems = useMemo(() => {
    if (selectedCategory === 'all' || selectedCategory === 'categories') return items;
    if (selectedCategory === 'favorites') return items.filter((i) => i.isFavorite);
    return items.filter((i) => i.category_id === selectedCategory || (i as any).categoryId === selectedCategory);
  }, [items, selectedCategory]);

  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);
  const currentCategoryName =
    selectedCategory === 'all'
      ? (language === 'th' ? 'ทุกเมนู' : 'All Dishes')
      : selectedCategory === 'favorites'
      ? (language === 'th' ? 'เมนูโปรด' : 'Favorites')
      : currentCategoryObj
      ? (language === 'th' ? currentCategoryObj.name_th : currentCategoryObj.name_en)
      : undefined;

  // Category Tab Bar Actions
  const handleAddCategory = async (nameTh: string, nameEn: string, icon?: string) => {
    const newCat: MenuCategory = {
      id: `cat_${Date.now()}`,
      name_th: nameTh,
      name_en: nameEn,
      icon,
      sortOrder: categories.length + 1,
    };
    await menuRepo.addCategory(newCat);
    const updated = await menuRepo.getCategories();
    setCategories(updated);
    broadcastSync();
  };

  const handleRenameCategory = async (id: string, nameTh: string, nameEn: string) => {
    await menuRepo.updateCategory(id, { name_th: nameTh, name_en: nameEn });
    const updated = await menuRepo.getCategories();
    setCategories(updated);
    broadcastSync();
  };

  const handleDeleteCategory = async (id: string) => {
    // Move all items in this category to uncategorized so no food is lost
    const itemsInCat = items.filter((i) => i.category_id === id);
    for (const item of itemsInCat) {
      await menuRepo.updateItem(item.id, { category_id: 'uncategorized' });
    }
    await menuRepo.deleteCategory(id);
    const updatedCats = await menuRepo.getCategories();
    const updatedItems = await menuRepo.getItems();
    setCategories(updatedCats);
    setItems(updatedItems);
    if (selectedCategory === id) {
      setSelectedCategory('all');
    }
    broadcastSync();
  };

  // Item Click: Open Customizer
  const handleSelectMenuItem = (item: MenuItem) => {
    setCustomizerItem(item);
    setEditingLine(null);
  };

  const handleEditModifiers = (line: OrderLine) => {
    const originalItem = items.find((i) => i.id === line.menuItemId);
    if (originalItem) {
      setCustomizerItem(originalItem);
      setEditingLine(line);
    }
  };

  const handleConfirmItemCustomizer = (
    quantity: number,
    options: SelectedOption[],
    modifiers: string[],
    notes: string,
    existingLineId?: string
  ) => {
    if (!customizerItem) return;
    const item = customizerItem;
    sound.playAddToCart();
    const optionsTotal = options.reduce((sum, opt) => sum + opt.priceDelta, 0);
    const unitPrice = item.price + optionsTotal;

    if (existingLineId) {
      const updatedLines = currentOrder.lines.map((l) => {
        if (l.id === existingLineId) {
          return {
            ...l,
            quantity,
            selectedOptions: options,
            modifiers,
            notes,
            unitPrice,
            subtotal: unitPrice * quantity,
          };
        }
        return l;
      });
      setCurrentOrder(recalculateCurrentOrder(updatedLines));
    } else {
      const newLine: OrderLine = {
        id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        menuItemId: item.id,
        name_th: item.name_th,
        name_en: item.name_en,
        quantity,
        unitPrice,
        subtotal: unitPrice * quantity,
        selectedOptions: options,
        modifiers,
        notes,
        status: 'unsent',
      };
      setCurrentOrder(recalculateCurrentOrder([...currentOrder.lines, newLine]));
    }
    setCustomizerItem(null);
    setEditingLine(null);
  };

  // Order Lines Update
  const handleUpdateLines = (lines: OrderLine[]) => {
    sound.playTap();
    setCurrentOrder(recalculateCurrentOrder(lines));
  };

  const handleUpdateOrderType = (type: OrderType) => {
    sound.playTap();
    setCurrentOrder((prev) => ({
      ...prev,
      orderType: type,
      tableName: type === 'dine_in' ? prev.tableName : type === 'takeaway' ? 'Takeaway' : 'Delivery',
    }));
  };

  const handleApplyDiscount = (amount: number, reason?: string) => {
    sound.playTap();
    setCurrentOrder(recalculateCurrentOrder(currentOrder.lines, amount, reason));
  };

  // CONFIRM ORDER ACTION
  const handleConfirmOrder = async () => {
    sound.playNotificationChime();
    const sentLines: OrderLine[] = currentOrder.lines.map((l) => ({
      ...l,
      status: l.status === 'unsent' ? 'sent' : l.status,
    }));
    const updatedOrder = recalculateCurrentOrder(sentLines);

    if (updatedOrder.orderType === 'dine_in') {
      if (updatedOrder.tableId) {
        await orderRepo.saveOrder(updatedOrder);
        await tableRepo.updateTable(updatedOrder.tableId, {
          status: 'occupied',
          currentOrderId: updatedOrder.id,
          runningTotal: updatedOrder.netTotal,
          seatedAt: Date.now(),
        });
        setTables(await tableRepo.getTables());
        setAllOrders(await orderRepo.getOrders(100));
        setCurrentOrder(createFreshOrder('dine_in'));
        setCurrentView('tables');
        broadcastSync();
      } else {
        setShowAssignModal(true);
      }
    } else {
      await orderRepo.saveOrder(updatedOrder);
      setAllOrders(await orderRepo.getOrders(100));
      setCurrentOrder(createFreshOrder('dine_in'));
      setCurrentView('tables');
      broadcastSync();
    }
  };

  const handleSaveOrderAndNavigateToTables = async () => {
    await handleConfirmOrder();
    setCurrentView('tables');
  };

  // Hold Order
  const handleHoldOrder = async () => {
    sound.playTap();
    const held: Order = {
      ...currentOrder,
      status: 'held',
      updatedAt: Date.now(),
    };
    await orderRepo.saveOrder(held);
    setHeldOrders(await orderRepo.getHeldOrders());
    setCurrentOrder(createFreshOrder('dine_in'));
    broadcastSync();
  };

  const handleResumeOrder = (order: Order) => {
    sound.playTap();
    const resumed: Order = {
      ...order,
      status: 'open',
      updatedAt: Date.now(),
    };
    setCurrentOrder(resumed);
    setCurrentView('order');
  };

  const handleDeleteHeldOrder = async (orderId: string) => {
    sound.playTap();
    await orderRepo.deleteOrder(orderId);
    setHeldOrders(await orderRepo.getHeldOrders());
    broadcastSync();
  };

  const handleClearOrder = () => {
    setCurrentOrder(createFreshOrder(currentOrder.orderType, currentOrder.tableName, currentOrder.tableId));
  };

  // Assign Table from Modal
  const handleAssignTakeaway = async () => {
    sound.playTap();
    const nextQ = currentOrder.queueNumber || (await orderRepo.getNextDailyQueueNumber());
    const updated: Order = {
      ...currentOrder,
      orderType: 'takeaway',
      tableName: `Takeaway Q#${nextQ}`,
      queueNumber: nextQ,
      status: 'open',
      updatedAt: Date.now(),
    };
    await orderRepo.saveOrder(updated);
    setAllOrders(await orderRepo.getOrders(100));
    setShowAssignModal(false);
    setCurrentOrder(createFreshOrder('dine_in'));
    setCurrentView('tables');
    broadcastSync();
  };

  const handleAssignTable = async (table: DiningTable) => {
    sound.playTap();
    const updated: Order = {
      ...currentOrder,
      orderType: 'dine_in',
      tableId: table.id,
      tableName: table.name,
      status: 'open',
      updatedAt: Date.now(),
    };
    await orderRepo.saveOrder(updated);
    await tableRepo.updateTable(table.id, {
      status: 'occupied',
      currentOrderId: updated.id,
      runningTotal: updated.netTotal,
      seatedAt: table.seatedAt || Date.now(),
    });
    setTables(await tableRepo.getTables());
    setAllOrders(await orderRepo.getOrders(100));
    setShowAssignModal(false);
    setCurrentOrder(createFreshOrder('dine_in'));
    setCurrentView('tables');
    broadcastSync();
  };

  // Checkout & Payment
  const handleOpenCheckout = async () => {
    sound.playTap();
    if (!currentOrder.queueNumber) {
      const nextQ = await orderRepo.getNextDailyQueueNumber();
      setCurrentOrder((prev) => ({ ...prev, queueNumber: nextQ }));
    }
    setShowPaymentModal(true);
  };

  const handleCompletePayment = async (payments: PaymentRecord[]) => {
    const paidOrder: Order = {
      ...currentOrder,
      status: 'paid',
      isPaid: true,
      payments,
      closedAt: Date.now(),
      updatedAt: Date.now(),
    };

    await orderRepo.saveOrder(paidOrder);

    // Free the table
    if (paidOrder.tableId) {
      await tableRepo.updateTable(paidOrder.tableId, {
        status: 'available',
        currentOrderId: undefined,
        runningTotal: 0,
        seatedAt: undefined,
      });
    }

    setTables(await tableRepo.getTables());
    setAllOrders(await orderRepo.getOrders(100));
    setShowPaymentModal(false);

    sound.playPaymentSuccess();
    setReceiptOrder(paidOrder);
    setShowReceiptModal(true);

    setCurrentOrder(createFreshOrder('dine_in'));
    setCurrentView('tables');
    broadcastSync();
  };

  const handleStartNewOrder = () => {
    setShowReceiptModal(false);
    setReceiptOrder(null);
    setCurrentOrder(createFreshOrder('dine_in'));
    setCurrentView('tables');
  };

  // Table selection from Tables floor plan
  const handleSelectTableFromFloorPlan = async (table: DiningTable) => {
    sound.playTap();
    if (table.currentOrderId) {
      const existing = await orderRepo.getOrder(table.currentOrderId);
      if (existing) {
        setCurrentOrder(existing);
        setCurrentView('order');
        return;
      }
    }
    // New order for this table
    const fresh = createFreshOrder('dine_in', table.name, table.id);
    setCurrentOrder(fresh);
    setCurrentView('order');
  };

  const handleUpdateSettings = async (changes: Partial<AppSettings>) => {
    const updated = await settingsRepo.updateSettings(changes);
    setSettings(updated);
    broadcastSync();
  };

  const handleSaveMenuItem = async (item: MenuItem) => {
    await menuRepo.saveItem(item);
    const updated = await menuRepo.getItems();
    setItems(updated);
    setItemEditorState({ isOpen: false, item: null });
    broadcastSync();
  };

  const handleToggleFavorite = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    await menuRepo.updateItem(itemId, { isFavorite: !item.isFavorite });
    setItems(await menuRepo.getItems());
    broadcastSync();
  };

  // Role authorization enforcement
  let activeView = currentView;
  if (currentUser.role === 'waiter' && !['tables', 'order'].includes(activeView)) {
    activeView = 'tables';
  } else if (currentUser.role === 'cashier' && !['tables', 'order', 'orders'].includes(activeView)) {
    activeView = 'tables';
  }

  // Count active tables
  const openBillsCount = tables.filter((t) => t.status === 'occupied' || t.status === 'billed').length;

  const currentViewTitle =
    activeView === 'tables'
      ? (language === 'th' ? 'ผังโต๊ะอาหาร (Floor Plan)' : 'Floor Plan & Tables')
      : activeView === 'order'
      ? (language === 'th' ? 'สั่งอาหาร (POS Order)' : 'POS Order Taking')
      : activeView === 'orders'
      ? (language === 'th' ? 'ประวัติบิล (Bills & History)' : 'Bills & History')
      : activeView === 'dashboard'
      ? (language === 'th' ? 'ภาพรวมร้าน (Dashboard)' : 'Dashboard')
      : activeView === 'menu'
      ? (language === 'th' ? 'จัดการเมนู (Menu Management)' : 'Menu Management')
      : activeView === 'customers'
      ? (language === 'th' ? 'ลูกค้าสมาชิก (Customers)' : 'Customers')
      : activeView === 'promotions'
      ? (language === 'th' ? 'โปรโมชั่น (Promotions)' : 'Promotions')
      : activeView === 'reports'
      ? (language === 'th' ? 'รายงานยอดขาย (Sales Reports)' : 'Sales Reports')
      : (language === 'th' ? 'ตั้งค่าระบบ (Settings)' : 'Settings');

  return (
    <div className="flex flex-col h-dvh w-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header Bar */}
      <Header
        settings={settings}
        currentUser={currentUser}
        currentTitle={currentViewTitle}
        notifications={notifications}
        isDarkMode={isDarkMode}
        onOpenDrawer={() => setIsNavOpen(true)}
        onSwitchUser={handleSwitchUser}
        onToggleDarkMode={toggleDarkMode}
        onClearNotifications={() => setNotifications([])}
        onSimulateCallWaiter={() => {
          addNotification('call_waiter', 'โต๊ะ T2 เรียกพนักงาน', 'Table T2 called waiter');
        }}
        onSimulateRequestBill={() => {
          addNotification('request_bill', 'โต๊ะ T3 ขอเช็คบิล', 'Table T3 requested bill');
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative pb-[62px]">
        <main className="flex-1 flex overflow-hidden bg-white dark:bg-slate-900">
          {/* 1. TABLES FLOOR PLAN VIEW */}
          {activeView === 'tables' && (
            <TablesView
              tables={tables}
              orders={allOrders}
              onSelectTable={handleSelectTableFromFloorPlan}
              onRefreshTables={reloadAllData}
            />
          )}

          {/* 2. POS ORDER TAKING VIEW */}
          {activeView === 'order' && (
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
              {/* Left / Middle: Food Items Grid */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {selectedCategory === 'categories' ? (
                  <CategoryTileGrid
                    categories={categories}
                    items={items}
                    onSelectCategory={(catId) => setSelectedCategory(catId)}
                    onViewAllItems={() => setSelectedCategory('all')}
                    onViewFavorites={() => setSelectedCategory('favorites')}
                  />
                ) : (
                  <MenuItemGrid
                    items={displayedItems}
                    categoryName={currentCategoryName}
                    onSelectItem={handleSelectMenuItem}
                    onToggleFavorite={handleToggleFavorite}
                  />
                )}
              </div>

              {/* Right: Order Cart & Bill Panel */}
              <div className="w-full md:w-96 lg:w-[420px] h-full shrink-0">
                <OrderPanel
                  order={currentOrder}
                  settings={settings}
                  heldOrdersCount={heldOrders.length}
                  onUpdateLines={handleUpdateLines}
                  onUpdateOrderType={handleUpdateOrderType}
                  onConfirmOrder={handleConfirmOrder}
                  onSaveOrderAndNavigateToTables={handleSaveOrderAndNavigateToTables}
                  onHoldOrder={handleHoldOrder}
                  onOpenHeldOrders={() => setShowHeldOrdersModal(true)}
                  onClearOrder={handleClearOrder}
                  onEditModifiers={handleEditModifiers}
                  onCheckout={handleOpenCheckout}
                  onApplyDiscount={handleApplyDiscount}
                />
              </div>
            </div>
          )}

          {/* 3. ORDERS & BILLS VIEW */}
          {activeView === 'orders' && (
            <OrdersHistoryView
              orders={allOrders}
              onViewReceipt={(ord: Order) => {
                setReceiptOrder(ord);
                setShowReceiptModal(true);
              }}
              onVoidOrder={async (orderId) => {
                await orderRepo.deleteOrder(orderId);
                reloadAllData();
              }}
            />
          )}

          {/* 4. DASHBOARD VIEW */}
          {activeView === 'dashboard' && (
            <DashboardView
              orders={allOrders}
              tables={tables}
              onNavigateToTables={() => setCurrentView('tables')}
              onNavigateToPOS={() => setCurrentView('order')}
              onNavigateToReports={() => setCurrentView('reports')}
            />
          )}

          {/* 5. MENU MANAGEMENT VIEW */}
          {activeView === 'menu' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">
                  {language === 'th' ? 'จัดการรายการอาหารและเครื่องดื่ม' : 'Menu Items & Categories'}
                </h2>
                <button
                  onClick={() => setItemEditorState({ isOpen: true, item: null })}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  + {language === 'th' ? 'เพิ่มเมนูใหม่' : 'Add Item'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <MenuItemGrid
                  items={items}
                  onSelectItem={(item) => setItemEditorState({ isOpen: true, item })}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            </div>
          )}

          {/* 6. CUSTOMERS VIEW */}
          {activeView === 'customers' && (
            <CustomersView
              customers={customers}
              onAddCustomer={async (c) => {
                await customerRepo.addCustomer(c);
                reloadAllData();
              }}
            />
          )}

          {/* 7. PROMOTIONS VIEW */}
          {activeView === 'promotions' && <PromotionsView />}

          {/* 8. REPORTS VIEW */}
          {activeView === 'reports' && (
            <ReportsView
              orders={allOrders}
            />
          )}

          {/* 9. SETTINGS VIEW */}
          {activeView === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onReloadAllData={reloadAllData}
              initialTab={settingsTab}
            />
          )}
        </main>
      </div>

      {/* PERMANENT FIXED BOTTOM CATEGORY & BILL BAR */}
      <CategoryTabBar
        categories={categories}
        selectedCategory={selectedCategory}
        openBillsCount={openBillsCount}
        activeTableTotal={currentOrder.netTotal}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          setCurrentView('order');
        }}
        onSelectBill={() => {
          setSelectedCategory('categories');
          setCurrentView('tables');
        }}
        onAddCategory={handleAddCategory}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Navigation Slide-over Drawer */}
      <NavigationDrawer
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        currentView={activeView}
        currentUser={currentUser}
        onSelectView={(view) => {
          setCurrentView(view);
          if (view === 'order') {
            setSelectedCategory('categories');
          }
        }}
        onSelectCategoryShortcut={(shortcutKey) => {
          setSelectedCategory(shortcutKey);
          setCurrentView('order');
        }}
        settings={settings}
      />

      {/* Cash Drawer Modal */}
      <CashDrawerModal
        isOpen={isCashDrawerOpen}
        onClose={() => setIsCashDrawerOpen(false)}
      />

      {/* Customer Display Control & QR Upload Modal */}
      <CustomerDisplayControlModal
        isOpen={isCustomerDisplayControlOpen}
        onClose={() => setIsCustomerDisplayControlOpen(false)}
        settings={settings}
        currentOrder={currentOrder}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Assign Table or Takeaway Modal */}
      <AssignTableModal
        isOpen={showAssignModal}
        tables={tables}
        currentTableId={currentOrder.tableId}
        currentOrderType={currentOrder.orderType}
        onClose={() => setShowAssignModal(false)}
        onAssignTakeaway={handleAssignTakeaway}
        onAssignTable={handleAssignTable}
        onHoldOnly={handleHoldOrder}
      />

      {/* Item Customizer Modal Sheet */}
      {customizerItem && (
        <ItemCustomizerModal
          item={customizerItem}
          existingLine={editingLine || undefined}
          quickModifiers={settings.quickModifiers}
          currency={settings.currency || '฿'}
          onClose={() => {
            setCustomizerItem(null);
            setEditingLine(null);
          }}
          onConfirm={(qty, opts, mods, nts) =>
            handleConfirmItemCustomizer(qty, opts, mods, nts, editingLine?.id)
          }
        />
      )}

      {/* Held / Parked Orders Modal */}
      {showHeldOrdersModal && (
        <HeldOrdersModal
          heldOrders={heldOrders}
          onClose={() => setShowHeldOrdersModal(false)}
          onResumeOrder={handleResumeOrder}
          onDeleteHeldOrder={handleDeleteHeldOrder}
        />
      )}

      {/* Payment / Checkout Modal */}
      {showPaymentModal && (
        <PaymentModal
          order={currentOrder}
          settings={settings}
          onClose={() => setShowPaymentModal(false)}
          onCompletePayment={handleCompletePayment}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* On-screen & Printable Receipt Modal */}
      {showReceiptModal && receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          settings={settings}
          onClose={() => setShowReceiptModal(false)}
          onNewOrder={handleStartNewOrder}
        />
      )}

      {/* Menu Item Editor Modal */}
      {itemEditorState.isOpen && (
        <MenuItemEditorModal
          item={itemEditorState.item}
          categories={categories}
          defaultCategoryId={
            selectedCategory !== 'all' &&
            selectedCategory !== 'favorites' &&
            selectedCategory !== 'categories'
              ? selectedCategory
              : undefined
          }
          onClose={() => setItemEditorState({ isOpen: false, item: null })}
          onSave={handleSaveMenuItem}
        />
      )}
    </div>
  );
}
