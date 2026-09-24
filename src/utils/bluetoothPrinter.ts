import { Order, AppSettings } from '../types';

export interface PrinterStatus {
  isConnected: boolean;
  deviceName: string | null;
  connectionType: 'bluetooth' | 'serial' | 'none';
  error: string | null;
}

type StatusListener = (status: PrinterStatus) => void;

// Common BLE GATT Service UUIDs for thermal receipt printers
const PRINTER_BLE_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard ESC/POS
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Rongta, Xprinter, PT-210
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent UART
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / CC2541 BLE module
  '0000fff0-0000-1000-8000-00805f9b34fb', // Generic BLE serial
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000fee7-0000-1000-8000-00805f9b34fb', // WeChat / Tencent printer
];

/**
 * Load an image from data URL or remote path into an HTMLImageElement for canvas rendering
 */
function loadImage(src?: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn('Could not load image for receipt printing');
      resolve(null);
    };
    img.src = src;
  });
}

class BluetoothPrinterService {
  private bluetoothDevice: any = null;
  private writeCharacteristic: any = null;
  private serialPort: any = null;
  private serialWriter: any = null;

  private currentStatus: PrinterStatus = {
    isConnected: false,
    deviceName: null,
    connectionType: 'none',
    error: null,
  };

  private listeners: Set<StatusListener> = new Set();

  constructor() {
    // Restore previous connected printer name from localStorage if available
    const savedName = localStorage.getItem('pos_printer_device_name');
    const savedType = localStorage.getItem('pos_printer_type') as 'bluetooth' | 'serial' | null;
    if (savedName && savedType) {
      this.currentStatus.deviceName = savedName;
      this.currentStatus.connectionType = savedType;
    }
  }

