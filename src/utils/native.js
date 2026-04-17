import { Capacitor } from "@capacitor/core";

// True when running inside the Android (or iOS) native app
export const isNative = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === "android";
export const isIOS = Capacitor.getPlatform() === "ios";
