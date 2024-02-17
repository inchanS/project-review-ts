import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  swaggerDefinition: {
    openapi: '3.0.2',
    info: {
      title: 'Project_review',
      version: '3.1.1',
      description: 'project_review API with express',
      license: {
        name: 'MIT',
        url: 'https://api-review-dev.codject.com',
      },
      contact: {
        name: 'Inchan Song',
        url: 'https://github.com/inchanS',
        email: 'song@inchan.dev',
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
    servers: [
      {
        url: 'https://api-review-dev.codject.com',
        description: 'project_review AWS RDS Test API document',
      },
      {
        url: 'http://localhost:8000',
        description: 'local Server',
      },
    ],
  },
  apis: ['api-docs/_build/*'],
};

const specs = swaggerJsdoc(options);
const swaggerOptions = {
  swaggerOptions: {
    defaultModelExpandDepth: 9,
  },
};

export { specs, swaggerOptions };
