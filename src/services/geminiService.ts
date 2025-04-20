import { Transaction } from '../types/transaction';
import { Category, categories } from '../utils/categoryEngine';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@env';

// Use API key from environment variables
// If not available, we'll use a placeholder that will trigger a more user-friendly error
const apiKey = GEMINI_API_KEY || 'API_KEY_NOT_CONFIGURED';
const MODEL_NAME = 'gemini-2.0-flash-001';

// Initialize the Gemini AI
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

// Configure the safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

/**
 * Interface for category prediction
 */
interface CategoryPrediction {
  category: string;
  confidence: number;
}

/**
 * Interface for spending insight
 */
export interface SpendingInsight {
  title: string;
  description: string;
  actionItem?: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
}

/**
 * Interface for financial advice
 */
export interface FinancialAdvice {
  title: string;
  content: string;
  tags: string[];
  priority: 'high' | 'medium' | 'low';
}

/**
 * Call Gemini API with the given prompt
 */
export async function callGeminiAPI(prompt: string): Promise<string> {
  try {
    // Check if API key is configured
    if (apiKey === 'API_KEY_NOT_CONFIGURED') {
      throw new Error('Gemini API key not configured. Please add your API key to the .env file.');
    }
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      },
      safetySettings,
    });

    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

/**
 * Predict category for a transaction using Gemini AI
 */
export async function predictTransactionCategory(
  description: string, 
  amount: number
): Promise<CategoryPrediction> {
  try {
    // Create category options for the model to choose from
    const categoryOptions = categories
      .map(cat => cat.name)
      .filter(name => name !== 'Others')
      .join(', ');
    
    const prompt = `
      You are a financial transaction categorizer. Analyze this transaction and categorize it into exactly one of these categories: ${categoryOptions}.
      
      Transaction details:
      - Description: "${description}"
      - Amount: ${amount}
      
      Consider the merchant name, keywords, and transaction context. Return only the category name followed by a confidence score between 0 and 1, with 1 being most confident. 
      Format your response exactly as: "Category: [category name], Confidence: [score]"
    `;

    const response = await callGeminiAPI(prompt);
    
    // Parse the response
    const categoryMatch = response.match(/Category:\s*([^,]+),\s*Confidence:\s*([\d.]+)/i);
    
    if (categoryMatch && categoryMatch.length >= 3) {
      const predictedCategory = categoryMatch[1].trim();
      const confidence = parseFloat(categoryMatch[2].trim());
      
      // Verify the category exists in our predefined list
      const isValidCategory = categories.some(cat => 
        cat.name.toLowerCase() === predictedCategory.toLowerCase()
      );
      
      if (isValidCategory) {
        return {
          category: predictedCategory,
          confidence: confidence
        };
      }
    }
    
    // Fallback to 'Others' if parsing fails
    return {
      category: 'Others',
      confidence: 0.5
    };
  } catch (error) {
    console.error('Error predicting category:', error);
    // Return a fallback category
    return {
      category: 'Others',
      confidence: 0.5
    };
  }
}

/**
 * Generate spending insights from transaction data
 */
