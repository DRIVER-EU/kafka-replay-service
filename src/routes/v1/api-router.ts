import { Application } from 'express';
import * as express from 'express';
import { getSessions, getSession, getTopic } from '../../handlers/api-handler';

export const setupRoutes = (app: Application) => {
  const router = express.Router();
  router.get('/', getSessions);
  router.get('/:session', getSession);
  router.get('/:session/:topic', getTopic);
  // router.post('/:session', playSession);
  app.use('/api/v1', router);
  app.use('/', (req, res) => res.redirect('/api/v1'));
};
