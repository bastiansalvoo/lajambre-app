import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function getItemAsync(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  } else {
    return SecureStore.getItemAsync(key);
  }
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Storage error:', e);
    }
  } else {
    return SecureStore.setItemAsync(key, value);
  }
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Storage error:', e);
    }
  } else {
    return SecureStore.deleteItemAsync(key);
  }
}
