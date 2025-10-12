import {
  format,
  parseISO,
  isValid,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  differenceInDays,
  isAfter,
} from 'date-fns';

/**
 * Formats a date string or Date object
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatString: string = 'MMM dd, yyyy'
): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return '';

  return format(dateObj, formatString);
}

/**
 * Formats a date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(
  date: string | Date | null | undefined
): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return '';

  return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Formats a date for API (ISO string)
 */
export function formatDateForAPI(
  date: string | Date | null | undefined
): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return '';

  return dateObj.toISOString();
}

/**
 * Gets the current fiscal year start date
 */
export function getFiscalYearStart(fiscalYearStart: string = '01-01'): Date {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const [month, day] = fiscalYearStart.split('-').map(Number);

  const fiscalStart = new Date(currentYear, month - 1, day);

  // If fiscal year start is after current date, use previous year
  if (isAfter(fiscalStart, currentDate)) {
    fiscalStart.setFullYear(currentYear - 1);
  }

  return fiscalStart;
}

/**
 * Gets the current fiscal year end date
 */
export function getFiscalYearEnd(fiscalYearStart: string = '01-01'): Date {
  const fiscalStart = getFiscalYearStart(fiscalYearStart);
  const fiscalEnd = new Date(fiscalStart);
  fiscalEnd.setFullYear(fiscalEnd.getFullYear() + 1);
  fiscalEnd.setDate(fiscalEnd.getDate() - 1);

  return fiscalEnd;
}

/**
 * Common date range presets
 */
export const DATE_RANGE_PRESETS = {
  today: {
    label: 'Today',
    start: () => new Date(),
    end: () => new Date(),
  },
  yesterday: {
    label: 'Yesterday',
    start: () => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      return date;
    },
    end: () => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      return date;
    },
  },
  thisWeek: {
    label: 'This Week',
    start: () => {
      const date = new Date();
      const day = date.getDay();
      const diff = date.getDate() - day;
      return new Date(date.setDate(diff));
    },
    end: () => {
      const date = new Date();
      const day = date.getDay();
      const diff = date.getDate() - day + 6;
      return new Date(date.setDate(diff));
    },
  },
  thisMonth: {
    label: 'This Month',
    start: () => startOfMonth(new Date()),
    end: () => endOfMonth(new Date()),
  },
  lastMonth: {
    label: 'Last Month',
    start: () => startOfMonth(subMonths(new Date(), 1)),
    end: () => endOfMonth(subMonths(new Date(), 1)),
  },
  thisQuarter: {
    label: 'This Quarter',
    start: () => startOfQuarter(new Date()),
    end: () => endOfQuarter(new Date()),
  },
  thisYear: {
    label: 'This Year',
    start: () => startOfYear(new Date()),
    end: () => endOfYear(new Date()),
  },
  lastYear: {
    label: 'Last Year',
    start: () => startOfYear(subMonths(new Date(), 12)),
    end: () => endOfYear(subMonths(new Date(), 12)),
  },
  last30Days: {
    label: 'Last 30 Days',
    start: () => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      return date;
    },
    end: () => new Date(),
  },
  last90Days: {
    label: 'Last 90 Days',
    start: () => {
      const date = new Date();
      date.setDate(date.getDate() - 90);
      return date;
    },
    end: () => new Date(),
  },
};

/**
 * Gets date range for a preset
 */
export function getDateRangePreset(preset: keyof typeof DATE_RANGE_PRESETS) {
  const range = DATE_RANGE_PRESETS[preset];
  return {
    label: range.label,
    start: range.start(),
    end: range.end(),
  };
}

/**
 * Validates if a date string is valid
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = parseISO(dateString);
  return isValid(date);
}

/**
 * Validates if a date range is valid
 */
export function isValidDateRange(
  start: string | Date,
  end: string | Date
): boolean {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;

  if (!isValid(startDate) || !isValid(endDate)) return false;

  return !isAfter(startDate, endDate);
}

/**
 * Calculates the number of days between two dates
 */
export function daysBetween(start: string | Date, end: string | Date): number {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;

  if (!isValid(startDate) || !isValid(endDate)) return 0;

  return differenceInDays(endDate, startDate);
}

/**
 * Gets the relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(date: string | Date): string {
  const targetDate = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffInDays = differenceInDays(now, targetDate);

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;

  return `${Math.floor(diffInDays / 365)} years ago`;
}
