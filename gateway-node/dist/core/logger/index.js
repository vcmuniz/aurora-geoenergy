"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const logLevel = process.env.LOG_LEVEL || 'info';
exports.logger = (0, pino_1.default)({
    level: logLevel,
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            singleLine: false,
        },
    },
});
