"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AxiosBackendClient = void 0;
const axios_1 = __importDefault(require("axios"));
const exceptions_1 = require("../../domain/exceptions");
const logger_1 = require("../../core/logger");
class AxiosBackendClient {
    constructor(baseURL = process.env.BACKEND_URL || 'http://localhost:8000') {
        this.client = axios_1.default.create({
            baseURL,
            timeout: 10000,
            validateStatus: () => true,
        });
    }
    async get(path, requestId) {
        return this.request('GET', path, undefined, requestId);
    }
    async post(path, data, requestId) {
        return this.request('POST', path, data, requestId);
    }
    async put(path, data, requestId) {
        return this.request('PUT', path, data, requestId);
    }
    async delete(path, requestId) {
        return this.request('DELETE', path, undefined, requestId);
    }
    async request(method, path, data, requestId) {
        try {
            const response = await this.client({
                method,
                url: path,
                data,
                headers: {
                    'Content-Type': 'application/json',
                    ...(requestId && { 'X-Request-ID': requestId }),
                },
            });
            if (response.status >= 500) {
                logger_1.logger.warn({ requestId, method, path, status: response.status }, 'Backend returned server error');
                throw new exceptions_1.BackendException('Backend service error');
            }
            return {
                status: response.status,
                data: response.data,
                headers: response.headers,
            };
        }
        catch (error) {
            if (error instanceof exceptions_1.BackendException)
                throw error;
            const axiosError = error;
            logger_1.logger.error({ requestId, method, path, error: axiosError.message }, 'Backend request failed');
            throw new exceptions_1.BackendException('Backend service unavailable');
        }
    }
}
exports.AxiosBackendClient = AxiosBackendClient;
