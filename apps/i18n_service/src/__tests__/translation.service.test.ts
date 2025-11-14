import { translationService } from '../services/translation.service';
import { initializeI18n } from '../i18n';

describe('TranslationService', () => {
  beforeAll(async () => {
    await initializeI18n();
  });

  afterEach(() => {
    translationService.clearCache();
  });

  describe('getAllTranslations', () => {
    it('should return all translations for English', async () => {
      const translations = await translationService.getAllTranslations('en');

      expect(translations).toBeDefined();
      expect(translations).toHaveProperty('Index');
      expect(translations.Index).toHaveProperty('title');
    });

    it('should return all translations for Spanish', async () => {
      const translations = await translationService.getAllTranslations('es');

      expect(translations).toBeDefined();
      expect(translations).toHaveProperty('Index');
    });

    it('should throw error for unsupported language', async () => {
      await expect(
        translationService.getAllTranslations('fr')
      ).rejects.toThrow('not supported');
    });

    it('should use cache on second request', async () => {
      const first = await translationService.getAllTranslations('en');
      const second = await translationService.getAllTranslations('en');

      expect(first).toEqual(second);
    });
  });

  describe('getTranslation', () => {
    it('should return specific translation key', async () => {
      const translation = await translationService.getTranslation('en', 'Index.title');

      expect(translation).toBeDefined();
      expect(typeof translation).toBe('string');
    });

    it('should support interpolation', async () => {
      const translation = await translationService.getTranslation('en', 'Index.title', {
        name: 'John',
      });

      expect(translation).toBeDefined();
    });

    it('should fallback to default language for unsupported language', async () => {
      const translation = await translationService.getTranslation('fr', 'Index.title');

      expect(translation).toBeDefined();
    });

    it('should return nested translations', async () => {
      const translation = await translationService.getTranslation('en', 'Index.error.server');

      expect(translation).toBeDefined();
    });
  });

  describe('batchTranslate', () => {
    it('should translate multiple keys', async () => {
      const result = await translationService.batchTranslate({
        language: 'en',
        keys: ['Index.title', 'Index.description'],
      });

      expect(result.language).toBe('en');
      expect(result.translations).toHaveProperty('Index.title');
      expect(result.translations).toHaveProperty('Index.description');
      expect(result.fallbackUsed).toBe(false);
    });

    it('should use fallback language when needed', async () => {
      const result = await translationService.batchTranslate({
        language: 'fr',
        keys: ['Index.title'],
      });

      expect(result.language).toBe('en');
      expect(result.fallbackUsed).toBe(true);
    });

    it('should support variables in batch translation', async () => {
      const result = await translationService.batchTranslate({
        language: 'en',
        keys: ['Index.title'],
        variables: {
          'Index.title': { name: 'Test' },
        },
      });

      expect(result.translations).toHaveProperty('Index.title');
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return list of supported languages', () => {
      const languages = translationService.getSupportedLanguages();

      expect(Array.isArray(languages)).toBe(true);
      expect(languages).toContain('en');
      expect(languages).toContain('es');
      expect(languages).toContain('ja');
      expect(languages).toContain('zh');
      expect(languages).toContain('ar');
    });
  });

  describe('isLanguageSupported', () => {
    it('should return true for supported languages', () => {
      expect(translationService.isLanguageSupported('en')).toBe(true);
      expect(translationService.isLanguageSupported('es')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(translationService.isLanguageSupported('fr')).toBe(false);
      expect(translationService.isLanguageSupported('de')).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear all cache', async () => {
      await translationService.getAllTranslations('en');
      const statsBefore = translationService.getCacheStats();

      translationService.clearCache();
      const statsAfter = translationService.getCacheStats();

      expect(statsAfter.keys).toBe(0);
    });

    it('should clear cache for specific language', async () => {
      await translationService.getAllTranslations('en');
      await translationService.getAllTranslations('es');

      translationService.clearCache('en');
      const stats = translationService.getCacheStats();

      expect(stats.keys).toBeGreaterThan(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const stats = translationService.getCacheStats();

      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(typeof stats.keys).toBe('number');
    });
  });
});
