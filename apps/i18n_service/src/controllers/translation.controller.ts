import { Request, Response } from 'express';
import { translationService } from '../services/translation.service';
import { AppError } from '../middleware/error.middleware';
import {
  validate,
  languageParamSchema,
  translationKeySchema,
  batchTranslationSchema,
} from '../validators/translation.validator';

/**
 * Get all translations for a language
 */
export const getAllTranslations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { language } = validate(languageParamSchema)(req.params);

    const translations = await translationService.getAllTranslations(language);

    res.json({
      language,
      translations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(400, error.message);
    }
    throw error;
  }
};

/**
 * Get specific translation key
 */
export const getTranslationByKey = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { language, key } = validate(translationKeySchema)(req.params);
    const options = req.query.variables ? JSON.parse(req.query.variables as string) : undefined;

    const translation = await translationService.getTranslation(language, key, options);

    res.json({
      language,
      key,
      translation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(400, error.message);
    }
    throw error;
  }
};

/**
 * Batch translate multiple keys
 */
export const batchTranslate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const translationRequest = validate(batchTranslationSchema)(req.body);

    const result = await translationService.batchTranslate(translationRequest);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(400, error.message);
    }
    throw error;
  }
};

/**
 * Get supported languages
 */
export const getSupportedLanguages = async (
  req: Request,
  res: Response
): Promise<void> => {
  const languages = translationService.getSupportedLanguages();

  res.json({
    languages,
    count: languages.length,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Clear cache
 */
export const clearCache = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { language } = req.query;

  translationService.clearCache(language as string);

  res.json({
    message: language
      ? `Cache cleared for language: ${language}`
      : 'All cache cleared',
    timestamp: new Date().toISOString(),
  });
};
