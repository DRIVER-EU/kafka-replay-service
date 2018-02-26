import { Application } from 'express';
import { Router } from 'express';
import { getSessions, getSession, getTopic, getMessage } from '../../handlers/api-handler';

export const setupRoutes = (app: Application) => {
  const router = Router();
  router.get('/sessions', getSessions);
  router.get('/sessions/:session', getSession);
  router.get('/sessions/:session/:topic', getTopic);
  router.get('/messages/:id', getMessage);
  // router.post('/:session', playSession);
  app.use('/api/v1', router);
  app.use('/', (req, res) => res.redirect('/api/v1'));
};
