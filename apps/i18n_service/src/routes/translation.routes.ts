import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import {
  getAllTranslations,
  getTranslationByKey,
  batchTranslate,
  getSupportedLanguages,
  clearCache,
} from '../controllers/translation.controller';

export const translationRouter = Router();

/**
 * GET /i18n/languages - Get supported languages
 */
translationRouter.get('/languages', asyncHandler(getSupportedLanguages));

/**
 * POST /i18n/translate - Batch translate multiple keys
 */
translationRouter.post('/translate', asyncHandler(batchTranslate));

/**
 * DELETE /i18n/cache - Clear translation cache
 */
translationRouter.delete('/cache', asyncHandler(clearCache));

/**
 * GET /i18n/:language - Get all translations for a language
 */
translationRouter.get('/:language', asyncHandler(getAllTranslations));

/**
 * GET /i18n/:language/:key - Get specific translation key
 */
translationRouter.get('/:language/:key', asyncHandler(getTranslationByKey));
