import 'react-native-get-random-values';
import { BankPattern, Transaction } from '../types/transaction';
import { v4 } from 'uuid';

/**
 * Bank patterns for parsing SMS messages
 * Each pattern has a regex to match the SMS and an extract function to parse the data
 */
export const BANK_PATTERNS: BankPattern[] = [
  // HDFC Bank debit pattern
  {
    regex: /HDFC Bank: INR ([\d,]+\.?\d*) debited from a\/c XX\d+ on (\d{2}-\d{2}-\d{2}) (.*?)\. Avl bal: INR ([\d,]+\.?\d*)/i,
    extract: (matches) => ({
      id: v4(),
      amount: parseFloat(matches[1].replace(/,/g, '')),
      date: matches[2],
      description: matches[3],
      balance: parseFloat(matches[4].replace(/,/g, '')),
      type: 'debit',
      bank: 'HDFC'
    })
  },
  // HDFC Bank credit pattern
  {
    regex: /HDFC Bank: INR ([\d,]+\.?\d*) credited to a\/c XX\d+ on (\d{2}-\d{2}-\d{2}) (.*?)\. Avl bal: INR ([\d,]+\.?\d*)/i,
    extract: (matches) => ({
      id: v4(),
      amount: parseFloat(matches[1].replace(/,/g, '')),
      date: matches[2],
      description: matches[3],
      balance: parseFloat(matches[4].replace(/,/g, '')),
      type: 'credit',
      bank: 'HDFC'
    })
  },
  // SBI debit pattern
  {
    regex: /INR ([\d,]+\.?\d*) debited from A\/c no XX\d+ on (\d{2}-\d{2}-\d{2}) (.*?)\. Bal: INR ([\d,]+\.?\d*)/i,
    extract: (matches) => ({
      id: v4(),
      amount: parseFloat(matches[1].replace(/,/g, '')),
      date: matches[2],
      description: matches[3], 
      balance: parseFloat(matches[4].replace(/,/g, '')),
      type: 'debit',
      bank: 'SBI'
    })
  },
  // SBI credit pattern
  {
    regex: /INR ([\d,]+\.?\d*) credited to A\/c no XX\d+ on (\d{2}-\d{2}-\d{2}) (.*?)\. Bal: INR ([\d,]+\.?\d*)/i,
    extract: (matches) => ({
      id: v4(),
      amount: parseFloat(matches[1].replace(/,/g, '')),
      date: matches[2],
      description: matches[3], 
      balance: parseFloat(matches[4].replace(/,/g, '')),
      type: 'credit',
      bank: 'SBI'
    })
  },
  // SBI UPI debit pattern
  {
    regex: /Dear UPI user A\/C X(\d+) debited by ([\d.,]+) on date (\d{2}[A-Za-z]{3}\d{2}) trf to (.*?) Refno (\d+)/i,
    extract: (matches) => ({
      id: v4(),
      amount: parseFloat(matches[2].replace(/,/g, '')),
      date: formatDateFromText(matches[3]),
      description: `UPI Payment to ${matches[4]}`,
      balance: undefined,
      type: 'debit',
      bank: 'SBI'
    })
  },
  // SBI YONO account transfer pattern
  {
    regex: /Tranx of Rs\.([\d.,]+) done on (\d{2}[A-Za-z]{3}\d{2}) to a\/c no XX(\d+) of (.*?) is complete\. from SBI A\/c XX(\d+)/i,
    extract: (matches) => ({
      id: v4(),
      amount: parseFloat(matches[1].replace(/,/g, '')),
      date: formatDateFromText(matches[2]),
      description: `Transfer to ${matches[4]} account XX${matches[3]}`,
      balance: undefined,
      type: 'debit',
      bank: 'SBI'
    })
  },
  // ICICI debit card pattern
  {
    regex: /INR ([\d,]+\.?\d*) spent on ICICI Card XX\d+ on (\d{2}-\d{2}-\d{2}) at (.*?)\./i,
    extract: (matches) => ({
      id: v4(),
      amount: parseFloat(matches[1].replace(/,/g, '')),
      date: matches[2],
      description: matches[3],
      balance: undefined,
      type: 'debit',
      bank: 'ICICI'
    })
  },
  // Axis Bank debit pattern
  {
    regex: /INR ([\d,]+\.?\d*) debited on (\d{2}-\d{2}-\d{2}) from A\/c XX\d+ (.*?)\. Avl Bal INR ([\d,]+\.?\d*)/i,
    extract: (matches) => ({
      id: v4(),
      amount: parseFloat(matches[1].replace(/,/g, '')),
      date: matches[2],
      description: matches[3],
      balance: parseFloat(matches[4].replace(/,/g, '')),
      type: 'debit',
      bank: 'Axis'
    })
  },
  // Axis Bank credit pattern
  {
    regex: /INR ([\d,]+\.?\d*) credited on (\d{2}-\d{2}-\d{2}) to A\/c XX\d+ (.*?)\. Avl Bal INR ([\d,]+\.?\d*)/i,
    extract: (matches) => ({
      id: v4(),
      amount: parseFloat(matches[1].replace(/,/g, '')),
      date: matches[2],
      description: matches[3],
      balance: parseFloat(matches[4].replace(/,/g, '')),
      type: 'credit',
      bank: 'Axis'
    })
  },
  // PayTM UPI pattern
  {
    regex: /INR ([\d,]+\.?\d*) paid to (.*?) successfully on (\d{2}-\d{2}-\d{2})/i,
    extract: (matches) => ({
      id: v4(),
      amount: parseFloat(matches[1].replace(/,/g, '')),
      date: matches[3],
      description: `Paid to ${matches[2]}`,
      balance: undefined,
      type: 'debit',
      bank: 'PayTM'
    })
  },
  // Google Pay UPI pattern
  {
    regex: /INR ([\d,]+\.?\d*) sent to (.*?) via UPI on (\d{2}-\d{2}-\d{2})/i,
    extract: (matches) => ({
      id: v4(),
      amount: parseFloat(matches[1].replace(/,/g, '')),
      date: matches[3],
      description: `Sent to ${matches[2]}`,
      balance: undefined,
      type: 'debit',
      bank: 'GooglePay'
    })
  }
];

