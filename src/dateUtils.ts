/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns the current date in YYYY-MM-DD format based on the user's local timezone.
 * Avoids UTC timezone day-shift bugs caused by new Date().toISOString().
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely add or subtract days from a YYYY-MM-DD string without UTC offset issues.
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const parts = dateStr.split('T')[0].split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return getLocalDateString();
  }
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
}

/**
 * Normalizes any date string (ISO timestamp or YYYY-MM-DD) to a standard YYYY-MM-DD string.
 */
export function normalizeDateString(dateStr: string): string {
  if (!dateStr) return getLocalDateString();
  return dateStr.split('T')[0].trim();
}
