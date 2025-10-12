import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isWeb = Platform.OS === "web";

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return isWeb ? localStorage.getItem(key) : await AsyncStorage.getItem(key);
    } catch (error) {
      console.error("Storage getItem error:", error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) localStorage.setItem(key, value);
      else await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error("Storage setItem error:", error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (isWeb) localStorage.removeItem(key);
      else await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error("Storage removeItem error:", error);
    }
  },
};
