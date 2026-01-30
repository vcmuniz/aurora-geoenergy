"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProxyRoutes = createProxyRoutes;
const express_1 = require("express");
const ProxyController_1 = require("../controllers/ProxyController");
function createProxyRoutes(backendClient) {
    const router = (0, express_1.Router)();
    const proxyController = new ProxyController_1.ProxyController(backendClient);
    router.all('/*', (req, res) => proxyController.forward(req, res).catch((err) => {
        throw err;
    }));
    return router;
}
