import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Server } from 'node:http';
import { createApp } from '../config/app';

describe('Health Check Routes (e2e)', () => {
  let app: ReturnType<typeof createApp>;
  let server: Server;

  beforeAll(() => {
    app = createApp();
    server = app.listen();
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  describe('GET /v1/health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app.callback())
        .get('/v1/health')
        .expect(200)
        .expect('Content-Type', /application\/json/);

      expect(response.body).toMatchObject({
        status: expect.stringMatching(/^(UP|DOWN)$/),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });
    });
  });
});
