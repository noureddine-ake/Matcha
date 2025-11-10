import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Matcha Chat API",
      version: "1.0.0",
      description: "Chat endpoints for the Matcha dating app",
    },
    servers: [
      { url: "http://localhost:5000/api", description: "Local server" },
    ],
  },
  apis: ["./src/routes/*.js"], // paths to files with JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
