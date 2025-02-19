import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/Context/AuthContext';
import { router } from 'expo-router';

const SplashScreenComponent = () => {
  const { user } = useAuth();

  useEffect(() => {
    const prepare = async () => {
      await SplashScreen.preventAutoHideAsync();
      // Simulate a loading delay
      setTimeout(async () => {
        await SplashScreen.hideAsync();
        if (user) {
          router.replace('/(tabs)/home'); // Navigate to home if user is logged in
        } else {
          router.replace('/(auth)/Login'); // Navigate to login if not logged in
        }
      }, 2000); // Adjust the delay as needed
    };

    prepare();
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Your App!</Text>
      {/* You can add a logo or any other component here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', // Match this with your splash background color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default SplashScreenComponent; 