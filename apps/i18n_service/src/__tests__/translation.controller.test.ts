import request from 'supertest';
import { app } from '../index';

// Wait for app to initialize
beforeAll((done) => {
  setTimeout(done, 2000);
});

describe('Translation Controller', () => {
  describe('GET /i18n/languages', () => {
    it('should return list of supported languages', async () => {
      const response = await request(app).get('/i18n/languages');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('languages');
      expect(Array.isArray(response.body.languages)).toBe(true);
      expect(response.body.languages).toContain('en');
    });
  });

  describe('GET /i18n/:language', () => {
    it('should return all translations for English', async () => {
      const response = await request(app).get('/i18n/en');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('language', 'en');
      expect(response.body).toHaveProperty('translations');
      expect(response.body.translations).toHaveProperty('Index');
    });

    it('should return all translations for Spanish', async () => {
      const response = await request(app).get('/i18n/es');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('language', 'es');
      expect(response.body).toHaveProperty('translations');
    });

    it('should return 400 for unsupported language', async () => {
      const response = await request(app).get('/i18n/fr');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /i18n/:language/:key', () => {
    it('should return specific translation key', async () => {
      const response = await request(app).get('/i18n/en/Index.title');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('language', 'en');
      expect(response.body).toHaveProperty('key', 'Index.title');
      expect(response.body).toHaveProperty('translation');
    });

    it('should support nested keys', async () => {
      const response = await request(app).get('/i18n/en/Index.error.server');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('translation');
    });
  });

  describe('POST /i18n/translate', () => {
    it('should batch translate multiple keys', async () => {
      const response = await request(app)
        .post('/i18n/translate')
        .send({
          language: 'en',
          keys: ['Index.title', 'Index.description'],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('language', 'en');
      expect(response.body).toHaveProperty('translations');
      expect(response.body.translations).toHaveProperty('Index.title');
      expect(response.body.translations).toHaveProperty('Index.description');
    });

    it('should use fallback language', async () => {
      const response = await request(app)
        .post('/i18n/translate')
        .send({
          language: 'fr',
          keys: ['Index.title'],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('language', 'en');
      expect(response.body).toHaveProperty('fallbackUsed', true);
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/i18n/translate')
        .send({
          language: 'en',
          // Missing keys
        });

      expect(response.status).toBe(400);
    });

    it('should support variables in batch translation', async () => {
      const response = await request(app)
        .post('/i18n/translate')
        .send({
          language: 'en',
          keys: ['Index.title'],
          variables: {
            'Index.title': { name: 'Test' },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.translations).toHaveProperty('Index.title');
    });
  });

  describe('DELETE /i18n/cache', () => {
    it('should clear all cache', async () => {
      const response = await request(app).delete('/i18n/cache');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('cache cleared');
    });

    it('should clear cache for specific language', async () => {
      const response = await request(app)
        .delete('/i18n/cache')
        .query({ language: 'en' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('en');
    });
  });
});

describe('Health Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'i18n-service');
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app).get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });
});

describe('Metrics Endpoint', () => {
  describe('GET /metrics', () => {
    it('should return metrics', async () => {
      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('requests');
      expect(response.body).toHaveProperty('cache');
    });
  });
});
