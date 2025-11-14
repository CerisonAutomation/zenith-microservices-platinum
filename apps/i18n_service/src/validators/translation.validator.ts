import { z } from 'zod';
import { config } from '../config';

/**
 * Language parameter validation
 */
export const languageParamSchema = z.object({
  language: z
    .string()
    .min(2)
    .max(5)
    .refine(
      (lang) => config.supportedLanguages.includes(lang),
      { message: 'Unsupported language' }
    ),
});

/**
 * Translation key parameter validation
 */
export const translationKeySchema = z.object({
  language: z.string().min(2).max(5),
  key: z.string().min(1),
});

/**
 * Batch translation request validation
 */
export const batchTranslationSchema = z.object({
  language: z.string().min(2).max(5),
  keys: z.array(z.string().min(1)).min(1).max(100),
  variables: z.record(z.string(), z.record(z.string(), z.any())).optional(),
});

/**
 * Plural translation query validation
 */
export const pluralQuerySchema = z.object({
  count: z.string().regex(/^\d+$/).transform(Number),
  options: z.record(z.string(), z.any()).optional(),
});

/**
 * Validate request against schema
 */
export const validate = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown): T => {
    return schema.parse(data);
  };
};