/**
 * Format date from text format like "18Feb25" to standard format "18-02-25"
 */
function formatDateFromText(dateStr: string): string {
  const monthMap: { [key: string]: string } = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
    'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
  };
  
  // Extract day, month and year
  const day = dateStr.substring(0, 2);
  const month = dateStr.substring(2, 5).toLowerCase();
  const year = dateStr.substring(5);
  
  // Convert month name to number
  const monthNum = monthMap[month] || '01';
  
  return `${day}-${monthNum}-${year}`;
}

/**
 * Attempts to extract generic transaction details from SMS text that doesn't match known patterns
 */
export function extractGenericTransaction(smsText: string): Transaction | null {
  // Look for amounts with currency symbols like ₹ or INR
  const amountRegex = /(INR|Rs\.?|₹)\s?([\d,]+\.?\d*)/i;
  const amountMatch = smsText.match(amountRegex);
  
  if (!amountMatch) {
    // Try to find amount formats like "debited by 60.0"
    const debitedByRegex = /debited by ([\d.,]+)/i;
    const debitedMatch = smsText.match(debitedByRegex);
    
    if (debitedMatch) {
      const amount = parseFloat(debitedMatch[1].replace(/,/g, ''));
      
      // Try to extract date in various formats
      let date = new Date().toLocaleDateString('en-IN');
      
      // Look for date format like "18Feb25"
      const dateTextRegex = /on date (\d{2}[A-Za-z]{3}\d{2})/i;
      const dateTextMatch = smsText.match(dateTextRegex);
      if (dateTextMatch) {
        date = formatDateFromText(dateTextMatch[1]);
      } else {
        // Try other date formats
        const dateRegex = /(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})/;
        const dateMatch = smsText.match(dateRegex);
        if (dateMatch) {
          date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3].slice(-2)}`;
        }
      }
      
      // Try to extract merchant/recipient
      let description = 'Unknown Merchant';
      const trfToRegex = /trf to (.*?)(?:Refno|$)/i;
      const merchantMatch = smsText.match(trfToRegex);
      if (merchantMatch) {
        description = `Payment to ${merchantMatch[1].trim()}`;
      }
      
      return {
        id: v4(),
        amount,
        date,
        description,
        type: 'debit',
        balance: undefined,
        bank: smsText.includes('SBI') ? 'SBI' : 'Unknown',
        originalSMS: smsText
      };
    }
  }
  
  if (!amountMatch && !smsText.match(/debited by/i)) return null;
  
  const amount = amountMatch ? parseFloat(amountMatch[2].replace(/,/g, '')) : 0;
  
  // Try to determine if it's debit or credit
  const isDebit = /debited|sent|paid|spent|withdraw|purchase/i.test(smsText);
  const isCredit = /credited|received|refund|cashback/i.test(smsText);
  
  // Try to extract date (assuming Indian format DD-MM-YY)
  const dateRegex = /(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})/;
  const dateMatch = smsText.match(dateRegex);
  const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3].slice(-2)}` : new Date().toLocaleDateString('en-IN');
  
  return {
    id: v4(),
    amount: amount,
    date: date,
    description: smsText.substring(0, 50) + '...', // First 50 chars as description
    type: isDebit ? 'debit' : isCredit ? 'credit' : 'debit', // Default to debit if unsure
    balance: undefined,
    bank: 'Unknown',
    originalSMS: smsText
  };
}

/**
 * Parse transaction SMS text to extract transaction details
 */
export function parseTransactionSMS(smsText: string): Transaction | null {
  if (!smsText) return null;
  
  // Clean the SMS text - remove extra spaces
  const cleanedText = smsText.replace(/\s+/g, ' ').trim();
  
  // Try each bank pattern
  for (const pattern of BANK_PATTERNS) {
    const matches = cleanedText.match(pattern.regex);
    if (matches) {
      const transaction = pattern.extract(matches);
      return {
        ...transaction,
        originalSMS: cleanedText
      };
    }
  }
  
  // If no pattern matched, try a generic extraction
  const genericTransaction = extractGenericTransaction(cleanedText);
  if (genericTransaction) {
    return genericTransaction;
  }
  
  return null;
}

/**
 * Format transaction date for display
 */
export function formatTransactionDate(dateStr: string): string {
  // Assuming input format is "DD-MM-YY"
  const parts = dateStr.split(/[-\/]/);
  if (parts.length === 3) {
    return `${parts[0]}/${parts[1]}/20${parts[2].length === 2 ? parts[2] : parts[2].slice(-2)}`;
  }
  return dateStr;
}

/**
 * Determine if a given SMS text is likely a transaction message
 */
export function isTransactionSMS(smsText: string): boolean {
  if (!smsText) return false;
  
  // Look for common keywords in transaction messages
  const transactionKeywords = [
    /debited/i, /credited/i, /transaction/i, /spent/i, /payment/i,
    /account/i, /a\/c/i, /bank/i, /bal/i, /transfer/i, /upi/i,
    /rupees/i, /rs\./i, /inr/i, /₹/
  ];
  
  return transactionKeywords.some(keyword => keyword.test(smsText));
} 