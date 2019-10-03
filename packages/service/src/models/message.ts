import * as fs from 'fs';
import * as path from 'path';
import * as parser from 'xml2json';
import { EventEmitter } from 'events';
import { uuid4 } from 'node-test-bed-adapter';

/**
 * The message queue is a singleton that will receive all messages that need to be sent.
 */
export const messageQueue: ILogMessage[] = [];

/** For passing down messages from the controllers to the player */
export const commandQueue: symbol[] = [];

export const resetCommand = Symbol('reset');

export interface IJsonObject {
  [key: string]: any;
}

export interface IDefaultKey {
  distributionID?: string;
  senderID?: string;
  dateTimeSent?: number;
  dateTimeExpires?: number;
  distributionStatus?: string;
  distributionKind?: string;
}

export interface ILogMessage {
  filename?: string;
  id: string;
  label: string;
  topic: string;
  session: string;
  timestampMsec: number;
  partition?: number;
  offset?: number;
  key?: IDefaultKey;
  value?: IJsonObject | IJsonObject[] | any;
}

export interface ILogEntry {
  topic: string;
  partition?: number;
  offset?: number;
  highWaterOffset?: number;
  key?: IDefaultKey;
  value: IJsonObject;
}

/**
 * A message contains the file information, label and timestamp, if any,
 * as well as the actual data it contains, i.e. each message is loaded in memory.
 */
export class Message extends EventEmitter implements ILogMessage {
  public id = uuid4();
  public filename = '';
  public label = '';
  public topic = '';
  public session = '';
  public key = {} as IDefaultKey;
  public timestampMsec = 0;
  public value?: IJsonObject | IJsonObject[];

  constructor(public file?: string) {
    super();
    if (!file) {
      return;
    }
    this.filename = file;
    const basename = path.basename(file);
    this.timestampMsec = this.extractTimestamp(basename);
    this.label = this.extractLabel(basename);
    const folders = path.dirname(file).split(path.sep);
    this.topic = folders.pop() || '';
    this.session = folders.pop() || '';
    this.loadMessage(file);
  }

  private extractTimestamp(filename: string) {
    const regex = /(\d+)/;
    if (!regex.test(filename)) {
      return 0;
    }
    const result = regex.exec(filename);
    if (result === null) {
      return 0;
    }
    return +result[1];
  }

  private extractLabel(filename: string) {
    const regex = /\d*([a-zA-Z\d_]+)/;
    if (!regex.test(filename)) {
      return '';
    }
    const result = regex.exec(filename);
    if (result === null) {
      return '';
    }
    return result[1].replace('_', ' ');
  }

  private loadMessage(filename: string) {
    const ext = path.extname(filename);
    if (!ext) {
      return;
    }
    switch (ext.toLowerCase()) {
      default:
        // tslint:disable-next-line:no-console
        console.warn(`Unknown file extension (${ext})! Only XML and JSON are accepted. Skipping.`);
        break;
      case '.xml':
        this.loadXmlMessage(filename);
        break;
      case '.geojson':
      case '.json':
        this.loadJsonMessage(filename);
        break;
    }
  }

  private loadXmlMessage(filename: string) {
    fs.readFile(filename, 'utf8', (err, data) => {
      if (err) {
        // tslint:disable-next-line:no-console
        console.error(`Error reading file ${filename}: ${err}`);
      } else {
        this.value = JSON.parse(parser.toJson(data));
      }
      this.ready();
    });
  }

  private loadJsonMessage(filename: string) {
    fs.readFile(filename, 'utf8', (err, data) => {
      if (err) {
        // tslint:disable-next-line:no-console
        console.error(`Error reading file ${filename}: ${err}`);
      } else {
        this.value = JSON.parse(data);
      }
      this.ready();
    });
  }

  private ready() {
    const isValid = this.value !== null && typeof this.value !== 'undefined';
    this.emit('ready', isValid);
  }
}
