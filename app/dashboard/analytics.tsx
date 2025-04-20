import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from "react-native";
import { Text, SegmentedButtons, Card } from "react-native-paper";
import { PieChart, LineChart } from "react-native-chart-kit";
import { Transaction, CategoryTotal } from "../../src/types/transaction";
import { getFilteredTransactions } from "../../src/services/storageService";
import { getStartDateForTimeframe } from "../../src/utils/dateUtils";
import { Ionicons } from "@expo/vector-icons";
import { categories, getCategoryColor } from "../../src/utils/categoryEngine";
import { useTheme } from "../../src/context/ThemeContext";
import lightTheme, { darkTheme } from "../../src/utils/theme";
import ThemedView from "../../src/components/ui/ThemedView";

const { width: screenWidth } = Dimensions.get("window");

export default function Analytics() {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">('month');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    loadTransactions();
  }, [timeframe]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const startDate = getStartDateForTimeframe(timeframe);
      const filtered = await getFilteredTransactions({
        startDate,
      });
      setTransactions(filtered);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total spending
  const getTotalSpending = () => {
    return transactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Calculate total income
  const getTotalIncome = () => {
    return transactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Calculate category-wise spending
  const getCategoryData = (): CategoryTotal[] => {
    const categoryMap: Record<string, { total: number; count: number }> = {};
    const debitTransactions = transactions.filter((t) => t.type === "debit");
    const totalSpent = debitTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Initialize categories with 0 values
    categories.forEach((category) => {
      categoryMap[category.name] = { total: 0, count: 0 };
    });

    // Add 'Others' category
    categoryMap["Others"] = { total: 0, count: 0 };

    // Calculate totals for each category
    debitTransactions.forEach((transaction) => {
      const category = transaction.category || "Others";
      if (categoryMap[category]) {
        categoryMap[category].total += transaction.amount;
        categoryMap[category].count += 1;
      } else {
        categoryMap["Others"].total += transaction.amount;
        categoryMap["Others"].count += 1;
      }
    });

    // Transform to array and calculate percentages
    return Object.entries(categoryMap)
      .map(([category, data], index) => ({
        category,
        total: data.total,
        count: data.count,
        percentage: totalSpent > 0 ? (data.total / totalSpent) * 100 : 0,
        color: getColorForCategory(category, index),
      }))
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);
  };

  // Get color for category
  const getColorForCategory = (category: string, index: number): string => {
    const colors = [
      "#FF6384", // Pink
      "#36A2EB", // Blue
      "#FFCE56", // Yellow
      "#4BC0C0", // Teal
      "#9966FF", // Purple
      "#FF9F40", // Orange
      "#8AC24A", // Light green
      "#607D8B", // Blue grey
      "#E91E63", // Pink
      "#2196F3", // Blue
    ];
    
    // Use the utility function from categoryEngine
    return getCategoryColor(category) || colors[index % colors.length];
  };

  // Prepare data for charts
  const getPieChartData = () => {
    const categoryData = getCategoryData();
    
    return categoryData.map((item) => ({
      name: item.category,
      amount: item.total,
      color: item.color,
      legendFontColor: isDarkMode ? theme.colors.textSecondary : "#7F7F7F",
      legendFontSize: 12,
    }));
  };

  // Group transactions by date for trend chart
  const getTrendChartData = () => {
    const today = new Date();
    const dateLabels: string[] = [];
    const spendingData: number[] = [];
    
    // Create date range based on timeframe
    const daysToShow = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
    
    // Initialize data points with 0
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date();
      date.setDate(today.getDate() - (daysToShow - 1 - i));
      
      const monthDay = `${date.getDate()}/${date.getMonth() + 1}`;
      dateLabels.push(monthDay);
      spendingData.push(0);
    }
    
    // Populate spending data
    transactions
      .filter(t => t.type === 'debit')
      .forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const dayDiff = Math.floor((today.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff >= 0 && dayDiff < daysToShow) {
          const index = daysToShow - 1 - dayDiff;
          spendingData[index] += transaction.amount;
        }
      });
    
    return {
      labels: dateLabels.filter((_, i) => i % Math.ceil(daysToShow / 6) === 0), // Show fewer labels
      datasets: [
        {
          data: spendingData,
          color: () => theme.colors.primary,
          strokeWidth: 2,
        },
      ],
    };
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: theme.colors.primary,
    },
  };

  if (loading) {
    return (
      <ThemedView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>Loading analytics...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.timeframeContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Time Period</Text>
          <SegmentedButtons
            value={timeframe}
            onValueChange={(value) => setTimeframe(value as "week" | "month" | "year")}
            buttons={[
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
              { value: "year", label: "Year" },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics-outline" size={48} color={theme.colors.textHint} />
            <Text style={[styles.emptyText, { color: theme.colors.textPrimary }]}>No transactions found</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Add some transactions to see analytics
            </Text>
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>
                    Total Spent
                  </Text>
                  <Text style={[styles.cardAmount, { color: theme.colors.debit }]}>
                    ₹{getTotalSpending().toLocaleString('en-IN')}
                  </Text>
                </Card.Content>
              </Card>

              <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>
                    Total Income
                  </Text>
                  <Text style={[styles.cardAmount, { color: theme.colors.credit }]}>
                    ₹{getTotalIncome().toLocaleString('en-IN')}
                  </Text>
                </Card.Content>
              </Card>
            </View>

            {/* Category Breakdown */}
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Spending by Category</Text>
            <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                {getCategoryData().length > 0 ? (
                  <PieChart
                    data={getPieChartData()}
                    width={screenWidth - 64}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                ) : (
                  <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
                    No expense data available
                  </Text>
                )}
              </Card.Content>
            </Card>

            {/* Spending Trend */}
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Spending Trend</Text>
            <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <LineChart
                  data={getTrendChartData()}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              </Card.Content>
            </Card>

            {/* Top Categories */}
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Top Categories</Text>
            <Card style={[styles.categoriesCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                {getCategoryData().slice(0, 5).map((category, index) => (
                  <View key={index} style={styles.categoryRow}>
                    <View style={styles.categoryNameContainer}>
                      <View
                        style={[
                          styles.categoryColorDot,
                          { backgroundColor: category.color },
                        ]}
                      />
                      <Text style={[styles.categoryName, { color: theme.colors.textPrimary }]}>
                        {category.category}
                      </Text>
                    </View>
                    <View style={styles.categoryInfoContainer}>
                      <Text style={[styles.categoryAmount, { color: theme.colors.textPrimary }]}>
                        ₹{category.total.toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.categoryPercentage, { color: theme.colors.textSecondary }]}>
                        {category.percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </Card.Content>
            </Card>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  timeframeContainer: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  cardTitle: {
    fontSize: 14,
  },
  cardAmount: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },
  chartCard: {
    marginBottom: 16,
  },
  categoriesCard: {
    marginBottom: 24,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  categoryNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
  },
  categoryInfoContainer: {
    alignItems: "flex-end",
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: "500",
  },
  categoryPercentage: {
    fontSize: 12,
    marginTop: 2,
  },
});