"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Aurora Geoenergy API Gateway',
            version: '1.0.0',
            description: 'API Gateway para Aurora Geoenergy - Orquestração entre Frontend e Backend',
            contact: {
                name: 'Aurora Team',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local Development',
            },
            {
                url: 'http://api.aurora.local',
                description: 'Production',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token from /api/auth/login',
                },
            },
            schemas: {
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com',
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            example: 'senha123',
                        },
                    },
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: {
                            type: 'object',
                            properties: {
                                access_token: { type: 'string' },
                                token_type: { type: 'string', example: 'bearer' },
                                user: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        email: { type: 'string' },
                                        name: { type: 'string' },
                                    },
                                },
                            },
                        },
                        requestId: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' },
                    },
                },
                UserProfile: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        role: { type: 'string', enum: ['admin', 'senior', 'user'] },
                    },
                },
                PromotionValidationRequest: {
                    type: 'object',
                    required: ['policy_id'],
                    properties: {
                        policy_id: { type: 'string', example: 'policy-123' },
                    },
                },
                PromotionValidationResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                allowed: { type: 'boolean', example: true },
                                score: { type: 'number', example: 85 },
                                minScore: { type: 'number', example: 70 },
                                reason: { type: 'string' },
                            },
                        },
                        requestId: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string' },
                        code: { type: 'string' },
                        requestId: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' },
                        details: { type: 'object' },
                    },
                },
            },
        },
        security: [],
    },
    apis: [],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
