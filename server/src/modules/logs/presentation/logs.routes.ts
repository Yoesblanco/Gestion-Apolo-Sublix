import { Router, Request, Response } from 'express';
import { logger } from '../../../shared/utils/logger';

const logsRouter = Router();

logsRouter.post('/client', (req: Request, res: Response) => {
  const { level = 'error', message, context, stack, userAgent, url } = req.body;

  const logPayload = {
    source: 'frontend-client',
    context,
    stack,
    userAgent: userAgent || req.headers['user-agent'],
    clientUrl: url,
    ip: req.ip,
  };

  if (level === 'warn') {
    logger.warn(logPayload, `[FRONTEND WARN] ${message}`);
  } else if (level === 'info') {
    logger.info(logPayload, `[FRONTEND INFO] ${message}`);
  } else {
    logger.error(logPayload, `[FRONTEND ERROR] ${message}`);
  }

  res.status(200).json({ success: true });
});

export { logsRouter };
