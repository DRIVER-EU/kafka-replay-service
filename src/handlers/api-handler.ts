import { FileWatcherService } from './../services/file-watcher-service';
import { Request, Response, NextFunction } from 'express';

const fws = FileWatcherService.Instance;

export const getSessions = (req: Request, res: Response, next: NextFunction) => {
  res.json(fws.getAllSessions());
};

export const getSession = (req: Request, res: Response, next: NextFunction) => {
  const session = req.params.session as string;
  res.json(fws.getSession(session));
};

export const getTopic = (req: Request, res: Response, next: NextFunction) => {
  const session = req.params.session as string;
  const topic = req.params.topic as string;
  res.json(fws.getTopic(session, topic));
};

export const playSession = (req: Request, res: Response, next: NextFunction) => {
  const session = req.params.session as string;
  res.json(fws.getSession(session));
};
