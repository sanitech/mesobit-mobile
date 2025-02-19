import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import Header from '@/components/Header';
import { useColorScheme } from 'react-native';
import { useAuth } from '@/Context/AuthContext';
import axios from 'axios';

interface RevenueData {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
}

const Revenue = () => {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [revenue, setRevenue] = useState<RevenueData>({
    dailyRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchRevenue = async () => {
    try {
      const response = await axios.get(`/revenue/${user?.vendor_id}`);
      setRevenue(response.data);
    } catch (error) {
      console.error('Failed to fetch revenue:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRevenue();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <Header title="Revenue" />
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Revenue content here */}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});

export default Revenue; 