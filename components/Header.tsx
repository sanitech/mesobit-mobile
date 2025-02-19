import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/Context/AuthContext';

const Header = ({title}: {title: string}) => {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
         <StatusBar
          backgroundColor={"#FF922E"}
        />
      <View style={styles.topRow}>
        <View style={styles.userInfo}>
          <Image
            // source={ user?.profile_pic ? { uri: user.profile_pic } : require('@/assets/images/default-avatar.png')}
            source={{uri: user?.profile_pic? user.profile_pic : "https://www.prolandscapermagazine.com/wp-content/uploads/2022/05/blank-profile-photo.png"}}
            style={styles.avatar}
          />
          <View style={styles.textContainer}>
            <ThemedText style={styles.name}>{user?.full_name || 'User Name'}</ThemedText>
            <ThemedText style={styles.role}>{user?.position}</ThemedText>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton}>

          <Ionicons name="notifications-outline" size={24} color="#FF922E" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={20} color="#FF922E" />
        <ThemedText style={styles.locationText}>{title}</ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: '#FF922E',
    borderBottomRightRadius:20,
    borderBottomLeftRadius:20
  },
  topRow: {
    flexDirection: 'row',

    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  textContainer: {
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  role: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: 'white',
  },
});

export default Header; 