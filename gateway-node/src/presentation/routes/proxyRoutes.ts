import { Router, Request, Response } from 'express';
import { ProxyController } from '../controllers/ProxyController';
import { IBackendClient } from '@infrastructure/http/IBackendClient';

export function createProxyRoutes(backendClient: IBackendClient): Router {
  const router = Router();
  const proxyController = new ProxyController(backendClient);

  /**
   * @swagger
   * tags:
   *   - name: Applications
   *     description: Gerenciamento de aplicações
   *   - name: Releases
   *     description: Gerenciamento de releases e promoções
   *   - name: Approvals
   *     description: Processo de aprovação e rejeição
   *   - name: Audit
   *     description: Logs de auditoria
   *
   * /api/applications:
   *   get:
   *     summary: Listar aplicações
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: skip
   *         schema: { type: integer, default: 0 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 10 }
   *     responses:
   *       200:
   *         description: Lista de aplicações com paginação
   *   post:
   *     summary: Criar aplicação
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string }
   *               ownerTeam: { type: string }
   *               repoUrl: { type: string }
   *     responses:
   *       201:
   *         description: Aplicação criada
   *       400:
   *         description: Erro de validação
   *
   * /api/applications/{app_id}:
   *   get:
   *     summary: Detalhes da aplicação
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: app_id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Dados da aplicação
   *   put:
   *     summary: Atualizar aplicação
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: app_id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string }
   *               ownerTeam: { type: string }
   *               repoUrl: { type: string }
   *     responses:
   *       200:
   *         description: Aplicação atualizada
   *   delete:
   *     summary: Remover aplicação
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: app_id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       204:
   *         description: Aplicação removida
   *
   * /api/releases:
   *   get:
   *     summary: Listar releases
   *     tags: [Releases]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: skip
   *         schema: { type: integer, default: 0 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 10 }
   *       - in: query
   *         name: application_id
   *         schema: { type: string }
   *       - in: query
   *         name: env
   *         schema: { type: string, enum: [DEV, PRE_PROD, PROD] }
   *     responses:
   *       200:
   *         description: Lista de releases
   *   post:
   *     summary: Criar release
   *     tags: [Releases]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               application_id: { type: string }
   *               version: { type: string }
   *               env: { type: string, enum: [DEV, PRE_PROD, PROD] }
   *               evidence_url: { type: string }
   *     responses:
   *       201:
   *         description: Release criado
   *       400:
   *         description: Erro de validação
   *       409:
   *         description: Release duplicado para esta versão/ambiente
   *
   * /api/releases/{release_id}:
   *   get:
   *     summary: Detalhes do release
   *     tags: [Releases]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: release_id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Dados do release
   *   put:
   *     summary: Atualizar release (evidência, notas)
   *     tags: [Releases]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: release_id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               evidence_url: { type: string }
   *               notes: { type: string }
   *     responses:
   *       200:
   *         description: Release atualizado
   *       409:
   *         description: Conflito de versão (otimistic locking)
   *   delete:
   *     summary: Remover release
   *     tags: [Releases]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: release_id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       204:
   *         description: Release removido
   *
   * /api/releases/{release_id}/promote:
   *   post:
   *     summary: Promover release
   *     description: Promove release DEV→PRE_PROD→PROD com validação de policy e approvals
   *     tags: [Releases]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: release_id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               notes: { type: string }
   *     responses:
   *       200:
   *         description: Release promovido com sucesso
   *       400:
   *         description: Falha na promoção (policy, approvals, freeze window)
   *       409:
   *         description: Conflito de versão
   *
   * /api/releases/{release_id}/status:
   *   put:
   *     summary: Atualizar status do release
   *     tags: [Releases]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: release_id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status: { type: string, enum: [PENDING, ACTIVE, ARCHIVED] }
   *     responses:
   *       200:
   *         description: Status atualizado
   *
   * /api/releases/{release_id}/timeline:
   *   get:
   *     summary: Timeline do release
   *     description: Eventos cronológicos (CREATE, UPDATE, APPROVE, REJECT, PROMOTE)
   *     tags: [Releases]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: release_id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Lista de eventos do release
   *
   * /api/approvals:
   *   get:
   *     summary: Listar aprovações pendentes
   *     tags: [Approvals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: skip
   *         schema: { type: integer, default: 0 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 10 }
   *     responses:
   *       200:
   *         description: Lista de aprovações
   *   post:
   *     summary: Criar aprovação
   *     tags: [Approvals]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               release_id: { type: string }
   *               approver_email: { type: string }
   *               outcome: { type: string, enum: [APPROVED, REJECTED] }
   *               notes: { type: string }
   *     responses:
   *       201:
   *         description: Aprovação registrada
   *       400:
   *         description: Erro de validação
   *
   * /api/approvals/{approval_id}:
   *   get:
   *     summary: Detalhes da aprovação
   *     tags: [Approvals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: approval_id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Dados da aprovação
   *   put:
   *     summary: Atualizar aprovação
   *     tags: [Approvals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: approval_id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               outcome: { type: string, enum: [APPROVED, REJECTED] }
   *               notes: { type: string }
   *     responses:
   *       200:
   *         description: Aprovação atualizada
   *
   * /api/approvals/{release_id}/approve:
   *   post:
   *     summary: Aprovar release
   *     tags: [Approvals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: release_id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               notes: { type: string }
   *     responses:
   *       200:
   *         description: Release aprovado
   *
   * /api/approvals/{release_id}/reject:
   *   post:
   *     summary: Rejeitar release
   *     tags: [Approvals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: release_id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               notes: { type: string }
   *     responses:
   *       200:
   *         description: Release rejeitado
   *
   * /api/audit:
   *   get:
   *     summary: Listar logs de auditoria
   *     tags: [Audit]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: skip
   *         schema: { type: integer, default: 0 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 10 }
   *       - in: query
   *         name: entity_type
   *         schema: { type: string, enum: [RELEASE, APPROVAL, APPLICATION] }
   *       - in: query
   *         name: action
   *         schema: { type: string, enum: [CREATE, UPDATE, DELETE, APPROVE, REJECT, PROMOTE] }
   *       - in: query
   *         name: actor
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Logs de auditoria
   *
   * /api/audit/{entity_type}/{entity_id}:
   *   get:
   *     summary: Audit logs de uma entidade específica
   *     tags: [Audit]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: entity_type
   *         required: true
   *         schema: { type: string, enum: [RELEASE, APPROVAL, APPLICATION] }
   *       - in: path
   *         name: entity_id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Logs da entidade
   */

  router.all('/*', (req: Request, res: Response) =>
    proxyController.forward(req, res).catch((err) => {
      throw err;
    })
  );

  return router;
}
