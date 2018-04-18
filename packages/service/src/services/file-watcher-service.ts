import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { EventEmitter } from 'events';
import { Message, ILogMessage } from '../models/message';

const log = console.log.bind(console);

// tslint:disable-next-line:interface-name
export interface FileWatcherService {
  on(event: 'ready', listener: () => void): this;
  on(event: 'updated', listener: () => void): this;
}

export class FileWatcherService extends EventEmitter {
  private static instance: FileWatcherService;

  private cwd = process.cwd();
  private watchFolder?: string;
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
    this.watchFolder = path.normalize(path.join(this.cwd, folder));
    const watcher = chokidar.watch(path.join(folder, '**/*'), {
      cwd: this.cwd,
      ignored: /(^|[\/\\])\../,
      persistent: true
    });

    watcher
      .on('add', (p: string) => this.addFile(path.join(this.cwd, p)))
      .on('unlink', (p: string) => this.deleteFileOrFolder(path.join(this.cwd, p)))
      .on('unlinkDir', (p: string) => this.deleteFileOrFolder(path.join(this.cwd, p)))
      .on('error', (error: string) => console.error(`Watcher error: ${error}`))
      .on('ready', () => this.ready());
  }

  /**
   * Get all messages within a session.
   *
   * @param session Session name
   */
  public getMessagesInSession(session: string) {
    return Object.keys(this.store)
      .map((id) => this.store[id])
      .filter((m) => m && m.session === session)
      .map((m) => this.createPublishedMessage(m));
  }

  /**
   * Get all messages within a topic.
   *
   * @param session Session name
   * @param topic Topic name
   */
  public getMessagesInSessionTopic(session: string, topic: string) {
    return Object.keys(this.store)
      .map((id) => this.store[id])
      .filter((m) => m.session === session && m.topic === topic)
      .map((m) => this.createPublishedMessage(m));
  }

  /**
   * Get all sessions.
   */
  public getAllSessions() {
    return Object.keys(this.store)
      .map((key) => this.store[key])
      .reduce((p, c) => (p.indexOf(c.session) < 0 ? [ ...p, c.session ] : p), [] as string[]);
  }

  /**
   * Get all topics within a session.
   */
  public getTopicsInSession(session: string) {
    return Object.keys(this.store)
      .map((key) => this.store[key])
      .reduce((p, c) => (c.session === session && p.indexOf(c.topic) < 0 ? [ ...p, c.topic ] : p), [] as string[]);
  }

  /**
   * Returns the topic (folder name) and message data.
   *
   * @param id Id of the message
   */
  public getMessage(id: string): null | ILogMessage {
    const message = this.store[id];
    if (!message || !message.value) {
      return null;
    }
    const { label, topic, session, timestampMsec, key, value } = message;
    return { id, label, topic, session, timestampMsec, key, value };
  }

  private createPublishedMessage(m: Message): ILogMessage {
    return {
      id: m.id,
      label: m.label,
      topic: m.topic,
      session: m.session,
      timestampMsec: m.timestampMsec,
      value: m.value,
      key: m.key
    };
  }

  private ready() {
    log('Initial scan complete. Waiting for changes...');
    this.status = 'processing';
  }

  private emitReadyOrUpdated() {
    if (this.counter !== 0) {
      return;
    }
    this.emit(this.status === 'ready' ? 'updated' : 'ready');
    this.status = 'ready';
  }

  /**
   * Process a file, adding all messages to the store.
   *
   * @param filename Path to the discovered file
   */
  private addFile(filename: string) {
    this.counter++;
    if (this.isLogFile(filename)) {
      return this.addMessagesFromLogFile(filename);
    }
    const message = new Message(filename);
    message.on('ready', (isValid: boolean) => {
      this.counter--;
      if (!isValid) {
        return;
      }
      log(`File ${filename} has been added`);
      this.store[message.id] = message;
      this.emitReadyOrUpdated();
    });
  }

  /**
   * Add multiple messages to the store.
   *
   * @param filename Name of a log file, containing 1 or more messages
   */
  private addMessagesFromLogFile(filename: string) {
    fs.readFile(filename, 'utf8', (err, content) => {
      if (err) {
        console.error(`Error reading log file ${filename}: ${err}`);
      } else {
        const data: ILogMessage[] = JSON.parse(content);
        if (!(data instanceof Array)) {
          return console.error(`Error reading log file ${filename}: data is not an array.`);
        }
        const session = path.dirname(filename).split(path.sep).pop();
        if (!session) {
          return console.error('addMessagesFromLogFile - error reading session.');
        }
        const extractLabel = (m: ILogMessage) => {
          const senderID = (m.key && m.key.senderID) || '?';
          return m.value && !(m.value instanceof Array)
            ? m.value.name || m.value.title || m.value.label || senderID
            : senderID;
        };
        const minTime = data.reduce(
          (p, c) => (c.key && c.key.dateTimeSent ? Math.min(p, c.key.dateTimeSent) : p),
          Number.MAX_SAFE_INTEGER
        );
        data
          .map((m) => {
            const msg = new Message();
            msg.filename = filename;
            msg.session = session;
            msg.topic = m.topic;
            if (m.key && m.value) {
              msg.key = m.key;
              msg.value = m.value;
              msg.label = extractLabel(m);
              // Convert the timestamp to a relative time
              msg.timestampMsec = m.key.dateTimeSent ? Math.max(0, m.key.dateTimeSent - minTime) : 0;
            }
            return msg;
          })
          .forEach((m) => (this.store[m.id] = m));
        this.counter--;
        this.emitReadyOrUpdated();
      }
    });
  }

  /**
   * A log file is a file downloaded from the Kafka topics UI, which is a JSON file containing a
   * JSON array, where each message has a topic, key, value, parition and offset.
   *
   * The check is based on whether they are located right after the session path, i.e. there is no
   * additional topic folder.
   *
   * @param filename Path to the file
   */
  private isLogFile(filename: string) {
    return path.normalize(path.dirname(path.dirname(filename))) === this.watchFolder;
  }

  /**
   * File has been deleted in the file system
   * @param filename Full filename
   */
  private deleteFileOrFolder(filename: string) {
    log(`${path} has been deleted.`);
    const deleting = Object.keys(this.store)
      .map((id) => this.store[id])
      .filter((m) => m.filename.indexOf(filename) === 0)
      .map((m) => m.id);
    deleting.forEach((id) => this.deleteMessage(id));
    this.emit('updated');
  }

  private deleteMessage(id: string) {
    delete this.store[id];
  }
}
