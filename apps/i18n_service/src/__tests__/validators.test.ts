import {
  validate,
  languageParamSchema,
  translationKeySchema,
  batchTranslationSchema,
} from '../validators/translation.validator';

describe('Validators', () => {
  describe('languageParamSchema', () => {
    it('should validate supported language', () => {
      const result = validate(languageParamSchema)({ language: 'en' });
      expect(result.language).toBe('en');
    });

    it('should throw for unsupported language', () => {
      expect(() => {
        validate(languageParamSchema)({ language: 'fr' });
      }).toThrow();
    });

    it('should throw for invalid language format', () => {
      expect(() => {
        validate(languageParamSchema)({ language: 'e' });
      }).toThrow();

      expect(() => {
        validate(languageParamSchema)({ language: 'toolong' });
      }).toThrow();
    });
  });

  describe('translationKeySchema', () => {
    it('should validate translation key', () => {
      const result = validate(translationKeySchema)({
        language: 'en',
        key: 'Index.title',
      });

      expect(result.language).toBe('en');
      expect(result.key).toBe('Index.title');
    });

    it('should throw for empty key', () => {
      expect(() => {
        validate(translationKeySchema)({
          language: 'en',
          key: '',
        });
      }).toThrow();
    });
  });

  describe('batchTranslationSchema', () => {
    it('should validate batch translation request', () => {
      const result = validate(batchTranslationSchema)({
        language: 'en',
        keys: ['Index.title', 'Index.description'],
      });

      expect(result.language).toBe('en');
      expect(result.keys).toEqual(['Index.title', 'Index.description']);
    });

    it('should validate with variables', () => {
      const result = validate(batchTranslationSchema)({
        language: 'en',
        keys: ['Index.title'],
        variables: {
          'Index.title': { name: 'Test' },
        },
      });

      expect(result.variables).toBeDefined();
      expect(result.variables?.['Index.title']).toEqual({ name: 'Test' });
    });

    it('should throw for empty keys array', () => {
      expect(() => {
        validate(batchTranslationSchema)({
          language: 'en',
          keys: [],
        });
      }).toThrow();
    });

    it('should throw for too many keys', () => {
      const keys = Array(101).fill('Index.title');

      expect(() => {
        validate(batchTranslationSchema)({
          language: 'en',
          keys,
        });
      }).toThrow();
    });

    it('should throw for missing keys', () => {
      expect(() => {
        validate(batchTranslationSchema)({
          language: 'en',
        });
      }).toThrow();
    });
  });
});
