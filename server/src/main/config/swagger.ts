import type Koa from 'koa';
import { koaSwagger } from 'koa2-swagger-ui';
import Router from '@koa/router';
import swaggerSpec from './swagger.json' with { type: 'json' };

export const setupSwagger = (app: Koa): void => {
  const router = new Router();

  router.get('/docs/spec', (ctx) => {
    ctx.type = 'application/json';
    ctx.body = swaggerSpec;
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.use(
    koaSwagger({
      title: 'Caveo API Documentation',
      routePrefix: '/docs',
      specPrefix: '/docs/spec',
      exposeSpec: true,
      swaggerOptions: {
        url: '/docs/spec',
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        docExpansion: 'list',
        defaultModelRendering: 'schema',
        showRequestHeaders: true,
        tryItOutEnabled: true,
        persistAuthorization: true,
      },
      hideTopbar: false,
      customCSS: `
        /* Caveo Brand Colors - Header */
        .swagger-ui .topbar {
          background: linear-gradient(135deg, #0066CC 0%, #004499 100%);
          box-shadow: 0 2px 8px rgba(0, 102, 204, 0.15);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px 20px;
        }

        .swagger-ui .topbar .link {
          color: #ffffff;
          font-weight: 500;
        }

        .swagger-ui .topbar .link:hover {
          color: #e8f4ff;
        }

        /* Info section styling */
        .swagger-ui .info .title {
          color: #0066CC;
          font-weight: 700;
        }

        .swagger-ui .info .description {
          color: #374151;
        }

        /* Scheme container */
        .swagger-ui .scheme-container {
          background: linear-gradient(135deg, #f8faff 0%, #e8f4ff 100%);
          border: 1px solid #0066CC20;
          padding: 15px;
          margin: 15px 0;
          border-radius: 8px;
        }

        /* Authorization button */
        .swagger-ui .btn.authorize {
          background: linear-gradient(135deg, #0066CC 0%, #004499 100%);
          border-color: #0066CC;
          color: white;
          font-weight: 600;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .swagger-ui .btn.authorize:hover {
          background: linear-gradient(135deg, #004499 0%, #003366 100%);
          border-color: #004499;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 102, 204, 0.2);
        }

        /* Execute buttons */
        .swagger-ui .btn.execute {
          background: linear-gradient(135deg, #0066CC 0%, #004499 100%);
          border-color: #0066CC;
          color: white;
          border-radius: 6px;
        }

        .swagger-ui .btn.execute:hover {
          background: linear-gradient(135deg, #004499 0%, #003366 100%);
          border-color: #004499;
        }

        /* Method badges */
        .swagger-ui .opblock.opblock-post {
          border-color: #0066CC;
        }

        .swagger-ui .opblock.opblock-post .opblock-summary {
          border-color: #0066CC;
        }

        .swagger-ui .opblock.opblock-get {
          border-color: #10B981;
        }

        .swagger-ui .opblock.opblock-put {
          border-color: #F59E0B;
        }

        .swagger-ui .opblock.opblock-delete {
          border-color: #EF4444;
        }

        /* Tags */
        .swagger-ui .opblock-tag {
          color: #0066CC;
          border-bottom: 2px solid #0066CC20;
          font-weight: 600;
        }

        /* Response section */
        .swagger-ui .responses-inner h4,
        .swagger-ui .responses-inner h5 {
          color: #0066CC;
        }

        /* Parameters section */
        .swagger-ui .parameters-col_description input[type=text] {
          border-color: #D1D5DB;
          border-radius: 6px;
        }

        .swagger-ui .parameters-col_description input[type=text]:focus {
          border-color: #0066CC;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        /* Custom scrollbar for better UX */
        .swagger-ui ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .swagger-ui ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .swagger-ui ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #0066CC 0%, #004499 100%);
          border-radius: 4px;
        }

        .swagger-ui ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #004499 0%, #003366 100%);
        }
      `,
    }),
  );
};
