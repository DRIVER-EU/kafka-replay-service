import * as path from 'path';
import { EventEmitter } from 'events';
import * as chokidar from 'chokidar';
import { Message, IMessage, IJsonObject } from '../models/message';

const log = console.log.bind(console);

export class FileWatcherService extends EventEmitter {
  private static instance: FileWatcherService;

  private cwd = process.cwd();
  private watchFolder?: string;
  private path2id: { [path: string]: string } = {};
  private store: { [id: string]: Message } = {};
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
    return Object.keys(this.path2id)
      .filter((p) => p.indexOf(sessionFolder) === 0)
      .map((p) => this.path2id[p])
      .map((p) => this.store[p])
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
    return Object.keys(this.store)
      .filter((p) => p.indexOf(sessionFolder) === 0)
      .map((p) => this.store[p])
      .map((m) => this.createPublishedMessage(m));
  }

  /**
   * Get all sessions, including their messages.
   */
  public getAllSessions() {
    return Object.keys(this.store)
      .map((p) => this.store[p])
      .map((m) => this.createPublishedMessage(m));
  }

  /**
   * Returns the topic (folder name) and message data.
   *
   * @param id Id of the message
   */
  public getMessage(id: string): null | IMessage {
    const message = this.store[id];
    if (!message || !message.data) { return null; }
    const { label, topic, session, timestampMsec, data } = message;
    return { id, label, topic, session, timestampMsec, data };
  }

  private createPublishedMessage(m: Message): IMessage {
    return { id: m.id, label: m.label, topic: m.topic, session: m.session, timestampMsec: m.timestampMsec };
  }

  private ready() {
    log('Initial scan complete. Waiting for changes...');
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
        this.path2id[path] = message.id;
        this.store[message.id] = message;
      }
      this.emitReadyOrUpdated();
    });
  }

  /**
   * File has been deleted in the file system
   * @param path Full filename
   */
  private deleteFile(path: string) {
    const id = this.path2id[path];
    if (!id || !this.store.hasOwnProperty(id)) { return; }
    log(`File ${path} has been removed`);
    this.deleteMessage(path);
    this.emit('updated');
  }

  private deleteFolder(path: string) {
    log(`Directory ${path} has been removed`);
    const deleting: string[] = [];
    for (let p in this.path2id) {
      if (!this.path2id.hasOwnProperty(p) || p.indexOf(path) === 0) {
        continue;
      }
      deleting.push(p);
    }
    deleting.forEach((d) => this.deleteMessage(path));
    this.emit('updated');
  }

  private deleteMessage(path: string) {
    const id = this.path2id[path];
    delete this.path2id[path];
    delete this.store[id];
  }
}