export async function generateSpendingInsights(
  transactions: Transaction[],
  timeframe: 'week' | 'month' | 'year' = 'month'
): Promise<SpendingInsight[]> {
  try {
    if (!transactions || transactions.length === 0) {
      return [
        {
          title: 'Not enough data',
          description: 'Add more transactions to get personalized insights.',
          type: 'neutral'
        }
      ];
    }

    // Calculate total spending by category
    const categoryTotals: Record<string, number> = {};
    let totalSpent = 0;
    
    transactions.forEach(transaction => {
      const category = transaction.category || 'Others';
      categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
      totalSpent += transaction.amount;
    });
    
    // Prepare data for the prompt
    const categoryData = Object.entries(categoryTotals)
      .map(([category, amount]) => `${category}: ₹${amount.toFixed(2)}`)
      .join('\n');
    
    const prompt = `
      You are a financial advisor analyzing spending data. Based on the following transaction data for the past ${timeframe}, provide 3-5 clear, actionable insights about spending habits.
      
      Total spent: ₹${totalSpent.toFixed(2)}
      Number of transactions: ${transactions.length}
      Spending by category:
      ${categoryData}

      For each insight:
      1. Provide a short title
      2. Add a brief explanation
      3. Suggest one specific action item
      4. Classify as "positive", "negative", "neutral", or "warning"
      
      Format each insight as:
      TITLE: [short insight title]
      DESCRIPTION: [brief explanation]
      ACTION: [specific action]
      TYPE: [positive/negative/neutral/warning]

      Only return the formatted insights, nothing else.
    `;

    const response = await callGeminiAPI(prompt);
    
    // Parse the insights from the response
    const insightBlocks = response.split(/TITLE:/i).filter(block => block.trim().length > 0);
    
    const insights: SpendingInsight[] = [];
    
    for (const block of insightBlocks) {
      const titleMatch = block.match(/^([^\n]+)/);
      const descriptionMatch = block.match(/DESCRIPTION:\s*([^\n]+)/i);
      const actionMatch = block.match(/ACTION:\s*([^\n]+)/i);
      const typeMatch = block.match(/TYPE:\s*(positive|negative|neutral|warning)/i);
      
      if (titleMatch && descriptionMatch && typeMatch) {
        insights.push({
          title: titleMatch[1].trim(),
          description: descriptionMatch[1].trim(),
          actionItem: actionMatch ? actionMatch[1].trim() : undefined,
          type: typeMatch[1].toLowerCase() as 'positive' | 'negative' | 'neutral' | 'warning'
        });
      }
    }
    
    // If parsing failed or returned no insights, provide fallback insights
    if (insights.length === 0) {
      return [
        {
          title: 'Top spending category',
          description: `Your highest spending was in the ${Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][0]} category.`,
          actionItem: 'Review this category for potential savings.',
          type: 'neutral'
        },
        {
          title: 'Spending overview',
          description: `You spent ₹${totalSpent.toFixed(2)} across ${transactions.length} transactions.`,
          actionItem: 'Set a budget for next month based on this data.',
          type: 'neutral'
        }
      ];
    }
    
    return insights;
  } catch (error) {
    console.error('Error generating spending insights:', error);
    
    // Return fallback insights
    return [
      {
        title: 'An error occurred',
        description: 'Could not generate personalized insights at this time.',
        actionItem: 'Try again later or check your connection.',
        type: 'neutral'
      }
    ];
  }
}

/**
 * Check if a transaction amount is unusually high for its category
 */
