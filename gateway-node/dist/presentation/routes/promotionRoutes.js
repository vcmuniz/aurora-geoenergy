"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPromotionRoutes = createPromotionRoutes;
const express_1 = require("express");
const PromotionController_1 = require("../controllers/PromotionController");
function createPromotionRoutes(backendClient) {
    const router = (0, express_1.Router)();
    const promotionController = new PromotionController_1.PromotionController(new (require('../../application/usecases/PromotionUseCase').PromotionUseCase)(backendClient));
    /**
     * @swagger
     * /internal/promotions/validate-production:
     *   post:
     *     summary: Validar promoção para PROD
     *     description: Valida se um release pode ser promovido para PROD conforme policy
     *     tags:
     *       - Promotions
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               releaseId:
     *                 type: string
     *               fromEnv:
     *                 type: string
     *                 enum: [PRE_PROD]
     *               toEnv:
     *                 type: string
     *                 enum: [PROD]
     *     responses:
     *       200:
     *         description: Validação realizada
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 allowed:
     *                   type: boolean
     *                 reason:
     *                   type: string
     *       400:
     *         description: Dados inválidos
     */
    router.post('/internal/promotions/validate-production', (req, res) => promotionController.validateProductionPromotion(req, res).catch((err) => {
        throw err;
    }));
    return router;
}
