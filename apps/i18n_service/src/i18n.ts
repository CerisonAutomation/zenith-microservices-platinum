import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
import { config } from './config';

/**
 * Initialize i18next with filesystem backend
 */
export const initializeI18n = async (): Promise<void> => {
  await i18next.use(Backend).init({
    // Language settings
    lng: config.defaultLanguage,
    fallbackLng: config.defaultLanguage,
    supportedLngs: config.supportedLanguages,
    preload: config.supportedLanguages,

    // Backend configuration
    backend: {
      loadPath: path.join(process.cwd(), config.translationPath, '{{lng}}.json'),
    },

    // Features
    returnNull: false,
    returnEmptyString: false,
    returnObjects: true,

    // Interpolation
    interpolation: {
      escapeValue: false, // Not needed for non-HTML usage
      prefix: '{{',
      suffix: '}}',
    },

    // Performance
    load: 'currentOnly',
    ns: ['translation'],
    defaultNS: 'translation',

    // Development
    debug: config.nodeEnv === 'development',
  });

  console.log('✓ i18next initialized with languages:', config.supportedLanguages);
};

export { i18next };