  public subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentStatus));
  }

  public getStatus(): PrinterStatus {
    return { ...this.currentStatus };
  }

  public isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public isSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  /**
   * Request and connect to Bluetooth ESC/POS Thermal Printer via Web Bluetooth
   */
  public async connectBluetooth(): Promise<boolean> {
    if (!this.isBluetoothSupported()) {
      const msg = 'อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับ Web Bluetooth (แนะนำให้ใช้ Google Chrome บน Android หรือ Windows/Mac)';
      this.currentStatus.error = msg;
      this.notify();
      throw new Error(msg);
    }

    try {
      this.currentStatus.error = null;
      this.notify();

      // Prompt user to select Bluetooth device
      const nav: any = navigator;
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_BLE_SERVICES,
      });

      if (!device) {
        throw new Error('ไม่ได้เลือกเครื่องพิมพ์บลูทูธ');
      }

      this.bluetoothDevice = device;

      device.addEventListener('gattserverdisconnected', () => {
        this.handleDisconnected();
      });

      // Connect to GATT Server
      const server = await device.gatt.connect();

      // Find writable characteristic in known services
      let foundCharacteristic: any = null;

      for (const serviceUuid of PRINTER_BLE_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics = await service.getCharacteristics();

          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              foundCharacteristic = char;
              break;
            }
          }
        } catch {
          // Continue to next service
        }

        if (foundCharacteristic) break;
      }

      // If not in known services, scan all services
      if (!foundCharacteristic) {
        try {
          const services = await server.getPrimaryServices();
          for (const service of services) {
            try {
              const characteristics = await service.getCharacteristics();
              for (const char of characteristics) {
                if (char.properties.write || char.properties.writeWithoutResponse) {
                  foundCharacteristic = char;
                  break;
                }
              }
            } catch {
              // Ignore
            }
            if (foundCharacteristic) break;
          }
        } catch {
          // Ignore
        }
      }

      if (!foundCharacteristic) {
        throw new Error('เชื่อมต่อบลูทูธได้แล้ว แต่ไม่พบลักษณะการส่งข้อมูล (Write Characteristic) ของเครื่องพิมพ์');
      }

      this.writeCharacteristic = foundCharacteristic;
      this.currentStatus = {
        isConnected: true,
        deviceName: device.name || 'Bluetooth Thermal Printer',
        connectionType: 'bluetooth',
        error: null,
      };

      localStorage.setItem('pos_printer_device_name', this.currentStatus.deviceName || '');
      localStorage.setItem('pos_printer_type', 'bluetooth');
      this.notify();

      return true;
    } catch (err: any) {
      console.error('Bluetooth connection failed:', err);
      this.currentStatus.error = err.message || 'ไม่สามารถเชื่อมต่อเครื่องพิมพ์บลูทูธได้';
      this.notify();
      throw err;
    }
  }

  /**
   * Connect to built-in POS internal printer via Web Serial API (COM Port / USB)
   */
  public async connectSerial(baudRate = 9600): Promise<boolean> {
    if (!this.isSerialSupported()) {
      const msg = 'อุปกรณ์นี้ไม่รองรับ Web Serial API (สำหรับเครื่องพิมพ์ที่ต่อผ่านสาย USB/COM port ภายในเครื่อง POS)';
      this.currentStatus.error = msg;
      this.notify();
      throw new Error(msg);
    }

    try {
      const nav: any = navigator;
      const port = await nav.serial.requestPort();
      await port.open({ baudRate });

      this.serialPort = port;
      this.serialWriter = port.writable.getWriter();

      this.currentStatus = {
        isConnected: true,
        deviceName: 'POS Internal Serial/USB Printer',
        connectionType: 'serial',
        error: null,
      };

      localStorage.setItem('pos_printer_device_name', this.currentStatus.deviceName || '');
      localStorage.setItem('pos_printer_type', 'serial');
      this.notify();

      return true;
    } catch (err: any) {
      console.error('Serial connection failed:', err);
      this.currentStatus.error = err.message || 'ไม่สามารถเชื่อมต่อพอร์ตเครื่องพิมพ์ได้';
      this.notify();
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.bluetoothDevice && this.bluetoothDevice.gatt?.connected) {
        this.bluetoothDevice.gatt.disconnect();
      }
      if (this.serialWriter) {
        await this.serialWriter.close();
        this.serialWriter = null;
      }
      if (this.serialPort) {
        await this.serialPort.close();
        this.serialPort = null;
      }
    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      this.handleDisconnected();
    }
  }

  private handleDisconnected() {
    this.writeCharacteristic = null;
    this.currentStatus = {
      isConnected: false,
      deviceName: this.currentStatus.deviceName,
      connectionType: 'none',
      error: null,
    };
    this.notify();
  }

  /**
   * Send raw byte buffer to printer in safe chunks (prevent BLE buffer overflow)
   */
  public async sendRaw(data: Uint8Array): Promise<void> {
    if (this.currentStatus.connectionType === 'bluetooth' && this.writeCharacteristic) {
      const CHUNK_SIZE = 100; // 100 bytes per chunk is safe across all BLE chipsets
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        if (this.writeCharacteristic.writeValueWithoutResponse) {
          await this.writeCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.writeCharacteristic.writeValue(chunk);
        }
        // Small delay to allow printer microcontroller to process buffer
        await new Promise((r) => setTimeout(r, 15));
      }
      return;
    }

    if (this.currentStatus.connectionType === 'serial' && this.serialWriter) {
      await this.serialWriter.write(data);
      return;
    }

    throw new Error('ยังไม่ได้เชื่อมต่อเครื่องพิมพ์บลูทูธหรือ Serial');
  }

  /**
   * Render receipt canvas to 1-bit ESC/POS monochrome bitmap
   * (Ensures 100% perfect Thai vowels, tone marks, and formatting on any thermal printer)
   */
  public canvasToEscPosRaster(canvas: HTMLCanvasElement): Uint8Array {
    const ctx = canvas.getContext('2d');
    if (!ctx) return new Uint8Array();

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    const widthBytes = Math.ceil(width / 8);
    const xL = widthBytes & 0xff;
    const xH = (widthBytes >> 8) & 0xff;
    const yL = height & 0xff;
    const yH = (height >> 8) & 0xff;

    // Header: GS v 0 0 xL xH yL yH
    const header = [0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH];
    const bitmapData: number[] = [];

    for (let y = 0; y < height; y++) {
      for (let xByte = 0; xByte < widthBytes; xByte++) {
        let byteVal = 0;
        for (let b = 0; b < 8; b++) {
          const x = xByte * 8 + b;
          if (x < width) {
            const idx = (y * width + x) * 4;
            // Grayscale luminance
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const bVal = pixels[idx + 2];
            const a = pixels[idx + 3];
            const luminance = (r * 299 + g * 587 + bVal * 114) / 1000;

            // 1 = black dot, 0 = white
            if (a > 128 && luminance < 180) {
              byteVal |= 1 << (7 - b);
            }
          }
        }
        bitmapData.push(byteVal);
      }
    }

    // ESC @ (Init) + GS v 0 (Raster) + Feed & Cut
    const initCmd = [0x1b, 0x40];
    const feedAndCut = [0x1b, 0x64, 0x03, 0x1d, 0x56, 0x42, 0x00];

    const total = [...initCmd, ...header, ...bitmapData, ...feedAndCut];
    return new Uint8Array(total);
  }

  /**
   * Draw high-resolution receipt onto an HTML5 canvas for perfect Thai typography
   * Format requested by user:
   * 1. Top: Shop Logo (user uploaded)
   * 2. Below Logo: Shop Name & contact info
   * 3. Itemized foods and prices
   * 4. Bottom: Shop's PromptPay QR code (user uploaded) for customer scanning
   * 5. Very bottom: Custom Thank You note
   */
  public async generateReceiptCanvas(order: Order, settings: AppSettings): Promise<HTMLCanvasElement> {
    const is58mm = settings.printerPaperSize === '58mm';
    const canvasWidth = is58mm ? 384 : 576; // 384px for 58mm, 576px for 80mm

    // Preload logo and QR code images
    const [logoImg, qrImg] = await Promise.all([
      loadImage(settings.logoUrl),
      loadImage(settings.customPromptPayQrImage),
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Generous initial height (will be cropped cleanly to exact content height)
    canvas.height = 2600;

    // Background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvas.height);

    ctx.fillStyle = '#000000';
    let y = 24;

    const printCenter = (text: string, fontSize = 24, isBold = false) => {
      ctx.font = `${isBold ? 'bold ' : ''}${fontSize}px 'Sarabun', 'Segoe UI', Tahoma, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(text, canvasWidth / 2, y);
      y += fontSize + 10;
    };

    const printLeftRight = (left: string, right: string, fontSize = 20, isBold = false) => {
      ctx.font = `${isBold ? 'bold ' : ''}${fontSize}px 'Sarabun', 'Segoe UI', Tahoma, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(left, 16, y);
      ctx.textAlign = 'right';
      ctx.fillText(right, canvasWidth - 16, y);
      y += fontSize + 10;
    };

    const printDashedLine = () => {
      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      ctx.moveTo(16, y);
      ctx.lineTo(canvasWidth - 16, y);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      y += 18;
    };

    // 1. TOP: SHOP LOGO (If uploaded by user)
    if (logoImg) {
      const maxLogoW = is58mm ? 180 : 220;
      const maxLogoH = is58mm ? 90 : 110;
      const scale = Math.min(maxLogoW / logoImg.width, maxLogoH / logoImg.height, 1);
      const logoW = Math.round(logoImg.width * scale);
      const logoH = Math.round(logoImg.height * scale);
      const logoX = Math.round((canvasWidth - logoW) / 2);
      ctx.drawImage(logoImg, logoX, y, logoW, logoH);
      y += logoH + 14;
    }

    // 2. UNDER LOGO: SHOP NAME & INFO
    const shopName = settings.shopName_th || settings.shopName_en || 'ร้านอาหาร';
    printCenter(shopName, is58mm ? 26 : 30, true);

    if (settings.shopAddress_th || settings.shopAddress_en) {
      printCenter(settings.shopAddress_th || settings.shopAddress_en, 18, false);
    }
    if (settings.shopPhone) {
      printCenter(`โทร: ${settings.shopPhone}`, 18, false);
    }
    if (settings.shopTaxId) {
      printCenter(`เลขประจำตัวผู้เสียภาษี: ${settings.shopTaxId}`, 18, false);
    }

    printDashedLine();

    // Order Info
    printLeftRight(`ใบเสร็จ: ${order.orderNumber}`, order.tableName ? `โต๊ะ: ${order.tableName}` : (order.orderType === 'takeaway' ? 'สั่งกลับบ้าน' : ''));
    const orderDate = new Date(order.createdAt).toLocaleString('th-TH', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    printLeftRight(`วันที่: ${orderDate}`, order.queueNumber ? `คิวที่: #${order.queueNumber}` : '');

    printDashedLine();

    // 3. ITEMIZED FOODS & PRICES
    printLeftRight('รายการอาหาร', 'จำนวนเงิน', 19, true);

    order.lines.filter((l) => l.status !== 'voided').forEach((line) => {
      const lineName = `${line.quantity}x ${line.name_th || line.name_en}`;
      const lineTotal = (line.unitPrice * line.quantity).toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      printLeftRight(lineName, lineTotal, 20, false);

      // Selected options / modifiers
      line.selectedOptions.forEach((opt) => {
        printLeftRight(`   + ${opt.optionName_th}`, opt.priceDelta > 0 ? `+${opt.priceDelta}` : '', 16, false);
      });
      line.modifiers.forEach((mod) => {
        printLeftRight(`   * ${mod}`, '', 16, false);
      });
      if (line.notes) {
        printLeftRight(`   (${line.notes})`, '', 16, false);
      }
    });

    printDashedLine();

    // Financials
    const curr = settings.currency || '฿';
    printLeftRight('รวมรายการ (Subtotal)', `${curr}${order.subtotal.toFixed(2)}`, 19, false);

    if (order.discountAmount > 0) {
      printLeftRight(`ส่วนลด ${order.discountReason ? `(${order.discountReason})` : ''}`, `-${curr}${order.discountAmount.toFixed(2)}`, 19, false);
    }
    if (order.serviceChargeAmount > 0) {
      printLeftRight(`ค่าบริการ (${order.serviceChargeRate}%)`, `+${curr}${order.serviceChargeAmount.toFixed(2)}`, 18, false);
    }
    if (order.vatAmount > 0) {
      printLeftRight(`ภาษีมูลค่าเพิ่ม (${order.vatRate}%)`, `+${curr}${order.vatAmount.toFixed(2)}`, 18, false);
    }

    printDashedLine();

    // Net Total (Bold Large)
    printLeftRight('ยอดสุทธิ (NET TOTAL)', `${curr}${order.netTotal.toFixed(2)}`, is58mm ? 26 : 30, true);

    // Payment details or pending status
    if (order.payments && order.payments.length > 0) {
      printDashedLine();
      order.payments.forEach((p) => {
        const methodLabel = p.method === 'promptpay' ? 'พร้อมเพย์ QR' : (p.method === 'cash' ? 'เงินสด (Cash)' : 'บัตรเครดิต');
        printLeftRight(`ชำระโดย: ${methodLabel}`, `${curr}${p.amount.toFixed(2)}`, 18, false);
        if (p.receivedAmount) {
          printLeftRight('รับเงินมา:', `${curr}${p.receivedAmount.toFixed(2)}`, 18, false);
        }
        if (p.changeAmount && p.changeAmount > 0) {
          printLeftRight('เงินทอน:', `${curr}${p.changeAmount.toFixed(2)}`, 19, true);
        }
      });
    } else {
      printDashedLine();
      printLeftRight('สถานะการชำระ:', 'รอรับชำระเงิน', 18, true);
    }

    // 4. BOTTOM QR: SHOP'S UPLOADED QR CODE (For customer scanning to pay)
    if (qrImg) {
      printDashedLine();
      printCenter('สแกน QR เพื่อชำระเงิน (PromptPay)', 19, true);
      y += 6;
      const qrSize = is58mm ? 210 : 260;
      const qrX = Math.round((canvasWidth - qrSize) / 2);
      ctx.drawImage(qrImg, qrX, y, qrSize, qrSize);
      y += qrSize + 12;
      printCenter(`ยอดชำระ: ${curr}${order.netTotal.toFixed(2)}`, 20, true);
      if (settings.promptPayId) {
        printCenter(`พร้อมเพย์: ${settings.promptPayId}`, 16, false);
      }
    }

    printDashedLine();

    // 5. VERY BOTTOM: CUSTOM THANK YOU NOTE
    const footer = settings.receiptFooter_th || settings.receiptFooter_en || 'ขอบคุณที่มาอุดหนุนค่ะ / Thank You';
    printCenter(footer, 18, false);
    printCenter('POWERED BY THAI RESTAURANT POS', 14, false);
    y += 35; // Feed margin before cutter

    // Crop canvas to real rendered height
    const finalHeight = y;
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvasWidth;
    finalCanvas.height = finalHeight;
    const finalCtx = finalCanvas.getContext('2d');
    if (finalCtx) {
      finalCtx.fillStyle = '#ffffff';
      finalCtx.fillRect(0, 0, canvasWidth, finalHeight);
      finalCtx.drawImage(canvas, 0, 0);
    }

    return finalCanvas;
  }

  /**
   * Draw test print ticket
   */
  public async generateTestCanvas(settings: AppSettings): Promise<HTMLCanvasElement> {
    const is58mm = settings.printerPaperSize === '58mm';
    const canvasWidth = is58mm ? 384 : 576;

    // Load logo and QR code if available
    const [logoImg, qrImg] = await Promise.all([
      loadImage(settings.logoUrl),
      loadImage(settings.customPromptPayQrImage),
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = 1400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvas.height);

    ctx.fillStyle = '#000000';
    let y = 24;

    const printCenter = (text: string, fontSize = 24, isBold = false) => {
      ctx.font = `${isBold ? 'bold ' : ''}${fontSize}px 'Sarabun', 'Segoe UI', Tahoma, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(text, canvasWidth / 2, y);
      y += fontSize + 10;
    };

    const printLeftRight = (left: string, right: string, fontSize = 20, isBold = false) => {
      ctx.font = `${isBold ? 'bold ' : ''}${fontSize}px 'Sarabun', 'Segoe UI', Tahoma, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(left, 16, y);
      ctx.textAlign = 'right';
      ctx.fillText(right, canvasWidth - 16, y);
      y += fontSize + 10;
    };

    const printDashedLine = () => {
      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      ctx.moveTo(16, y);
      ctx.lineTo(canvasWidth - 16, y);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      y += 18;
    };

    // Test Logo
    if (logoImg) {
      const maxLogoW = is58mm ? 180 : 220;
      const maxLogoH = is58mm ? 90 : 110;
      const scale = Math.min(maxLogoW / logoImg.width, maxLogoH / logoImg.height, 1);
      const logoW = Math.round(logoImg.width * scale);
      const logoH = Math.round(logoImg.height * scale);
      const logoX = Math.round((canvasWidth - logoW) / 2);
      ctx.drawImage(logoImg, logoX, y, logoW, logoH);
      y += logoH + 14;
    }

    printCenter('ทดสอบพิมพ์ใบเสร็จบลูทูธ', 26, true);
    printCenter('BLUETOOTH PRINTER TEST', 18, true);
    const shopName = settings.shopName_th || settings.shopName_en || 'ร้านอาหาร';
    printCenter(shopName, 20, false);
    y += 6;

    printDashedLine();
    printLeftRight('สถานะระบบ:', 'เชื่อมต่อสำเร็จ OK', 18, true);
    printLeftRight('ขนาดกระดาษ:', is58mm ? '58 มม. (384 dots)' : '80 มม. (576 dots)', 18, false);
    printLeftRight('ภาษาไทย:', 'สระบนล่าง สระอำ วรรณยุกต์ครบ', 18, false);
    printLeftRight('ตัวอย่างรายการ:', '1x ข้าวผัดกุ้งพิเศษ', 18, false);
    printLeftRight('ยอดเงินทดสอบ:', '฿120.00', 18, true);

    // Test QR
    if (qrImg) {
      printDashedLine();
      printCenter('รูป QR Code ของร้าน:', 18, true);
      y += 6;
      const qrSize = is58mm ? 180 : 220;
      const qrX = Math.round((canvasWidth - qrSize) / 2);
      ctx.drawImage(qrImg, qrX, y, qrSize, qrSize);
      y += qrSize + 10;
    }

    printDashedLine();
    const footer = settings.receiptFooter_th || settings.receiptFooter_en || 'ขอบคุณที่มาอุดหนุนค่ะ / Thank You';
    printCenter(footer, 18, false);
    printCenter(new Date().toLocaleString('th-TH'), 14, false);
    y += 35;

    const finalHeight = y;
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvasWidth;
    finalCanvas.height = finalHeight;
    const finalCtx = finalCanvas.getContext('2d');
    if (finalCtx) {
      finalCtx.fillStyle = '#ffffff';
      finalCtx.fillRect(0, 0, canvasWidth, finalHeight);
      finalCtx.drawImage(canvas, 0, 0);
    }
    return finalCanvas;
  }

  /**
   * Kick open cash drawer via ESC/POS command
   */
  public async kickCashDrawer(): Promise<void> {
    const kickCmd = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);
    await this.sendRaw(kickCmd);
  }

  /**
   * Print test receipt
   */
  public async printTestReceipt(settings: AppSettings): Promise<void> {
    const canvas = await this.generateTestCanvas(settings);
    const rawData = this.canvasToEscPosRaster(canvas);
    await this.sendRaw(rawData);
  }

  /**
   * Print customer receipt
   */
  public async printReceipt(order: Order, settings: AppSettings): Promise<void> {
    const copies = settings.printerCopies || 1;
    const canvas = await this.generateReceiptCanvas(order, settings);
    const rawData = this.canvasToEscPosRaster(canvas);

    for (let c = 0; c < copies; c++) {
      await this.sendRaw(rawData);
      if (c < copies - 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    if (settings.printerOpenCashDrawer) {
      try {
        await this.kickCashDrawer();
      } catch {
        // Ignore drawer kick error
      }
    }
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();
