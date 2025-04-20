/**
 * Category definitions with keywords for matching
 */
export interface Category {
  id: number;
  name: string;
  keywords: string[];
  icon?: string;
}

/**
 * Predefined categories with keywords for common expenses
 */
export const categories: Category[] = [
  { 
    id: 1, 
    name: 'Groceries', 
    keywords: [
      'supermarket', 'grocery', 'market', 'kirana', 'bigbasket', 
      'grofers', 'fresh', 'vegetables', 'fruits', 'dmart', 'reliance fresh'
    ],
    icon: 'basket'
  },
  { 
    id: 2, 
    name: 'Food & Dining', 
    keywords: [
      'restaurant', 'cafe', 'swiggy', 'zomato', 'food', 'pizza', 'hotel', 
      'eat', 'dining', 'lunch', 'dinner', 'breakfast', 'burger', 'coffee',
      'tea', 'bakery', 'mcdonalds', 'kfc', 'dominos'
    ],
    icon: 'restaurant'
  },
  { 
    id: 3, 
    name: 'Transport', 
    keywords: [
      'uber', 'ola', 'taxi', 'auto', 'metro', 'train', 'petrol', 'fuel', 
      'parking', 'bus', 'fare', 'ticket', 'transport', 'rapido', 'railway',
      'irctc', 'flight', 'redbus'
    ],
    icon: 'car'
  },
  { 
    id: 4, 
    name: 'Shopping', 
    keywords: [
      'amazon', 'flipkart', 'myntra', 'mall', 'retail', 'shop', 'purchase', 
      'buy', 'store', 'market', 'outlet', 'fashion', 'clothing', 'shoes',
      'apparel', 'electronics', 'nykaa', 'ajio'
    ],
    icon: 'cart'
  },
  { 
    id: 5, 
    name: 'Entertainment', 
    keywords: [
      'movie', 'netflix', 'prime', 'hotstar', 'tickets', 'bookmyshow', 'cinema', 
      'theater', 'show', 'concert', 'game', 'sports', 'event', 'subscription',
      'pvr', 'inox'
    ],
    icon: 'film'
  },
  { 
    id: 6, 
    name: 'Bills & Utilities', 
    keywords: [
      'electricity', 'water', 'gas', 'mobile', 'phone', 'internet', 'broadband', 
      'bill', 'recharge', 'dth', 'utility', 'wifi', 'airtel', 'jio', 'vodafone',
      'idea', 'bsnl', 'tata', 'rental', 'maintenance'
    ],
    icon: 'file-text'
  },
  { 
    id: 7, 
    name: 'Health', 
    keywords: [
      'hospital', 'clinic', 'doctor', 'medicine', 'pharmacy', 'medical', 'health', 
      'healthcare', 'insurance', 'consultation', 'apollo', 'medplus', 'wellness',
      'netmeds', 'pharmeasy', 'lab', 'test', 'diagnosis'
    ],
    icon: 'activity'
  },
  { 
    id: 8, 
    name: 'Education', 
    keywords: [
      'school', 'college', 'course', 'class', 'tuition', 'books', 'education', 
      'learning', 'training', 'fee', 'university', 'institute', 'academy',
      'online course', 'udemy', 'coursera'
    ],
    icon: 'book'
  },
  { 
    id: 9, 
    name: 'Personal Care', 
    keywords: [
      'salon', 'spa', 'haircut', 'parlour', 'beauty', 'cosmetics', 'grooming',
      'makeup', 'skincare', 'barber', 'massage', 'facial', 'manicure', 'pedicure'
    ],
    icon: 'scissors'
  },
  { 
    id: 10, 
    name: 'Home', 
    keywords: [
      'rent', 'maintenance', 'furniture', 'appliance', 'decor', 'repair', 'housing',
      'property', 'interior', 'renovation', 'plumbing', 'electrical', 'carpet', 'curtain'
    ],
    icon: 'home'
  },
  { 
    id: 11, 
    name: 'Travel', 
    keywords: [
      'flight', 'hotel', 'booking', 'trip', 'vacation', 'holiday', 'travel', 'tour',
      'resort', 'makemytrip', 'goibibo', 'oyo', 'airbnb', 'cleartrip', 'yatra',
      'visa', 'passport', 'cruise', 'holiday'
    ],
    icon: 'map'
  },
  { 
    id: 12, 
    name: 'Investment', 
    keywords: [
      'mutual', 'fund', 'stock', 'investment', 'deposit', 'gold', 'fixed', 'recurring',
      'shares', 'bonds', 'dividend', 'interest', 'zerodha', 'groww', 'upstox', 'ipo'
    ],
    icon: 'trending-up'
  },
  { 
    id: 13, 
    name: 'Others', 
    keywords: [],
    icon: 'more-horizontal'
  }
];

