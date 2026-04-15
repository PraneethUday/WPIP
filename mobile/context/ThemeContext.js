import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DARK_COLORS, LIGHT_COLORS, FONTS, SIZES, SHADOWS } from "../constants/theme";

const THEME_KEY = "gg_theme_mode";

const ThemeContext = createContext({
  isDark: true,
  toggleTheme: () => {},
  COLORS: DARK_COLORS,
  FONTS,
  SIZES,
  SHADOWS,
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === "light") setIsDark(false);
    }).catch(() => {});
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    try {
      await AsyncStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {}
  };

  const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, COLORS, FONTS, SIZES, SHADOWS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
