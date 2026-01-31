"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPromotionRoutes = createPromotionRoutes;
const express_1 = require("express");
const PromotionController_1 = require("../controllers/PromotionController");
function createPromotionRoutes(backendClient) {
    const router = (0, express_1.Router)();
    const promotionController = new PromotionController_1.PromotionController(new (require('@application/usecases/PromotionUseCase').PromotionUseCase)(backendClient));
    router.post('/internal/promotions/validate-production', (req, res) => promotionController.validateProductionPromotion(req, res).catch((err) => {
        throw err;
    }));
    return router;
}
