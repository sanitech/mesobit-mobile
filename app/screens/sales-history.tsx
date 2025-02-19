import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import Header from '@/components/Header';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import axios from 'axios';
import { useAuth } from '@/Context/AuthContext';

interface ReportData {
  OrdersCount: number;
  revenue: number;
  topCategories: {
    category_name: string;
    totalOrderCount: number;
    revenue: number;
    icon?: string;
  }[];
  popularItems: {
    item_name: string;
    totalOrderCount: number;
    revenue: number;
    image_url?: string;
  }[];
  orderView: {
    order_local_id: string;
    orderAt: string;
    total_price: number;
    order_type: string;
    status: string;
  }[];
}

const SalesHistory = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: new Date(),
    category: "",
    time_based: "today",
  });
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("am-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `/reports/${user?.vendor_id}`,
        dateRange
      );
      setReportData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange.time_based]);

  const StatCard = ({ title, value, color, icon, description }: { 
    title: string; 
    value: string | number; 
    color?: string;
    icon: string;
    description?: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statTitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{title}</Text>
      <Text style={[styles.statValue, { color: color || (isDark ? '#F3F4F6' : '#111827') }]}>
        {value}
      </Text>
      {description && (
        <Text style={[styles.statDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          {description}
        </Text>
      )}
    </View>
  );

  const TimeFilterButton = ({ title, value }: { title: string; value: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        dateRange.time_based === value && styles.activeFilterButton
      ]}
      onPress={() => setDateRange(prev => ({ ...prev, time_based: value }))}
    >
      <Text style={[
        styles.filterText,
        dateRange.time_based === value && styles.activeFilterText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    filterContainer: {
      padding: 16,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#F3F4F6',
      marginRight: 8,
    },
    activeFilterButton: {
      backgroundColor: '#FF922E',
    },
    filterText: {
      fontSize: 14,
      color: '#6B7280',
    },
    activeFilterText: {
      color: '#FFFFFF',
    },
    loader: {
      marginTop: 20,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 16,
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: '30%',
      padding: 16,
      borderRadius: 16,
      marginBottom: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    statTitle: {
      fontSize: 14,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '600',
    },
    statDescription: {
      fontSize: 12,
      marginTop: 4,
    },
    section: {
      padding: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
    },
    sectionSubtitle: {
      fontSize: 14,
      marginBottom: 16,
    },
    itemCard: {
      width: 200,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      marginRight: 12,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    itemImage: {
      width: '100%',
      height: 120,
    },
    itemInfo: {
      padding: 12,
      backgroundColor: isDark ? '#374151' : '#FFFFFF',
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F3F4F6' : '#111827',
    },
    itemCount: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 4,
    },
    itemRevenue: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FF922E',
      marginTop: 4,
    },
    orderCard: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    orderId: {
      fontSize: 16,
      fontWeight: '600',
    },
    orderAmount: {
      fontSize: 16,
      fontWeight: '600',
    },
    orderFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    orderType: {
      fontSize: 14,
      color: '#6B7280',
    },
    orderDate: {
      fontSize: 14,
      color: '#6B7280',
    },
    noDataContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    noDataIcon: {
      marginBottom: 16,
    },
    noDataText: {
      fontSize: 16,
      fontWeight: '500',
      textAlign: 'center',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    refreshButton: {
      marginTop: 16,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: '#FF922E',
      borderRadius: 8,
    },
    refreshButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
  });

  return (
    <ThemedView style={styles.container}>
      <Header title="Sales Report" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Time Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterContainer}
        >
          <TimeFilterButton title="Today" value="today" />
          <TimeFilterButton title="This Week" value="week" />
          <TimeFilterButton title="This Month" value="month" />
          <TimeFilterButton title="This Year" value="year" />
        </ScrollView>

        {isLoading ? (
          <ActivityIndicator size="large" color="#FF922E" style={styles.loader} />
        ) : reportData ? (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard 
                title="Total Orders" 
                value={reportData.OrdersCount} 
                color="#FF922E"
                icon="shopping"
                description="Orders processed today"
              />
              <StatCard 
                title="Total Revenue" 
                value={formatCurrency(reportData.revenue)}
                color="#059669"
                icon="cash-multiple"
                description="Total earnings"
              />
              <StatCard 
                title="Average Order" 
                value={formatCurrency(reportData.revenue / reportData.OrdersCount)}
                color="#0EA5E9"
                icon="calculator"
                description="Average order value"
              />
            </View>

            {/* Popular Items */}
            {reportData.popularItems?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons 
                    name="star" 
                    size={24} 
                    color={isDark ? '#F59E0B' : '#D97706'} 
                  />
                  <Text style={[styles.sectionTitle, { color: isDark ? '#F3F4F6' : '#111827' }]}>
                    Popular Items
                  </Text>
                </View>
                <Text style={[styles.sectionSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  Best performing menu items
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {reportData.popularItems.map((item, index) => (
                    <View key={index} style={styles.itemCard}>
                      {item.image_url && (
                        <Image 
                          source={{ uri: process.env.EXPO_PUBLIC_IMAGE_URL+ item.image_url }}
                          style={styles.itemImage}
                        />
                      )}
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.item_name}</Text>
                        <Text style={styles.itemCount}>{item.totalOrderCount} orders</Text>
                        <Text style={styles.itemRevenue}>{formatCurrency(item.revenue)}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Recent Orders */}
            {reportData.orderView?.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#F3F4F6' : '#111827' }]}>
                  Recent Orders
                </Text>
                {reportData.orderView.map((order, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.orderCard,
                      { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }
                    ]}
                  >
                    <View style={styles.orderHeader}>
                      <Text style={[styles.orderId, { color: isDark ? '#F3F4F6' : '#111827' }]}>
                        {order.order_local_id}
                      </Text>
                      <Text style={[styles.orderAmount, { color: '#FF922E' }]}>
                        {formatCurrency(order.total_price)}
                      </Text>
                    </View>
                    <View style={styles.orderFooter}>
                      <Text style={styles.orderType}>{order.order_type}</Text>
                      <Text style={styles.orderDate}>
                        {new Date(order.orderAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
};

export default SalesHistory;
