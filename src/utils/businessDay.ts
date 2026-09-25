/**
 * Business Day Calculation Utilities for KinD POS
 *
 * Rule: Business day = the date obtained by subtracting the daily closing time
 * from the payment timestamp (in local time).
 * Example: With closing time 03:00, payments made at 01:30 belong to the previous business day.
 * With the default 00:00, the behavior is identical to calendar days.
 */

/**
 * Parses "HH:mm" time string into total offset milliseconds
 */
export function getClosingOffsetMs(closingTime = '00:00'): number {
  if (!closingTime || typeof closingTime !== 'string') return 0;
  const parts = closingTime.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return (hours * 60 + minutes) * 60 * 1000;
}

/**
 * Returns the business date formatted as "YYYY-MM-DD" for a given timestamp and closing time
 */
export function getBusinessDate(timestamp: number, closingTime = '00:00'): string {
  const offsetMs = getClosingOffsetMs(closingTime);
  const adjusted = new Date(timestamp - offsetMs);
  const year = adjusted.getFullYear();
  const month = String(adjusted.getMonth() + 1).padStart(2, '0');
  const day = String(adjusted.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the current active business date
 */
export function getCurrentBusinessDate(closingTime = '00:00'): string {
  return getBusinessDate(Date.now(), closingTime);
}

/**
 * Checks if two timestamps belong to the same business day
 */
export function isSameBusinessDate(ts1: number, ts2: number, closingTime = '00:00'): boolean {
  return getBusinessDate(ts1, closingTime) === getBusinessDate(ts2, closingTime);
}

/**
 * Returns the previous business date (1 day before)
 */
export function getPreviousBusinessDate(bizDateStr: string): string {
  const parts = bizDateStr.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3) return bizDateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the next business date (1 day after)
 */
export function getNextBusinessDate(bizDateStr: string): string {
  const parts = bizDateStr.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3) return bizDateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns previous month string "YYYY-MM"
 */
export function getPreviousMonth(monthStr: string): string {
  const parts = monthStr.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 2) return monthStr;
  const d = new Date(parts[0], parts[1] - 1, 1);
  d.setMonth(d.getMonth() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Returns next month string "YYYY-MM"
 */
export function getNextMonth(monthStr: string): string {
  const parts = monthStr.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 2) return monthStr;
  const d = new Date(parts[0], parts[1] - 1, 1);
  d.setMonth(d.getMonth() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Formats a "YYYY-MM-DD" date string for Thai and English displays
 */
export function formatBusinessDate(bizDateStr: string, language: 'th' | 'en' = 'th'): string {
  if (!bizDateStr) return '';
  const parts = bizDateStr.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3) return bizDateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);

  if (language === 'th') {
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  }
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

/**
 * Formats a "YYYY-MM" month string
 */
export function formatMonthYear(monthStr: string, language: 'th' | 'en' = 'th'): string {
  if (!monthStr) return '';
  const parts = monthStr.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 2) return monthStr;
  const d = new Date(parts[0], parts[1] - 1, 1);

  if (language === 'th') {
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
    });
  }
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

/**
 * Returns a business date N days prior to the given business date string (YYYY-MM-DD)
 */
export function getBizDateDaysAgo(bizDateStr: string, daysAgo: number): string {
  const parts = bizDateStr.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3) return bizDateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