/**
 * Category colors for visual representation
 */
export const CATEGORY_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
  '#FF9F40', '#8AC24A', '#607D8B', '#E91E63', '#3F51B5',
  '#00BCD4', '#FFC107', '#795548'
];

import { predictTransactionCategory } from '../services/geminiService';
import { GEMINI_API_KEY } from '@env';

/**
 * Find merchant in known merchant database
 * This would normally come from a larger database, but for now we'll use a small set
 */
export function findMerchantCategory(description: string): string | null {
  const knownMerchants: Record<string, string> = {
    'amazon': 'Shopping',
    'flipkart': 'Shopping',
    'swiggy': 'Food & Dining',
    'zomato': 'Food & Dining',
    'uber': 'Transport',
    'ola': 'Transport',
    'netflix': 'Entertainment',
    'hotstar': 'Entertainment',
    'airtel': 'Bills & Utilities',
    'jio': 'Bills & Utilities',
    'apollo': 'Health',
    'medplus': 'Health',
    'bookmyshow': 'Entertainment',
    'makemytrip': 'Travel',
    'irctc': 'Transport',
    // Add more merchants here
  };

  // Check if any known merchant name appears in the description
  for (const [merchant, category] of Object.entries(knownMerchants)) {
    if (description.toLowerCase().includes(merchant.toLowerCase())) {
      return category;
    }
  }

  return null;
}

/**
 * Categorize a transaction based on its description
 */
export async function categorizeTransaction(description: string, amount?: number): Promise<string> {
  if (!description) return 'Others';
  
  const desc = description.toLowerCase();
  
  // Step 1: Check for exact merchant matches
  const merchantCategory = findMerchantCategory(desc);
  if (merchantCategory) return merchantCategory;
  
  // Step 2: Check keyword matches
  for (const category of categories) {
    for (const keyword of category.keywords) {
      if (desc.includes(keyword.toLowerCase())) {
        return category.name;
      }
    }
  }
  
  // Step 3: If amount is provided, API key exists, and basic matching failed, try AI categorization
  if (amount !== undefined && GEMINI_API_KEY && GEMINI_API_KEY !== 'your_api_key_here') {
    try {
      const prediction = await predictTransactionCategory(description, amount);
      // Only use AI prediction if confidence is high enough
      if (prediction.confidence > 0.7) {
        return prediction.category;
      }
    } catch (error) {
      console.error('Error using AI categorization:', error);
      // Continue with fallback if AI fails
    }
  }
  
  return 'Others';
}

/**
 * Synchronous version of categorizeTransaction for backwards compatibility
 */
export function categorizeTransactionSync(description: string): string {
  if (!description) return 'Others';
  
  const desc = description.toLowerCase();
  
  // Step 1: Check for exact merchant matches
  const merchantCategory = findMerchantCategory(desc);
  if (merchantCategory) return merchantCategory;
  
  // Step 2: Check keyword matches
  for (const category of categories) {
    for (const keyword of category.keywords) {
      if (desc.includes(keyword.toLowerCase())) {
        return category.name;
      }
    }
  }
  
  return 'Others';
}

/**
 * Get category by name
 */
export function getCategoryById(id: number): Category | undefined {
  return categories.find(category => category.id === id);
}

/**
 * Get category by name
 */
export function getCategoryByName(name: string): Category | undefined {
  return categories.find(category => category.name === name);
}

/**
 * Get category color by name
 */
export function getCategoryColor(name: string): string {
  const category = getCategoryByName(name);
  if (!category) return CATEGORY_COLORS[12]; // Default color (Others)
  
  return CATEGORY_COLORS[(category.id - 1) % CATEGORY_COLORS.length];
} 