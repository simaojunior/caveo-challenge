import { describe, expect, it, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import type { Server } from 'node:http';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource, type Repository } from 'typeorm';
import { PgConnection } from '@/infra/repos/postgres/helpers/connection';
import { User } from '@/infra/repos/postgres/entities/user';
import { UserRole } from '@/domain/entities/user';

const mockTokenValidator = {
  validate: vi.fn(),
};

vi.mock('@/infra/gateways/jwt-token-handler', () => ({
  JwtTokenHandler: vi.fn().mockImplementation(() => mockTokenValidator),
}));

describe('User Routes (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let testDataSource: DataSource;
  let testConnection: PgConnection;
  let userRepo: Repository<User>;
  let app: ReturnType<typeof import('@/main/config/app').createApp>;
  let server: Server;
  const timeout = 60000;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15').start();

    const DATABASE_URL = container.getConnectionUri();

    testDataSource = new DataSource({
      type: 'postgres',
      url: DATABASE_URL,
      entities: [User],
      synchronize: true,
      logging: false,
    });

    await testDataSource.initialize();

    testConnection = new PgConnection(testDataSource);
    await testConnection.initialize();
    userRepo = testConnection.getRepository(User);

    vi.doMock('@/main/factories/infra/repos/postgres/helpers/connection', () => ({
      makePgConnection: () => testConnection,
    }));

    const { createApp } = await import('@/main/config/app');
    app = createApp();
    server = app.listen();
  }, timeout);

  afterAll(async () => {
    if (server) {
      server.close();
    }
    if (testDataSource?.isInitialized) {
      await testDataSource.destroy();
    }
    if (container) {
      await container.stop();
    }
    vi.clearAllMocks();
  }, timeout);

  beforeEach(async () => {
    await userRepo.clear();
    vi.clearAllMocks();
  });

  describe('GET /v1/me', () => {
    it('should return 401 if authorization header is not present', async () => {
      const { status } = await request(app.callback())
        .get('/v1/me');

      expect(status).toBe(401);
    });

    it('should return 200 with valid user data', async () => {
      const userId = faker.string.uuid();
      const userData = {
        id: userId,
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: UserRole.USER,
        externalId: faker.string.uuid(),
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      await userRepo.save(userData);

      mockTokenValidator.validate.mockResolvedValueOnce({
        internalId: userId,
        roles: [UserRole.USER],
      });

      const { status, body } = await request(app.callback())
        .get('/v1/me')
        .set('Authorization', 'Bearer valid-token');

      expect(status).toBe(200);
      expect(body).toEqual({
        id: userId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        isOnboarded: true,
      });
    });

    it('should return 404 when user is not found', async () => {
      const nonExistentUserId = faker.string.uuid();

      mockTokenValidator.validate.mockResolvedValueOnce({
        internalId: nonExistentUserId,
        roles: [UserRole.USER],
      });

      const { status } = await request(app.callback())
        .get('/v1/me')
        .set('Authorization', 'Bearer valid-token');

      expect(status).toBe(404);
    });
  });

  describe('PUT /v1/edit-account', () => {
    it('should return 401 if authorization header is not present', async () => {
      const { status } = await request(app.callback())
        .put('/v1/edit-account')
        .send({ name: faker.person.fullName() });

      expect(status).toBe(401);
    });

    it('should return 400 for invalid request data', async () => {
      const userId = faker.string.uuid();

      mockTokenValidator.validate.mockResolvedValueOnce({
        internalId: userId,
        roles: [UserRole.USER],
      });

      const { status } = await request(app.callback())
        .put('/v1/edit-account')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: '' });

      expect(status).toBe(400);
    });

    it('should return 200 when user updates their own name', async () => {
      const userId = faker.string.uuid();
      const userData = {
        id: userId,
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: UserRole.USER,
        externalId: faker.string.uuid(),
        isOnboarded: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      await userRepo.save(userData);

      const newName = faker.person.fullName();

      mockTokenValidator.validate.mockResolvedValueOnce({
        internalId: userId,
        roles: [UserRole.USER],
      });

      const { status, body } = await request(app.callback())
        .put('/v1/edit-account')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: newName });

      expect(status).toBe(200);
      expect(body).toEqual({
        id: userId,
        email: userData.email,
        name: newName,
        isOnboarded: true,
      });
    });

    it('should return 403 when regular user tries to change role', async () => {
      const userId = faker.string.uuid();
      const userData = {
        id: userId,
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: UserRole.USER,
        externalId: faker.string.uuid(),
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      await userRepo.save(userData);

      mockTokenValidator.validate.mockResolvedValueOnce({
        internalId: userId,
        roles: [UserRole.USER],
      });

      const { status } = await request(app.callback())
        .put('/v1/edit-account')
        .set('Authorization', 'Bearer valid-token')
        .send({ role: UserRole.ADMIN });

      expect(status).toBe(403);
    });

    it('should return 200 when admin updates another user', async () => {
      const adminId = faker.string.uuid();
      const userId = faker.string.uuid();

      const adminData = {
        id: adminId,
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: UserRole.ADMIN,
        externalId: faker.string.uuid(),
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const userData = {
        id: userId,
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: UserRole.USER,
        externalId: faker.string.uuid(),
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      await userRepo.save([adminData, userData]);

      const newName = faker.person.fullName();

      mockTokenValidator.validate.mockResolvedValueOnce({
        internalId: adminId,
        roles: [UserRole.ADMIN],
      });

      const { status, body } = await request(app.callback())
        .put('/v1/edit-account')
        .set('Authorization', 'Bearer valid-token')
        .send({
          userId: userId,
          name: newName,
          role: UserRole.ADMIN,
        });

      expect(status).toBe(200);
      expect(body).toEqual({
        id: userId,
        email: userData.email,
        name: newName,
        isOnboarded: true,
      });
    });
  });
});
