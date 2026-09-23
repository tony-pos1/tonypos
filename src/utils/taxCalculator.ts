import { AppSettings, OrderLine } from '../types';

export interface TaxCalculationResult {
  subtotal: number;
  discountAmount: number;
  serviceChargeRate: number;
  serviceChargeAmount: number;
  vatRate: number;
  vatAmount: number;
  netTotal: number;
  priceIncludeTax: boolean;
}

export function calculateOrderTotals(
  lines: OrderLine[],
  settings: AppSettings,
  discountAmount: number = 0
): TaxCalculationResult {
  // Sum active lines (ignore voided)
  const activeLines = lines.filter((l) => l.status !== 'voided');
  const subtotal = activeLines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );

  const appliedDiscount = Math.min(subtotal, Math.max(0, discountAmount));
  const afterDiscount = Math.max(0, subtotal - appliedDiscount);

  const scRate = settings.serviceChargeEnabled ? settings.serviceChargeRate : 0;
  const vatRate = settings.vatEnabled ? settings.vatRate : 0;

  let serviceChargeAmount = 0;
  let vatAmount = 0;
  let netTotal = afterDiscount;

  if (settings.priceIncludeTax) {
    // Mode: Prices in menu already include VAT
    if (vatRate > 0) {
      // Back-calculate: e.g. 107 -> base 100, VAT 7
      const preTaxAmount = afterDiscount / (1 + vatRate / 100);
      vatAmount = Math.round((afterDiscount - preTaxAmount) * 100) / 100;
    }

    if (scRate > 0) {
      // Service charge added
      serviceChargeAmount = Math.round(afterDiscount * (scRate / 100) * 100) / 100;
      netTotal = afterDiscount + serviceChargeAmount;
    } else {
      netTotal = afterDiscount;
    }
  } else {
    // Mode: Prices exclude tax and service charge (added on top)
    if (scRate > 0) {
      serviceChargeAmount = Math.round(afterDiscount * (scRate / 100) * 100) / 100;
    }
    const taxableTotal = afterDiscount + serviceChargeAmount;
    if (vatRate > 0) {
      vatAmount = Math.round(taxableTotal * (vatRate / 100) * 100) / 100;
    }
    netTotal = Math.round((taxableTotal + vatAmount) * 100) / 100;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(appliedDiscount * 100) / 100,
    serviceChargeRate: scRate,
    serviceChargeAmount: Math.round(serviceChargeAmount * 100) / 100,
    vatRate: vatRate,
    vatAmount: Math.round(vatAmount * 100) / 100,
    netTotal: Math.round(netTotal * 100) / 100,
    priceIncludeTax: settings.priceIncludeTax,
  };
}
