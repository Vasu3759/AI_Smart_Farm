import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import hi from './hi.json';

const LANGUAGE_KEY = 'app_language';

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        return callback(savedLanguage);
      }
      return callback('en');
    } catch (error) {
      console.log('Error reading language', error);
      return callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    interpolation: {
      escapeValue: false, // React already safe from xss
    },
  });

export default i18n;
