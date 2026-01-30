"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitByUser = exports.rateLimitByIp = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("@core/config");
const config = (0, config_1.getConfig)();
exports.rateLimitByIp = (0, express_rate_limit_1.default)({
    windowMs: config.rateLimitWindow,
    max: config.rateLimitMax,
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => !!req.context?.user,
});
exports.rateLimitByUser = (0, express_rate_limit_1.default)({
    windowMs: config.rateLimitWindow,
    max: config.rateLimitMaxAuth,
    keyGenerator: (req) => req.context?.user?.id || req.ip || 'anonymous',
    message: 'Too many requests from this user',
    standardHeaders: true,
    legacyHeaders: false,
});
