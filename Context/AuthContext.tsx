import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import axios from "axios";
import { router } from "expo-router";
import {
  setStorageItemAsync,
  getStorageItemAsync,
  clearStorageAsync,
} from "../utils/storage";
import asyncStore from "@react-native-async-storage/async-storage";

// Define types for user and context
interface User {
  staff_id: string;
  vendor_id: string;
  full_name: string;
  email: string;
  gender: string;
  date_of_birth: string;
  date_of_joining: string;
  username: string;
  status: number;
  department: string;
  position: string;
  profile_pic: string;
  work_schedule: string;
  salary: string;
  contact_number: string;
  address: string;
  emergency_contact: string;
  documentation: null | string;
  account_status: number;
  created_at: string;
  update_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (userData: User) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await getStorageItemAsync("userToken");
      const userPin = await getStorageItemAsync("userPin");

      if (token) {
        setUserToken(token);
        const userInfo = await asyncStore.getItem("userInfo");
        if (userInfo) {
          setUser(JSON.parse(userInfo) as User);
        }
        if (userPin) {
          router.replace("/(auth)/PinCode");
        } else {
          router.replace("/(tabs)/home");
        }
      } else {
        router.replace("/(auth)/Login");
      }
    };
    checkLogin();
  }, []);

  const signIn = async (userData: any) => {
    const mockToken = userData.token;
    const userInfo = userData.userData;

    if (mockToken) {
      await setStorageItemAsync("userToken", mockToken);
      await asyncStore.setItem("userInfo", JSON.stringify(userInfo));
      setUserToken(mockToken);
      setUser(userInfo as User);
      router.replace("/(tabs)/home");
    } else {
      alert("Invalid Credentials");
    }
  };

  const signOut = async () => {
    try {
      await clearStorageAsync(); // Clear all stored data
      setUserToken(null);
      setUser(null);
      router.replace("/(auth)/Login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook for Safe Context Usage
const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };
