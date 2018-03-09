import { ILogMessage } from './../models/message';
import { FileWatcherService } from './../services/file-watcher-service';
import { Request, Response, NextFunction } from 'express';
import { messageQueue } from '../models/message';

const fws = FileWatcherService.Instance;

/**
 * Get all the sessions.
 *
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export const getAllSessions = (req: Request, res: Response, next: NextFunction) => {
  res.json(fws.getAllSessions());
};

/**
 * Get all the topics in a session.
 *
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export const getTopicsInSessionById = (req: Request, res: Response, next: NextFunction) => {
  const session = req.params.session as string;
  res.json(fws.getTopicsInSession(session));
};

/**
 * Get all the messages (including content) in a session.
 *
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export const getMessagesInSessionById = (req: Request, res: Response, next: NextFunction) => {
  const session = req.params.session as string;
  res.json(fws.getMessagesInSession(session));
};

/**
 * Get a single message by ID.
 *
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export const getMessageById = (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  res.json(fws.getMessage(id));
};

/**
 * Get all messages in a session's topic.
 *
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export const getMessagesInSessionTopicById = (req: Request, res: Response, next: NextFunction) => {
  const session = req.params.session as string;
  const topic = req.params.topic as string;
  res.json(fws.getMessagesInSessionTopic(session, topic));
};

/**
 * Play a single message by ID.
 *
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export const playMessageById = (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  const message = fws.getMessage(id);
  res.sendStatus(addMessageToQueue(message) ? 200 : 404);
};

const addMessageToQueue = (message: ILogMessage | null) => {
  if (message) {
    messageQueue.push(Object.assign(message, { timestampMsec: 0 } as ILogMessage));
    return true; // OK
  }
  return false; // not found
};

/**
 * Play all messages in a session's topic.
 *
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export const playMessagesInSessionTopicById = (req: Request, res: Response, next: NextFunction) => {
  const session = req.params.session as string;
  const topic = req.params.topic as string;
  messageQueue.push(...fws.getMessagesInSessionTopic(session, topic));
  res.sendStatus(200); // OK
};

/**
 * Play all the messages in a session.
 *
 * @param req Request
 * @param res Response
 * @param next Next function
 */
export const playMessagesInSessionById = (req: Request, res: Response, next: NextFunction) => {
  const session = req.params.session as string;
  messageQueue.push(...fws.getMessagesInSession(session));
  res.sendStatus(200); // OK
};
