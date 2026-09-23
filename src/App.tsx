import React, { useState, useEffect, useCallback } from 'react';
import {
  AppSettings,
  Customer,
  DiningTable,
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
import { defaultSettings } from './db/seedData';

// Layout components
import { Header } from './components/layout/Header';
import { NavigationDrawer, NavView } from './components/layout/NavigationDrawer';
import { CashDrawerModal } from './components/layout/CashDrawerModal';
import { BackupWarningBanner } from './components/common/BackupWarningBanner';

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

// Other view components
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

  // Core Data State
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [heldOrders, setHeldOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Navigation Drawer & Modals State
  const [currentView, setCurrentView] = useState<NavView>('order');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isCustomerDisplayControlOpen, setIsCustomerDisplayControlOpen] = useState(false);
  const [isCustomerDisplayConnected, setIsCustomerDisplayConnected] = useState(false);

  // Category State - starts at 'categories' screen for Quick Order Flow
  const [selectedCategory, setSelectedCategory] = useState<string>('categories');
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);

  // Active Working Order State
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

  // Dual Screen / CFD: Monitor customer display connection heartbeat
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

  // Dual Screen / CFD: Broadcast order & settings state to Screen 2 in real time
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

  // Recalculate totals whenever lines, discount or settings change
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

  // Category selection items filter
  const displayedItems = React.useMemo(() => {
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

  // CATEGORY TAB ACTIONS
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
  };

  const handleRenameCategory = async (id: string, nameTh: string, nameEn: string) => {
    await menuRepo.updateCategory(id, { name_th: nameTh, name_en: nameEn });
    const updated = await menuRepo.getCategories();
    setCategories(updated);
  };

  const handleDeleteCategory = async (id: string) => {
    await menuRepo.deleteCategory(id);
    const updated = await menuRepo.getCategories();
    setCategories(updated);
    if (selectedCategory === id) {
      setSelectedCategory('categories');
    }
  };

  const handleReorderCategory = async (id: string, direction: 'left' | 'right') => {
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCats = [...categories];
    const [moved] = newCats.splice(index, 1);
    newCats.splice(targetIndex, 0, moved);
    setCategories(newCats);
    await menuRepo.reorderCategories(newCats.map((c) => c.id));
  };

  // MENU ITEM ACTIONS
  const handleToggleFavorite = async (itemId: string) => {
    await menuRepo.toggleItemFavorite(itemId);
    setItems(await menuRepo.getItems());
  };

  const handleToggleAvailability = async (itemId: string) => {
    await menuRepo.toggleItemAvailability(itemId);
    setItems(await menuRepo.getItems());
  };

  const handleDuplicateItem = async (itemId: string) => {
    sound.playTap();
    await menuRepo.duplicateItem(itemId);
    setItems(await menuRepo.getItems());
  };

  const handleDeleteItem = async (itemId: string) => {
    sound.playTap();
    await menuRepo.deleteItem(itemId);
    setItems(await menuRepo.getItems());
  };

  const handleSaveMenuItem = async (itemData: MenuItem) => {
    const exists = items.some((i) => i.id === itemData.id);
    if (exists) {
      await menuRepo.updateItem(itemData.id, itemData);
    } else {
      await menuRepo.addItem(itemData);
    }
    setItems(await menuRepo.getItems());
  };

  // ORDER ACTIONS: Adding / Updating lines
  const handleConfirmItemCustomizer = (
    quantity: number,
    selectedOptions: SelectedOption[],
    modifiers: string[],
    notes: string
  ) => {
    if (!customizerItem) return;

    // Calculate unit price = base + price deltas
    const optionsDelta = selectedOptions.reduce((sum, o) => sum + (o.priceDelta || 0), 0);
    const unitPrice = customizerItem.price + optionsDelta;

    if (editingLine) {
      // Update existing line
      const updatedLines = currentOrder.lines.map((l) => {
        if (l.id === editingLine.id) {
          return {
            ...l,
            quantity,
            selectedOptions,
            modifiers,
            notes,
            unitPrice,
          };
        }
        return l;
      });
      setCurrentOrder(recalculateCurrentOrder(updatedLines));
      setEditingLine(null);
    } else {
      // Add new line
      const newLine: OrderLine = {
        id: `line_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        menuItemId: customizerItem.id,
        name_th: customizerItem.name_th,
        name_en: customizerItem.name_en,
        basePrice: customizerItem.price,
        unitPrice,
        cost: customizerItem.cost,
        quantity,
        selectedOptions,
        modifiers,
        notes,
        status: 'unsent',
        round: currentOrder.lines.length > 0 ? Math.max(...currentOrder.lines.map((l) => l.round || 1)) : 1,
      };

      const updatedLines = [...currentOrder.lines, newLine];
      setCurrentOrder(recalculateCurrentOrder(updatedLines));
    }

    setCustomizerItem(null);
  };

  // ORDER ACTIONS: Send to Kitchen
  const handleSendToKitchen = async () => {
    sound.playNotificationChime();
    const updatedLines = currentOrder.lines.map((line) => {
      if (line.status === 'unsent') {
        return {
          ...line,
          status: 'sent' as const,
          sentAt: Date.now(),
        };
      }
      return line;
    });

    const nextOrder: Order = {
      ...currentOrder,
      lines: updatedLines,
      updatedAt: Date.now(),
    };

    setCurrentOrder(nextOrder);
    await orderRepo.saveOrder(nextOrder);

    // If table assigned, mark table as occupied
    if (nextOrder.tableId) {
      await tableRepo.updateTable(nextOrder.tableId, {
        status: 'occupied',
        currentOrderId: nextOrder.id,
        runningTotal: nextOrder.netTotal,
        seatedAt: Date.now(),
      });
      setTables(await tableRepo.getTables());
    }
  };

  // ORDER ACTIONS: Hold / Park Order
  const handleHoldOrder = async () => {
    if (currentOrder.lines.length === 0) return;

    sound.playTap();
    const held: Order = {
      ...currentOrder,
      status: 'held',
      updatedAt: Date.now(),
    };

    await orderRepo.saveOrder(held);
    setHeldOrders(await orderRepo.getHeldOrders());
    setCurrentOrder(createFreshOrder(settings.serviceMode === 'fine_dining' ? 'dine_in' : 'takeaway'));
  };

  // ASSIGN TABLE OR TAKEAWAY (from Save Button)
  const handleAssignTakeaway = async () => {
    sound.playTap();
    const nextQ = currentOrder.queueNumber || (await orderRepo.getNextDailyQueueNumber());
    const updated: Order = {
      ...currentOrder,
      orderType: 'takeaway',
      tableName: `Takeaway Q#${nextQ}`,
      queueNumber: nextQ,
      status: 'held',
      updatedAt: Date.now(),
    };
    await orderRepo.saveOrder(updated);
    setHeldOrders(await orderRepo.getHeldOrders());
    setAllOrders(await orderRepo.getOrders(100));
    setShowAssignModal(false);
    setCurrentOrder(createFreshOrder(settings.serviceMode === 'fine_dining' ? 'dine_in' : 'takeaway'));
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
    setCurrentOrder(createFreshOrder(settings.serviceMode === 'fine_dining' ? 'dine_in' : 'takeaway'));
  };

  const handleHoldOrderAndCloseModal = async () => {
    await handleHoldOrder();
    setShowAssignModal(false);
  };

  // ORDER ACTIONS: Resume Order
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
  };

  // ORDER ACTIONS: Clear Order
  const handleClearOrder = () => {
    setCurrentOrder(createFreshOrder(currentOrder.orderType, currentOrder.tableName, currentOrder.tableId));
  };

  // CHECKOUT & PAYMENT FLOW
  const handleOpenCheckout = async () => {
    sound.playTap();
    // In Quick Service, generate daily queue number if not already assigned
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
      payments,
      closedAt: Date.now(),
      updatedAt: Date.now(),
    };

    await orderRepo.saveOrder(paidOrder);

    // Release table if occupied
    if (paidOrder.tableId) {
      await tableRepo.updateTable(paidOrder.tableId, {
        status: 'available',
        currentOrderId: undefined,
        runningTotal: 0,
        seatedAt: undefined,
      });
      setTables(await tableRepo.getTables());
    }

    // Update orders list & active views
    setAllOrders(await orderRepo.getOrders(100));
    setShowPaymentModal(false);
    setReceiptOrder(paidOrder);
    setShowReceiptModal(true);

    // Broadcast celebration / change to customer display
    const totalChange = payments.reduce((sum, p) => sum + (p.changeAmount || 0), 0);
    customerDisplaySync.sendState({
      order: null,
      settings,
      isPaymentOpen: false,
      paymentMethod: payments[0]?.method || 'promptpay',
      isPaidSuccess: true,
      paidOrder,
      changeDue: totalChange > 0 ? totalChange : undefined,
      customQrImageUrl: settings.customPromptPayQrImage,
      timestamp: Date.now(),
    });
  };

  const handleStartNewOrder = () => {
    setShowReceiptModal(false);
    setReceiptOrder(null);
    const nextOrder = createFreshOrder(settings.serviceMode === 'fine_dining' ? 'dine_in' : 'takeaway');
    setCurrentOrder(nextOrder);
    setCurrentView('order');
    setSelectedCategory('categories');

    // Reset customer display to new order
    customerDisplaySync.sendState({
      order: nextOrder,
      settings,
      isPaymentOpen: false,
      paymentMethod: 'promptpay',
      isPaidSuccess: false,
      paidOrder: null,
      customQrImageUrl: settings.customPromptPayQrImage,
      timestamp: Date.now(),
    });
  };

  // TABLE SELECTION (from Floor Plan)
  const handleSelectTable = (table: DiningTable) => {
    sound.playTap();
    if (table.currentOrderId) {
      // Find order
      const existing = allOrders.find((o) => o.id === table.currentOrderId);
      if (existing) {
        setCurrentOrder(existing);
        setCurrentView('order');
        return;
      }
    }

    // Start fresh order for this table
    const orderForTable = createFreshOrder('dine_in', table.name, table.id);
    setCurrentOrder(orderForTable);
    setCurrentView('order');
    setSelectedCategory('categories');
  };

  // SETTINGS UPDATE
  const handleUpdateSettings = async (changes: Partial<AppSettings>) => {
    const updated = await settingsRepo.updateSettings(changes);
    setSettings(updated);
  };

  // Current view title for header
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'order':
        return language === 'th' ? 'สั่งอาหาร (Quick Order)' : 'Quick Order';
      case 'tables':
        return language === 'th' ? 'ผังโต๊ะอาหาร (Floor Plan)' : 'Floor Plan';
      case 'orders':
        return language === 'th' ? 'ประวัติบิล (Orders & Bills)' : 'Orders & Bills';
      case 'menu':
        return language === 'th' ? 'จัดการเมนู (Menu Manager)' : 'Menu Manager';
      case 'customers':
        return language === 'th' ? 'ลูกค้าสมาชิก (CRM)' : 'Customers';
      case 'promotions':
        return language === 'th' ? 'โปรโมชั่น & ส่วนลด' : 'Promotions';
      case 'reports':
        return language === 'th' ? 'รายงานการขาย (Reports)' : 'Sales Reports';
      case 'settings':
        return language === 'th' ? 'ตั้งค่าระบบ (Settings)' : 'System Settings';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 text-slate-900 overflow-hidden font-sans select-none">
      {/* 7-day Backup Warning Banner */}
      <BackupWarningBanner
        needsBackup={needsBackup}
        onDismiss={dismissWarning}
        onBackupCompleted={refreshBackupStatus}
      />

      {/* Top Application Header */}
      <Header
        settings={settings}
        currentTitle={getHeaderTitle()}
        onOpenDrawer={() => setIsNavOpen(true)}
        onOpenCashDrawer={() => setIsCashDrawerOpen(true)}
        onOpenCustomerDisplayModal={() => setIsCustomerDisplayControlOpen(true)}
        isCustomerDisplayConnected={isCustomerDisplayConnected}
      />

      {/* Main Workspace Area (Full-width responsive view) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Dynamic Main View */}
        <main className="flex-1 flex overflow-hidden relative w-full">
          {/* VIEW 1: ORDER SCREEN (Categories First / Menu Items Grid + Category Tab Bar + Current Order Panel) */}
          {currentView === 'order' && (
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden w-full">
              {/* Left Column: Category First Tile Grid OR Menu Items Grid */}
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
                    isEditMode={isCategoryEditMode}
                    categoryName={currentCategoryName}
                    onBackToCategories={() => setSelectedCategory('categories')}
                    onSelectItem={(item) => {
                      setCustomizerItem(item);
                      setEditingLine(null);
                    }}
                    onToggleFavorite={handleToggleFavorite}
                    onToggleAvailability={handleToggleAvailability}
                    onAddItem={() =>
                      setItemEditorState({ isOpen: true, item: null })
                    }
                    onEditItem={(item) =>
                      setItemEditorState({ isOpen: true, item })
                    }
                    onDuplicateItem={handleDuplicateItem}
                    onDeleteItem={handleDeleteItem}
                  />
                )}

                {/* Bottom Category Tab Bar */}
                <CategoryTabBar
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  isEditMode={isCategoryEditMode}
                  onToggleEditMode={() => setIsCategoryEditMode(!isCategoryEditMode)}
                  onAddCategory={handleAddCategory}
                  onRenameCategory={handleRenameCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onReorderCategory={handleReorderCategory}
                />
              </div>

              {/* Right Column: Order Lines Panel with Drag & Drop & Arrows */}
              <OrderPanel
                order={currentOrder}
                settings={settings}
                heldOrdersCount={heldOrders.length}
                onUpdateLines={(lines) => setCurrentOrder(recalculateCurrentOrder(lines))}
                onUpdateOrderType={(type) => setCurrentOrder((prev) => ({ ...prev, orderType: type }))}
                onSendToKitchen={handleSendToKitchen}
                onHoldOrder={handleHoldOrder}
                onSaveOrder={() => setShowAssignModal(true)}
                onOpenHeldOrders={() => setShowHeldOrdersModal(true)}
                onClearOrder={handleClearOrder}
                onEditModifiers={(line) => {
                  const item = items.find((i) => i.id === line.menuItemId);
                  if (item) {
                    setCustomizerItem(item);
                    setEditingLine(line);
                  }
                }}
                onCheckout={handleOpenCheckout}
                onApplyDiscount={(amount, reason) => {
                  setCurrentOrder(recalculateCurrentOrder(currentOrder.lines, amount, reason));
                }}
              />
            </div>
          )}

          {/* VIEW 2: TABLES FLOOR PLAN */}
          {currentView === 'tables' && (
            <TablesView
              tables={tables}
              orders={allOrders}
              onSelectTable={handleSelectTable}
              onRefreshTables={async () => {
                setTables(await tableRepo.getTables());
              }}
            />
          )}

          {/* VIEW 3: ORDERS HISTORY */}
          {currentView === 'orders' && (
            <OrdersHistoryView
              orders={allOrders}
              onViewReceipt={(order) => {
                setReceiptOrder(order);
                setShowReceiptModal(true);
              }}
              onVoidOrder={async (orderId) => {
                await orderRepo.updateOrderStatus(orderId, 'voided');
                setAllOrders(await orderRepo.getOrders(100));
              }}
            />
          )}

          {/* VIEW 4: MENU MANAGER */}
          {currentView === 'menu' && (
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden w-full">
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <MenuItemGrid
                  items={displayedItems}
                  isEditMode={true}
                  categoryName={currentCategoryName}
                  onBackToCategories={() => setSelectedCategory('categories')}
                  onSelectItem={(item) => {
                    setItemEditorState({ isOpen: true, item });
                  }}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleAvailability={handleToggleAvailability}
                  onAddItem={() =>
                    setItemEditorState({ isOpen: true, item: null })
                  }
                  onEditItem={(item) =>
                    setItemEditorState({ isOpen: true, item })
                  }
                  onDuplicateItem={handleDuplicateItem}
                  onDeleteItem={handleDeleteItem}
                />
                <CategoryTabBar
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  isEditMode={true}
                  onToggleEditMode={() => {}}
                  onAddCategory={handleAddCategory}
                  onRenameCategory={handleRenameCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onReorderCategory={handleReorderCategory}
                />
              </div>
            </div>
          )}

          {/* VIEW 5: CUSTOMERS (CRM & Points) */}
          {currentView === 'customers' && (
            <CustomersView
              customers={customers}
              onAddCustomer={async (c) => {
                await customerRepo.addCustomer(c);
                setCustomers(await customerRepo.getCustomers());
              }}
            />
          )}

          {/* VIEW 6: PROMOTIONS */}
          {currentView === 'promotions' && <PromotionsView />}

          {/* VIEW 7: REPORTS */}
          {currentView === 'reports' && <ReportsView orders={allOrders} />}

          {/* VIEW 8: SETTINGS */}
          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onReloadAllData={reloadAllData}
            />
          )}
        </main>
      </div>

      {/* Navigation Slide-over Drawer */}
      <NavigationDrawer
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        currentView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
          if (view === 'order') {
            setSelectedCategory('categories');
          }
        }}
        settings={settings}
        onOpenCustomerDisplayModal={() => setIsCustomerDisplayControlOpen(true)}
      />

      {/* Cash Drawer Kick & Manual Audit Modal */}
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

      {/* Assign Table or Takeaway Modal (Triggered by Save button) */}
      <AssignTableModal
        isOpen={showAssignModal}
        tables={tables}
        currentTableId={currentOrder.tableId}
        currentOrderType={currentOrder.orderType}
        onClose={() => setShowAssignModal(false)}
        onAssignTakeaway={handleAssignTakeaway}
        onAssignTable={handleAssignTable}
        onHoldOnly={handleHoldOrderAndCloseModal}
      />

      {/* Item Customizer Modal Sheet (Options, Modifiers, Notes) */}
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
          onConfirm={handleConfirmItemCustomizer}
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

      {/* Payment / Checkout Modal (Cash, PromptPay QR, Card, Wallet) */}
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

      {/* Menu Item Editor Modal (Add/Edit) */}
      {itemEditorState.isOpen && (
        <MenuItemEditorModal
          item={itemEditorState.item}
          categories={categories}
          defaultCategoryId={selectedCategory !== 'all' && selectedCategory !== 'favorites' && selectedCategory !== 'categories' ? selectedCategory : undefined}
          onClose={() => setItemEditorState({ isOpen: false, item: null })}
          onSave={handleSaveMenuItem}
        />
      )}
    </div>
  );
}
