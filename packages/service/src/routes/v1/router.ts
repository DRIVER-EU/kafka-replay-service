import { Application } from 'express';
import { Router } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from '../../../swagger.json';

import {
  getAllSessions,
  getMessagesInSessionById,
  getMessagesInSessionTopicById,
  getMessageById,
  playMessageById,
  getTopicsInSessionById,
  playMessagesInSessionById,
  playMessagesInSessionTopicById,
  reset
} from '../../handlers/controllers';

export const setupRoutes = (app: Application) => {
  const router = Router();
  router.get('/sessions', getAllSessions);
  router.get('/sessions/:session/topics', getTopicsInSessionById);

  router.get('/sessions/:session', getMessagesInSessionById);
  router.post('/sessions/:session', playMessagesInSessionById);

  router.get('/sessions/:session/:topic', getMessagesInSessionTopicById);
  router.post('/sessions/:session/:topic', playMessagesInSessionTopicById);

  router.get('/messages/:id', getMessageById);
  router.post('/messages/:id', playMessageById);

  router.delete('/reset', reset);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use('/api/v1', router);
  // app.use('/', (req, res) => res.redirect('/api-docs'));
};
