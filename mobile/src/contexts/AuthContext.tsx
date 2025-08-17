import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { api } from '../services/api';

interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isBiometricEnabled: boolean;
  login: (phone: string, mpin: string) => Promise<void>;
  loginWithBiometric: () => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  createMpin: (phone: string, mpin: string) => Promise<void>;
  logout: () => Promise<void>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const userData = await SecureStore.getItemAsync('user');
      const biometricEnabled = await SecureStore.getItemAsync('biometricEnabled');

      if (token && userData) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(JSON.parse(userData));
      }

      setIsBiometricEnabled(biometricEnabled === 'true');
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (phone: string) => {
    try {
      await api.post('/auth/send-otp', { phone });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send OTP');
    }
  };

  const verifyOtp = async (phone: string, otp: string) => {
    try {
      await api.post('/auth/verify-otp', { phone, otp });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to verify OTP');
    }
  };

  const createMpin = async (phone: string, mpin: string) => {
    try {
      await api.post('/auth/create-mpin', { phone, mpin });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create MPIN');
    }
  };

  const login = async (phone: string, mpin: string) => {
    try {
      const response = await api.post('/auth/login-mpin', { phone, mpin });
      const { user: userData, accessToken, refreshToken } = response.data.data;

      // Store tokens and user data
      await SecureStore.setItemAsync('token', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      await SecureStore.setItemAsync('credentials', JSON.stringify({ phone, mpin }));

      // Set authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const loginWithBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        throw new Error('Biometric authentication not available');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with biometric',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        const credentials = await SecureStore.getItemAsync('credentials');
        if (credentials) {
          const { phone, mpin } = JSON.parse(credentials);
          await login(phone, mpin);
        } else {
          throw new Error('No stored credentials found');
        }
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Biometric login failed');
    }
  };

  const enableBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        throw new Error('Biometric authentication not available');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric login',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        await SecureStore.setItemAsync('biometricEnabled', 'true');
        setIsBiometricEnabled(true);
      } else {
        throw new Error('Biometric setup failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to enable biometric');
    }
  };

  const disableBiometric = async () => {
    try {
      await SecureStore.deleteItemAsync('biometricEnabled');
      await SecureStore.deleteItemAsync('credentials');
      setIsBiometricEnabled(false);
    } catch (error) {
      console.error('Failed to disable biometric:', error);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear stored data
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
      if (!isBiometricEnabled) {
        await SecureStore.deleteItemAsync('credentials');
      }

      // Clear authorization header
      delete api.defaults.headers.common['Authorization'];

      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    isBiometricEnabled,
    login,
    loginWithBiometric,
    sendOtp,
    verifyOtp,
    createMpin,
    logout,
    enableBiometric,
    disableBiometric,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}