export async function detectAnomalousTransaction(
  transaction: Transaction,
  pastTransactions: Transaction[]
): Promise<boolean> {
  try {
    // Filter transactions by the same category
    const categoryTransactions = pastTransactions.filter(
      t => t.category === transaction.category
    );
    
    // If we don't have enough data, return false
    if (categoryTransactions.length < 5) {
      return false;
    }
    
    // Calculate average and standard deviation for this category
    const amounts = categoryTransactions.map(t => t.amount);
    const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    
    const squaredDiffs = amounts.map(amount => Math.pow(amount - average, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate z-score for current transaction
    const zScore = (transaction.amount - average) / stdDev;
    
    // If z-score is higher than 2, it's considered unusual (95% confidence)
    return zScore > 2;
  } catch (error) {
    console.error('Error detecting anomalous transaction:', error);
    return false;
  }
}

/**
 * Suggest saving goals based on transaction history
 */
export async function suggestSavingGoals(
  transactions: Transaction[]
): Promise<{ goal: string; amount: number; timeframe: string; reason: string }[]> {
  try {
    if (!transactions || transactions.length < 5) {
      return [
        {
          goal: "Emergency Fund",
          amount: 10000,
          timeframe: "3 months",
          reason: "Everyone should have an emergency fund for unexpected expenses"
        }
      ];
    }

    // Calculate spending by category
    const categoryTotals: Record<string, number> = {};
    let totalSpent = 0;
    
    transactions
      .filter(tx => tx.type === 'debit')
      .forEach(transaction => {
        const category = transaction.category || 'Others';
        categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
        totalSpent += transaction.amount;
      });
    
    // Calculate total income
    const totalIncome = transactions
      .filter(tx => tx.type === 'credit')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    // Prepare data for the prompt
    const categoryData = Object.entries(categoryTotals)
      .map(([category, amount]) => `${category}: ₹${amount.toFixed(2)} (${((amount/totalSpent)*100).toFixed(1)}%)`)
      .join('\n');
    
    const avgMonthlySpending = totalSpent / 3; // Assuming data is for about 3 months
    const savingRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;
    
    const prompt = `
      You are a financial advisor analyzing spending data. Based on the following transaction data, suggest 2-3 personalized saving goals.
      
      Monthly spending: ₹${avgMonthlySpending.toFixed(2)}
      Current saving rate: ${savingRate.toFixed(1)}%
      Spending by category:
      ${categoryData}

      For each saving goal suggestion:
      1. The specific goal name
      2. Suggested amount to save
      3. Timeframe to achieve it
      4. Brief reason why this goal makes sense based on their spending pattern
      
      Format each goal as:
      GOAL: [specific goal name]
      AMOUNT: [amount in INR]
      TIMEFRAME: [timeframe]
      REASON: [brief reason]

      Only provide goal suggestions based on their spending patterns. Be specific with amounts and timeframes.
    `;

    const response = await callGeminiAPI(prompt);
    
    // Parse the goals from the response
    const goalBlocks = response.split(/GOAL:/i).filter(block => block.trim().length > 0);
    
    const goals: { goal: string; amount: number; timeframe: string; reason: string }[] = [];
    
    for (const block of goalBlocks) {
      const goalMatch = block.match(/^([^\n]+)/);
      const amountMatch = block.match(/AMOUNT:\s*(?:₹|INR)?\s*([\d,]+)/i);
      const timeframeMatch = block.match(/TIMEFRAME:\s*([^\n]+)/i);
      const reasonMatch = block.match(/REASON:\s*([^\n]+)/i);
      
      if (goalMatch && amountMatch && timeframeMatch && reasonMatch) {
        const amountStr = amountMatch[1].replace(/,/g, '');
        const amount = parseInt(amountStr, 10);
        
        goals.push({
          goal: goalMatch[1].trim(),
          amount: isNaN(amount) ? 10000 : amount, // Default to 10000 if parsing fails
          timeframe: timeframeMatch[1].trim(),
          reason: reasonMatch[1].trim()
        });
      }
    }
    
    // If parsing failed or returned no goals, provide fallback goals
    if (goals.length === 0) {
      return [
        {
          goal: "Emergency Fund",
          amount: Math.max(15000, Math.round(avgMonthlySpending * 3 / 1000) * 1000),
          timeframe: "6 months",
          reason: "Based on your spending, you should have this much saved for emergencies"
        }
      ];
    }
    
    return goals;
  } catch (error) {
    console.error('Error generating saving goals:', error);
    
    // Return fallback goals
    return [
      {
        goal: "Emergency Fund",
        amount: 20000,
        timeframe: "6 months",
        reason: "Everyone should have an emergency fund for unexpected expenses"
      }
    ];
  }
}

/**
 * Generate personalized financial advice based on transaction history
 */
export async function generateFinancialAdvice(
  transactions: Transaction[]
): Promise<FinancialAdvice[]> {
  try {
    if (!transactions || transactions.length < 5) {
      return [
        {
          title: "Start an Emergency Fund",
          content: "Consider building an emergency fund with 3-6 months of living expenses. Start with small, regular contributions to create a financial safety net.",
          tags: ["savings", "emergency", "beginners"],
          priority: "high"
        }
      ];
    }

    // Calculate spending by category
    const categoryTotals: Record<string, number> = {};
    let totalSpent = 0;
    
    transactions
      .filter(tx => tx.type === 'debit')
      .forEach(transaction => {
        const category = transaction.category || 'Others';
        categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
        totalSpent += transaction.amount;
      });
    
    // Calculate total income
    const totalIncome = transactions
      .filter(tx => tx.type === 'credit')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    // Prepare data for the prompt
    const categoryData = Object.entries(categoryTotals)
      .map(([category, amount]) => `${category}: ₹${amount.toFixed(2)} (${((amount/totalSpent)*100).toFixed(1)}%)`)
      .join('\n');
    
    const avgMonthlySpending = totalSpent / 3; // Assuming data is for about 3 months
    const savingRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;
    
    const prompt = `
      You are a financial advisor analyzing spending patterns. Based on the following transaction data, provide 3 personalized financial advice tips.
      
      Monthly spending: ₹${avgMonthlySpending.toFixed(2)}
      Current saving rate: ${savingRate.toFixed(1)}%
      Spending by category:
      ${categoryData}

      For each financial advice:
      1. A clear, specific title
      2. Detailed advice content (2-3 sentences with actionable tips)
      3. Relevant tags (2-4 tags)
      4. Priority level (high, medium, or low)
      
      Format each advice as:
      TITLE: [specific advice title]
      CONTENT: [detailed advice content]
      TAGS: [tag1, tag2, tag3]
      PRIORITY: [high/medium/low]

      Ensure advice is tailored to their specific spending patterns. Focus on practical, actionable advice.
    `;

    const response = await callGeminiAPI(prompt);
    
    // Parse the advice from the response
    const adviceBlocks = response.split(/TITLE:/i).filter(block => block.trim().length > 0);
    
    const adviceList: FinancialAdvice[] = [];
    
    for (const block of adviceBlocks) {
      const titleMatch = block.match(/^([^\n]+)/);
      const contentMatch = block.match(/CONTENT:\s*([^\n]+(?:\n[^\n]+)*?)(?=\nTAGS:|$)/i);
      const tagsMatch = block.match(/TAGS:\s*([^\n]+)/i);
      const priorityMatch = block.match(/PRIORITY:\s*(high|medium|low)/i);
      
      if (titleMatch && contentMatch && tagsMatch && priorityMatch) {
        const tagsStr = tagsMatch[1].trim();
        const tags = tagsStr
          .split(/,\s*/)
          .map(tag => tag.trim().replace(/[\[\]]/g, ''));
        
        adviceList.push({
          title: titleMatch[1].trim(),
          content: contentMatch[1].trim().replace(/\n/g, ' '),
          tags: tags,
          priority: priorityMatch[1].toLowerCase() as 'high' | 'medium' | 'low'
        });
      }
    }
    
    // If parsing failed or returned no advice, provide fallback advice
    if (adviceList.length === 0) {
      return [
        {
          title: "Create a Monthly Budget",
          content: "Based on your spending patterns, setting up a monthly budget can help you control expenses. Allocate specific amounts to each category and track your progress.",
          tags: ["budgeting", "planning", "basics"],
          priority: "high"
        },
        {
          title: "Reduce Discretionary Spending",
          content: `Your ${Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][0]} category has the highest spending. Consider reviewing these expenses to identify potential savings opportunities.`,
          tags: ["saving", "expenses", "tips"],
          priority: "medium"
        }
      ];
    }
    
    return adviceList;
  } catch (error) {
    console.error('Error generating financial advice:', error);
    
    // Return fallback advice
    return [
      {
        title: "Start Tracking Your Expenses",
        content: "The first step to financial wellness is understanding where your money goes. Track all expenses for a month to identify spending patterns and areas for improvement.",
        tags: ["tracking", "habits", "beginners"],
        priority: "high"
      }
    ];
  }
} 