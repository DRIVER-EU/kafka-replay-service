import * as path from 'path';
import { EventEmitter } from 'events';
import * as chokidar from 'chokidar';
import { Message, IMessage } from '../models/message';

const log = console.log.bind(console);

export class FileWatcherService extends EventEmitter {
  private static instance: FileWatcherService;

  private cwd = process.cwd();
  private watchFolder?: string;
  private messages: { [path: string]: Message } = {};
  private status: 'ready' | 'processing' | 'idle' = 'idle';
  private counter = 0;

  private constructor() {
    super();
  }

  public static get Instance() {
    if (!FileWatcherService.instance) {
      FileWatcherService.instance = new FileWatcherService();
    }
    return FileWatcherService.instance;
  }

  public setWatchFolder(folder: string) {
    this.watchFolder = path.join(this.cwd, folder);
    const watcher = chokidar.watch(path.join(folder, '**/*'), {
      cwd: this.cwd,
      ignored: /(^|[\/\\])\../,
      persistent: true
    });

    watcher
      .on('add', (p: string) => this.addFile(path.join(this.cwd, p)))
      .on('unlink', (p: string) => this.deleteFile(path.join(this.cwd, p)))
      .on('unlinkDir', (p: string) => this.deleteFolder(path.join(this.cwd, p)))
      .on('error', (error: string) => console.error(`Watcher error: ${error}`))
      .on('ready', () => this.ready());
  }

  /**
   * Get all messages within a session.
   *
   * @param session Session name
   */
  public getSession(session: string) {
    const sessionFolder = path.join(this.watchFolder || '', session);
    return Object.keys(this.messages)
      .filter((p) => p.indexOf(sessionFolder) === 0)
      .map((p) => this.messages[p])
      .map((m) => this.createPublishedMessage(m));
  }

  /**
   * Get all messages within a topic.
   *
   * @param session Session name
   * @param topic Topic name
   */
  public getTopic(session: string, topic: string) {
    const sessionFolder = path.join(this.watchFolder || '', session, topic);
    return Object.keys(this.messages)
      .filter((p) => p.indexOf(sessionFolder) === 0)
      .map((p) => this.messages[p])
      .map((m) => this.createPublishedMessage(m));
  }

  /**
   * Get all sessions, including their messages.
   */
  public getAllSessions() {
    return Object.keys(this.messages)
      .map((p) => this.messages[p])
      .map((m) => this.createPublishedMessage(m));
  }

  /**
   * Returns the topic (folder name) and message data.
   *
   * @param filename Absolute filename of the message
   */
  public getMessage(filename: string) {
    return this.messages.hasOwnProperty(filename)
      ? { message: this.messages[filename].data, topic: path.basename(path.dirname(filename)) }
      : null;
  }

  private createPublishedMessage(m: Message): IMessage {
    return { id: m.id, filename: m.filename, label: m.label, topic: m.topic, session: m.session, timestampMsec: m.timestampMsec };
  }

  private ready() {
    log('Initial scan complete. Ready for changes...');
    this.status = 'processing';
  }

  private emitReadyOrUpdated() {
    if (this.counter !== 0) { return; }
    this.emit(this.status === 'ready' ? 'updated' : 'ready');
    this.status = 'ready';
  }

  private addFile(path: string) {
    this.counter++;
    const message = new Message(path);
    message.on('ready', (isValid: boolean) => {
      this.counter--;
      if (isValid) {
        log(`File ${path} has been added`);
        this.messages[path] = message;
      }
      this.emitReadyOrUpdated();
    });
  }

  private deleteFile(path: string) {
    log(`File ${path} has been removed`);
    delete this.messages[path];
    this.emit('updated');
  }

  private deleteFolder(path: string) {
    log(`Directory ${path} has been removed`);
    const deleting: string[] = [];
    for (let key in this.messages) {
      if (!this.messages.hasOwnProperty(key) || key.indexOf(path) === 0) {
        continue;
      }
      deleting.push(key);
    }
    deleting.forEach((d) => delete this.messages[d]);
    this.emit('updated');
  }
}
