import { Router, Request, Response } from 'express';
import { CustomRequest } from '../types/common';
import { successResponse } from '../utils/response';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  const customReq = req as CustomRequest;
  res.status(200).json(
    successResponse({ status: 'ok' }, customReq.context)
  );
});

export default router;
