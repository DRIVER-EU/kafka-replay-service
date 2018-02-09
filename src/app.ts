import { FileWatcherService } from './services/file-watcher-service';
import { ICommandOptions } from './';
import { createServer, Server } from 'http';
import { Application, Request, Response } from 'express';
import * as express from 'express';
import * as socketIO from 'socket.io';

const log = console.log;

/** Main application */
export class App {
  /** Port number where the service listens for clients */
  private readonly port: number;
  private app: express.Application;
  private server: Server;
  private io: SocketIO.Server;
  private fws = FileWatcherService.Instance;

  constructor(options: ICommandOptions) {
    this.port = options.port;
    this.app = express();
    this.server = createServer(this.app);
    this.io = socketIO(this.server);
    this.fws.on('ready', () => {
      this.fws.on('updated', () => this.io.emit('session_update', this.fws.getAllSessions()));
      // log(this.fws.getAllSessions().map(s => s.filename));
      // const f = this.fws.getAllSessions()[0].filename;
      // log(this.fws.getMessage(f));
      this.setupRoutes();
      this.listen();
    });
    this.fws.setWatchFolder(options.logFolder);
  }

  public getApp(): Application {
    return this.app;
  }

  private listen(): void {
    this.server.listen(this.port, () => {
      log(`Running server on port ${this.port}.`);
    });

    this.io.on('connect', (socket: SocketIO.Socket) => {
      log(`Connected client on port ${this.port}`);
      socket.emit('session_update', this.fws.getAllSessions());
      socket.on('message', (m: any) => {
        log('[server](message): %s', JSON.stringify(m));
        this.io.emit('session_update', m);
      });

      socket.on('disconnect', () => {
        log('Client disconnected');
      });
    });
  }

  private setupRoutes() {
    this.app.get('/', (req: Request, res: Response) => {
      res.sendFile(process.cwd() + '/index.html');
    });
  }
}
