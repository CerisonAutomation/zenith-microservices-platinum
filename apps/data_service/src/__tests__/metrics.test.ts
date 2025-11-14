import request from 'supertest';
import { app } from '../index';

describe('Metrics', () => {
  describe('GET /metrics', () => {
    it('should return JSON metrics', async () => {
      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total_requests');
      expect(response.body).toHaveProperty('total_errors');
      expect(response.body).toHaveProperty('requests_by_endpoint');
    });
  });

  describe('GET /metrics/prometheus', () => {
    it('should return Prometheus format metrics', async () => {
      const response = await request(app).get('/metrics/prometheus');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('http_requests_total');
    });
  });
});
