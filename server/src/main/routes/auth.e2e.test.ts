import { describe, expect, it, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import type { Server } from 'node:http';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource, type Repository } from 'typeorm';
import { PgConnection } from '@/infra/repos/postgres/helpers/connection';
import { User } from '@/infra/repos/postgres/entities/user';
import { UserRole } from '@/domain/entities/user';

const mockCognitoClient = {
  signIn: vi.fn(),
  signUp: vi.fn(),
  addToGroup: vi.fn(),
  deleteUser: vi.fn(),
  removeFromGroup: vi.fn(),
};

vi.mock('@/infra/clients/cognito', () => ({
  Cognito: vi.fn().mockImplementation(() => mockCognitoClient),
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

  describe('POST /v1/auth', () => {
    it('should return 400 for invalid request data', async () => {
      await request(app.callback())
        .post('/v1/auth')
        .send({
          email: 'invalid-email',
          password: faker.internet.password({ length: 4 }),
        })
        .expect(400);
    });

    it('should return 400 for missing password', async () => {
      await request(app.callback())
        .post('/v1/auth')
        .send({
          email: faker.internet.email(),
        })
        .expect(400);
    });

    it('should return 201 for successful registration', async () => {
      // Arrange
      const externalId = faker.string.uuid();
      const accessToken = faker.string.alphanumeric(100);
      const refreshToken = faker.string.alphanumeric(100);

      mockCognitoClient.signUp.mockResolvedValueOnce({ externalId });
      mockCognitoClient.addToGroup.mockResolvedValueOnce(undefined);
      mockCognitoClient.signIn.mockResolvedValueOnce({
        accessToken,
        refreshToken,
      });

      const userData = {
        email: faker.internet.email(),
        password: 'ValidPass123!',
        name: faker.person.fullName(),
      };

      // Act
      const response = await request(app.callback())
        .post('/v1/auth')
        .send(userData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        isOnboarded: false,
      });
    });

    it('should return 200 for successful sign in of existing user', async () => {
      // Arrange
      const accessToken = faker.string.alphanumeric(100);
      const refreshToken = faker.string.alphanumeric(100);
      const userId = faker.string.uuid();
      const externalId = faker.string.uuid();

      const existingUserData = {
        id: userId,
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: UserRole.USER,
        externalId,
        isOnboarded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      await userRepo.save(existingUserData);

      mockCognitoClient.signIn.mockResolvedValueOnce({
        accessToken,
        refreshToken,
      });

      const userData = {
        email: existingUserData.email,
        password: 'ValidPass123!',
      };

      // Act
      const response = await request(app.callback())
        .post('/v1/auth')
        .send(userData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        isOnboarded: true,
      });
    });
  });
});
