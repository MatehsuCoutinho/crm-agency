import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { Express } from "express";

const swaggerDocument = YAML.load(path.join(__dirname, "../swagger/openapi.yaml"));

export function setupSwagger(app: Express) {
    app.use(
        "/docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerDocument, {
            customSiteTitle: "Helpdesk Platform API",
            customCss: `
        .topbar { display: none }
        .swagger-ui .info .title { font-size: 2rem; }
      `,
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true,
                filter: true,
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 2
            }
        })
    );
}