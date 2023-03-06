import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Project_review',
      version: '1.0.0',
      description: 'project_review API with express',
      license: {
        name: 'MIT',
        url: 'http://localhost:8000/api-docs/',
      },
      contact: {
        name: 'Song Inchan',
        url: 'https://github.com/inchanS',
        email: 'song@inchan.dev',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'local Server',
      },
    ],
  },
  apis: ['api-docs/swagger/*'],
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
