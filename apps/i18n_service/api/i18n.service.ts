/**
 * Internationalization Service
 * Handles multi-language translation and locale management
 */

export interface I18nService {
  // Get translations
  getTranslations(locale: string, namespace?: string): Promise<Translations>;
  
  // Translate text
  translate(key: string, locale: string, params?: any): Promise<string>;
  
  // Manage locales
  getSupportedLocales(): Promise<Locale[]>;
  setDefaultLocale(locale: string): Promise<void>;
  
  // Dictionary management
  addTranslation(locale: string, key: string, value: string): Promise<void>;
  updateTranslation(locale: string, key: string, value: string): Promise<void>;
  deleteTranslation(locale: string, key: string): Promise<void>;
}

export interface Locale {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
  enabled: boolean;
}

export interface Translations {
  [key: string]: string | Translations;
}
