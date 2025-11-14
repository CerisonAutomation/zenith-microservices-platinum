import NodeCache from 'node-cache';
import { i18next } from '../i18n';
import { config } from '../config';
import { metrics } from '../middleware/metrics.middleware';
import {
  TranslationRequest,
  TranslationResult,
  InterpolationOptions,
  PluralOptions
} from '../types';

/**
 * Translation service with caching and advanced features
 */
class TranslationService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: config.cacheTtl,
      checkperiod: config.cacheCheckPeriod,
      useClones: false,
    });

    // Listen to cache events
    this.cache.on('set', (key) => {
      console.log(`Cache set: ${key}`);
    });

    this.cache.on('expired', (key) => {
      console.log(`Cache expired: ${key}`);
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { keys: number; hits: number; misses: number } {
    const stats = this.cache.getStats();
    return {
      keys: this.cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
    };
  }

  /**
   * Get all translations for a language
   */
  async getAllTranslations(language: string): Promise<Record<string, any>> {
    const cacheKey = `lang:${language}`;

    // Check cache first
    if (config.cacheEnabled) {
      const cached = this.cache.get<Record<string, any>>(cacheKey);
      if (cached) {
        metrics.incrementCacheHits();
        return cached;
      }
      metrics.incrementCacheMisses();
    }

    // Check if language is supported
    if (!config.supportedLanguages.includes(language)) {
      throw new Error(`Language '${language}' is not supported`);
    }

    // Get translations from i18next
    const translations = i18next.getResourceBundle(language, 'translation');

    if (!translations) {
      throw new Error(`No translations found for language '${language}'`);
    }

    // Cache the result
    if (config.cacheEnabled) {
      this.cache.set(cacheKey, translations);
    }

    return translations;
  }

  /**
   * Get a specific translation key
   */
  async getTranslation(
    language: string,
    key: string,
    options?: InterpolationOptions
  ): Promise<any> {
    const cacheKey = `translation:${language}:${key}:${JSON.stringify(options || {})}`;

    // Check cache first
    if (config.cacheEnabled && !options) {
      const cached = this.cache.get<any>(cacheKey);
      if (cached !== undefined) {
        metrics.incrementCacheHits();
        return cached;
      }
      metrics.incrementCacheMisses();
    }

    // Check if language is supported
    if (!config.supportedLanguages.includes(language)) {
      // Fallback to default language
      language = config.defaultLanguage;
    }

    // Get translation with interpolation
    let translation: any;

    if (options) {
      translation = i18next.t(key, { lng: language, ...options });
    } else {
      translation = i18next.t(key, { lng: language });
    }

    // If key not found, try fallback language
    if (translation === key && language !== config.defaultLanguage) {
      translation = i18next.t(key, { lng: config.defaultLanguage });
    }

    // Cache the result (only if no interpolation)
    if (config.cacheEnabled && !options) {
      this.cache.set(cacheKey, translation);
    }

    return translation;
  }

  /**
   * Batch translate multiple keys
   */
  async batchTranslate(request: TranslationRequest): Promise<TranslationResult> {
    const { language, keys, variables } = request;

    // Validate language
    let targetLanguage = language;
    let fallbackUsed = false;

    if (!config.supportedLanguages.includes(language)) {
      targetLanguage = config.defaultLanguage;
      fallbackUsed = true;
    }

    const translations: Record<string, any> = {};

    // Process each key
    for (const key of keys) {
      try {
        const options = variables?.[key];
        translations[key] = await this.getTranslation(targetLanguage, key, options);
      } catch (error) {
        console.error(`Error translating key '${key}':`, error);
        translations[key] = key; // Return the key itself as fallback
      }
    }

    return {
      language: targetLanguage,
      translations,
      fallbackUsed,
    };
  }

  /**
   * Get translation with pluralization support
   */
  async getPlural(
    language: string,
    key: string,
    count: number,
    options?: PluralOptions
  ): Promise<string> {
    const cacheKey = `plural:${language}:${key}:${count}:${JSON.stringify(options || {})}`;

    // Check cache first
    if (config.cacheEnabled && !options) {
      const cached = this.cache.get<string>(cacheKey);
      if (cached !== undefined) {
        metrics.incrementCacheHits();
        return cached;
      }
      metrics.incrementCacheMisses();
    }

    // Validate language
    let targetLanguage = language;
    if (!config.supportedLanguages.includes(language)) {
      targetLanguage = config.defaultLanguage;
    }

    // Get plural translation
    const translation = i18next.t(key, {
      lng: targetLanguage,
      count,
      ...options,
    }) as string;

    // Cache the result (only if no additional options)
    if (config.cacheEnabled && !options) {
      this.cache.set(cacheKey, translation);
    }

    return translation;
  }

  /**
   * Clear cache for specific language or all
   */
  clearCache(language?: string): void {
    if (language) {
      const keys = this.cache.keys();
      const keysToDelete = keys.filter(k => k.includes(language));
      this.cache.del(keysToDelete);
      console.log(`Cache cleared for language: ${language} (${keysToDelete.length} keys)`);
    } else {
      this.cache.flushAll();
      console.log('All cache cleared');
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return config.supportedLanguages;
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(language: string): boolean {
    return config.supportedLanguages.includes(language);
  }
}

export const translationService = new TranslationService();
