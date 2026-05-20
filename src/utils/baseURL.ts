import { Platform } from "react-native";

export const BASE_URL = __DEV__
  ? "http://192.168.0.118:9191"  // dev — même pour Android et iOS
  : "https://api.gonifty.ca";    // prod