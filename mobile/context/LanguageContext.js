import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translations, { LANGUAGES } from "../lib/translations";

const LANGUAGE_KEY = "gg_language";

function humanizeFallbackKey(key) {
  if (typeof key !== "string") return "";
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
  languages: LANGUAGES,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en");

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((stored) => {
        if (stored && translations[stored]) setLanguageState(stored);
      })
      .catch(() => {});
  }, []);

  const setLanguage = async (lang) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch {}
  };

  const t = (key) => {
    const dict = translations[language] || translations.en;
    return dict[key] ?? translations.en[key] ?? humanizeFallbackKey(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
