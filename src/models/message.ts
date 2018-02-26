import * as fs from 'fs';
import * as path from 'path';
import * as parser from 'xml2json';
import { EventEmitter } from 'events';
import { uuid4 } from 'node-test-bed-adapter';

export interface IMessage {
  filename?: string;
  id: string;
  label: string;
  topic: string;
  session: string;
  timestampMsec: number;
  data?: IJsonObject | IJsonObject[];
}

export interface IJsonObject {
  [key: string]: any;
}

/**
 * A message contains the file information, label and timestamp, if any,
 * as well as the actual data it contains, i.e. each message is loaded in memory.
 */
export class Message extends EventEmitter implements IMessage {
  public id: string;
  public label: string;
  public topic: string;
  public session: string;
  public timestampMsec = 0;
  public data?: IJsonObject | IJsonObject[];

  constructor(public filename: string) {
    super();
    const basename = path.basename(filename);
    this.timestampMsec = this.extractTimestamp(basename);
    this.label = this.extractLabel(basename);
    const folders = path.dirname(filename).split(path.sep);
    this.topic = folders.pop() || '';
    this.session = folders.pop() || '';
    this.id = uuid4();
    this.loadMessage(filename);
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
        console.error(`Error reading file ${filename}: ${err}`);
      } else {
        this.data = JSON.parse(parser.toJson(data));
      }
      this.ready();
    });
  }

  private loadJsonMessage(filename: string) {
    fs.readFile(filename, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading file ${filename}: ${err}`);
      } else {
        this.data = JSON.parse(data);
      }
      this.ready();
    });
  }

  private ready() {
    const isValid = this.data !== null && typeof this.data !== 'undefined';
    this.emit('ready', isValid);
  }
}
