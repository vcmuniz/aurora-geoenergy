"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSwaggerRoutes = createSwaggerRoutes;
const express_1 = require("express");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("../../infrastructure/config/swagger");
function createSwaggerRoutes() {
    const router = (0, express_1.Router)();
    router.use('/docs', swagger_ui_express_1.default.serve);
    router.get('/docs', swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, { customCss: '.swagger-ui .topbar { display: none }' }));
    router.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swagger_1.swaggerSpec);
    });
    return router;
}
