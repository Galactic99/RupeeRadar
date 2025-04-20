import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from "react-native";
import { Text, SegmentedButtons, Card, useTheme } from "react-native-paper";
import { PieChart, LineChart } from "react-native-chart-kit";
import { Transaction, CategoryTotal } from "../../src/types/transaction";
import { getFilteredTransactions } from "../../src/services/storageService";
import { getStartDateForTimeframe } from "../../src/utils/dateUtils";
import { Ionicons } from "@expo/vector-icons";
import { categories, getCategoryColor } from "../../src/utils/categoryEngine";

const { width: screenWidth } = Dimensions.get("window");

export default function Analytics() {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">('month');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

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
      legendFontColor: "#7F7F7F",
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.timeframeContainer}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Time Period</Text>
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
          <Ionicons name="analytics-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No transactions found</Text>
          <Text style={styles.emptySubtext}>
            Add some transactions to see analytics
          </Text>
        </View>
      ) : (
        <>
          <Card style={styles.card}>
            <Card.Title title="Spending Overview" />
            <Card.Content style={styles.summaryContainer}>
              <View style={styles.summaryItem}>
                <Text variant="bodyLarge">Total Spending</Text>
                <Text variant="headlineMedium" style={{ color: theme.colors.error }}>
                  ₹{getTotalSpending().toFixed(0)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text variant="bodyLarge">Total Income</Text>
                <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
                  ₹{getTotalIncome().toFixed(0)}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="Category Breakdown" />
            <Card.Content>
              {getPieChartData().length > 0 ? (
                <>
                  <PieChart
                    data={getPieChartData()}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={{
                      backgroundColor: '#ffffff',
                      backgroundGradientFrom: '#ffffff',
                      backgroundGradientTo: '#ffffff',
                      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                  
                  <View style={styles.categoryList}>
                    {getCategoryData().map((item) => (
                      <View key={item.category} style={styles.categoryItem}>
                        <View style={styles.categoryHeader}>
                          <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
                          <Text variant="bodyMedium">{item.category}</Text>
                        </View>
                        <View style={styles.categoryDetails}>
                          <Text variant="bodyMedium">₹{item.total.toFixed(0)}</Text>
                          <Text variant="bodySmall">{item.percentage.toFixed(1)}%</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <Text>No spending data to display</Text>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="Spending Trend" />
            <Card.Content>
              <LineChart
                data={getTrendChartData()}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: theme.colors.primary,
                  },
                }}
                bezier
                style={styles.chart}
              />
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 16,
  },
  timeframeContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  divider: {
    width: 1,
    height: "80%",
    backgroundColor: "#e0e0e0",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  categoryList: {
    marginTop: 16,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "40%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
});