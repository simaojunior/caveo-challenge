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

  describe('GET /v1/users', () => {
    it('should return 401 if authorization header is not present', async () => {
      const { status } = await request(app.callback())
        .get('/v1/users');

      expect(status).toBe(401);
    });

    it('should return 403 when non-admin user tries to access users', async () => {
      const userId = faker.string.uuid();

      mockTokenValidator.validate.mockResolvedValueOnce({
        internalId: userId,
        roles: [UserRole.USER],
      });

      const { status } = await request(app.callback())
        .get('/v1/users')
        .set('Authorization', 'Bearer valid-token');

      expect(status).toBe(403);
    });

    it('should return 200 with paginated users list for admin', async () => {
      const adminId = faker.string.uuid();

      // Create test users
      const users = Array.from({ length: 15 }, (_, index) => ({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: index % 3 === 0 ? UserRole.ADMIN : UserRole.USER,
        externalId: faker.string.uuid(),
        isOnboarded: index % 2 === 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }));

      // Add admin user
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

      await userRepo.save([adminData, ...users]);

      mockTokenValidator.validate.mockResolvedValueOnce({
        internalId: adminId,
        roles: [UserRole.ADMIN],
      });

      const { status, body } = await request(app.callback())
        .get('/v1/users')
        .set('Authorization', 'Bearer valid-token');

      expect(status).toBe(200);
      expect(body).toEqual({
        users: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            email: expect.any(String),
            name: expect.any(String),
            role: expect.stringMatching(/^(admin|user)$/),
            isOnboarded: expect.any(Boolean),
          }),
        ]),
        meta: expect.objectContaining({
          total: 16,
          itemsPerPage: 10,
          totalPages: 2,
          page: 1,
        }),
      });

      expect(body.users).toHaveLength(10);
    });

    it('should filter users by role', async () => {
      const adminId = faker.string.uuid();

      const adminUsers = Array.from({ length: 3 }, () => ({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: UserRole.ADMIN,
        externalId: faker.string.uuid(),
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }));

      const regularUsers = Array.from({ length: 5 }, () => ({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: UserRole.USER,
        externalId: faker.string.uuid(),
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }));

      const testAdmin = {
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

      await userRepo.save([testAdmin, ...adminUsers, ...regularUsers]);

      mockTokenValidator.validate.mockResolvedValueOnce({
        internalId: adminId,
        roles: [UserRole.ADMIN],
      });

      const { status, body } = await request(app.callback())
        .get('/v1/users?role=admin')
        .set('Authorization', 'Bearer valid-token');

      expect(status).toBe(200);
      expect(body.users).toHaveLength(4);
      expect(
        body.users.every(
          (user: { role: string }) => user.role === UserRole.ADMIN,
        ),
      ).toBe(true);
      expect(body.meta.total).toBe(4);
    });

    it('should filter users by isOnboarded status', async () => {
      const adminId = faker.string.uuid();

      const onboardedUsers = Array.from({ length: 3 }, () => ({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: UserRole.USER,
        externalId: faker.string.uuid(),
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }));

      const notOnboardedUsers = Array.from({ length: 2 }, () => ({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: UserRole.USER,
        externalId: faker.string.uuid(),
        isOnboarded: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }));

      const testAdmin = {
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

      await userRepo.save([testAdmin, ...onboardedUsers, ...notOnboardedUsers]);

      mockTokenValidator.validate.mockResolvedValueOnce({
        internalId: adminId,
        roles: [UserRole.ADMIN],
      });

      const { status, body } = await request(app.callback())
        .get('/v1/users?isOnboarded=false')
        .set('Authorization', 'Bearer valid-token');

      expect(status).toBe(200);
      expect(body.users).toHaveLength(2);
      expect(
        body.users.every(
          (user: { isOnboarded: boolean }) => user.isOnboarded === false,
        ),
      ).toBe(true);
      expect(body.meta.total).toBe(2);
    });

    it('should filter users by exact name match', async () => {
      const adminId = faker.string.uuid();
      const searchName = 'John Doe';

      const matchingUser = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: searchName,
        role: UserRole.USER,
        externalId: faker.string.uuid(),
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const otherUsers = Array.from({ length: 3 }, () => ({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: UserRole.USER,
        externalId: faker.string.uuid(),
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }));

      const testAdmin = {
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

      await userRepo.save([testAdmin, matchingUser, ...otherUsers]);

      mockTokenValidator.validate.mockResolvedValueOnce({
        internalId: adminId,
        roles: [UserRole.ADMIN],
      });

      const { status, body } = await request(app.callback())
        .get(`/v1/users?name=${encodeURIComponent(searchName)}`)
        .set('Authorization', 'Bearer valid-token');

      expect(status).toBe(200);
      expect(body.users).toHaveLength(1);
      expect(body.users[0].name).toBe(searchName);
    });

    it('should return 400 for invalid name filter (less than 2 characters)', async () => {
      const adminId = faker.string.uuid();

      mockTokenValidator.validate.mockResolvedValueOnce({
        internalId: adminId,
        roles: [UserRole.ADMIN],
      });

      const { status } = await request(app.callback())
        .get('/v1/users?name=a')
        .set('Authorization', 'Bearer valid-token');

      expect(status).toBe(400);
    });

    it('should handle pagination with default parameters', async () => {
      const adminId = faker.string.uuid();

      const users = Array.from({ length: 15 }, () => ({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: UserRole.USER,
        externalId: faker.string.uuid(),
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }));

      const testAdmin = {
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

      await userRepo.save([testAdmin, ...users]);

      mockTokenValidator.validate.mockResolvedValueOnce({
        internalId: adminId,
        roles: [UserRole.ADMIN],
      });

      const { status, body } = await request(app.callback())
        .get('/v1/users')
        .set('Authorization', 'Bearer valid-token');

      expect(status).toBe(200);
      expect(body.users).toHaveLength(10);
      expect(body.meta).toEqual({
        total: 16,
        itemsPerPage: 10,
        totalPages: 2,
        page: 1,
      });
    });

    it('should filter users by email', async () => {
      const adminId = faker.string.uuid();
      const testEmail = 'test@example.com';

      const targetUser = {
        id: faker.string.uuid(),
        email: testEmail,
        name: faker.person.fullName(),
        role: UserRole.USER,
        externalId: faker.string.uuid(),
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const otherUsers = Array.from({ length: 3 }, () => ({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: UserRole.USER,
        externalId: faker.string.uuid(),
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }));

      const testAdmin = {
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

      await userRepo.save([testAdmin, targetUser, ...otherUsers]);

      mockTokenValidator.validate.mockResolvedValueOnce({
        internalId: adminId,
        roles: [UserRole.ADMIN],
      });

      const { status, body } = await request(app.callback())
        .get(`/v1/users?email=${encodeURIComponent(testEmail)}`)
        .set('Authorization', 'Bearer valid-token');

      expect(status).toBe(200);
      expect(body.users).toHaveLength(1);
      expect(body.users[0].email).toBe(testEmail);
    });

    it('should combine multiple filters correctly', async () => {
      const adminId = faker.string.uuid();

      const matchingUser = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: 'Admin User',
        role: UserRole.ADMIN,
        externalId: faker.string.uuid(),
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const nonMatchingUsers = [
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          name: 'Admin User',
          role: UserRole.ADMIN,
          externalId: faker.string.uuid(),
          isOnboarded: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          name: 'Regular User',
          role: UserRole.USER,
          externalId: faker.string.uuid(),
          isOnboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      const testAdmin = {
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

      await userRepo.save([testAdmin, matchingUser, ...nonMatchingUsers]);

      mockTokenValidator.validate.mockResolvedValueOnce({
        internalId: adminId,
        roles: [UserRole.ADMIN],
      });

      const { status, body } = await request(app.callback())
        .get('/v1/users?role=admin&isOnboarded=true&name=Admin User')
        .set('Authorization', 'Bearer valid-token');

      expect(status).toBe(200);
      expect(body.users).toHaveLength(1);
      expect(
        body.users.every(
          (user: { role: string; isOnboarded: boolean; name: string }) =>
            user.role === UserRole.ADMIN &&
            user.isOnboarded === true &&
            user.name === 'Admin User',
        ),
      ).toBe(true);
    });
  });
});
