/**
 * Convert date string from Indian format (DD-MM-YY) to standard format (YYYY-MM-DD)
 */
export function standardizeDate(dateStr: string): string {
  // Check if date is already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Handle DD-MM-YY or DD/MM/YY format
  const dateParts = dateStr.split(/[-/]/);
  if (dateParts.length === 3) {
    const [day, month, year] = dateParts;
    // Convert 2-digit year to 4-digit
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // If format can't be recognized, return the original
  return dateStr;
}

/**
 * Get start and end dates for various time periods
 */
export function getDateRange(period: 'day' | 'week' | 'month' | 'year'): { startDate: Date, endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      // Set to the start of the week (Sunday)
      const dayOfWeek = startDate.getDay();
      const diff = startDate.getDate() - dayOfWeek;
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'year':
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
  }
  
  return { startDate, endDate };
}

/**
 * Format date for display
 */
export function formatDateForDisplay(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    
    // Check if valid date
    if (isNaN(date.getTime())) {
      // Try parsing format like DD-MM-YY
      const parts = dateStr.split(/[-\/]/);
      if (parts.length === 3) {
        // Assuming day-month-year format
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        let year = parseInt(parts[2]);
        // Handle 2-digit years
        if (year < 100) {
          year += 2000;
        }
        
        const parsedDate = new Date(year, month, day);
        return parsedDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
      
      // If not parseable, return as is
      return dateStr;
    }
    
    // Format date
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateStr;
  }
}

/**
 * Check if a date is within a given range
 */
export function isDateInRange(dateStr: string, startDate: Date, endDate: Date): boolean {
  const standardDate = standardizeDate(dateStr);
  const date = new Date(standardDate);
  
  return date >= startDate && date <= endDate;
}

/**
 * Group transactions by date
 */
export function groupTransactionsByDate<T extends { date: string }>(transactions: T[]): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  
  transactions.forEach(transaction => {
    const standardDate = standardizeDate(transaction.date);
    
    if (!grouped[standardDate]) {
      grouped[standardDate] = [];
    }
    
    grouped[standardDate].push(transaction);
  });
  
  return grouped;
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDateRange<T extends { date: string }>(
  transactions: T[], 
  startDate: Date, 
  endDate: Date
): T[] {
  return transactions.filter(transaction => 
    isDateInRange(transaction.date, startDate, endDate)
  );
}

/**
 * Get relative time string (today, yesterday, etc.)
 */
export function getRelativeTimeString(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    
    // Check if valid date
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Check if today
    if (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      return 'Today';
    }
    
    // Check if yesterday
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return 'Yesterday';
    }
    
    // Check if this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    if (date >= oneWeekAgo) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    // Check if this month
    if (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    }
    
    // Default format
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (error) {
    console.error('Error getting relative time:', error);
    return '';
  }
}

/**
 * Get start date for timeframe
 */
export function getStartDateForTimeframe(timeframe: 'week' | 'month' | 'year' | 'all'): Date {
  const now = new Date();
  
  switch (timeframe) {
    case 'week':
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return oneWeekAgo;
      
    case 'month':
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      return oneMonthAgo;
      
    case 'year':
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      return oneYearAgo;
      
    case 'all':
    default:
      // Return a date far in the past
      return new Date(2000, 0, 1);
  }
}

/**
 * Format date in a simple way (DD/MM/YYYY)
 */
export function formatDate(date: Date): string {
  try {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toISOString().split('T')[0];
  }
}

/**
 * Get day name from date object
 */
export function getDayName(date: Date): string {
  try {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } catch (error) {
    console.error('Error getting day name:', error);
    return '';
  }
} 