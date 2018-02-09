import { ICommandOptions } from './index';
import { EventEmitter } from 'events';
import { Message, ProduceRequest } from 'kafka-node';
import { TestBedAdapter, Logger, LogLevel } from 'node-test-bed-adapter';

const ConfigurationTopic = 'test-bed-configuration';
const TimeTopic = 'test-bed-time';

export class PlayerService extends EventEmitter {
  private adapter: TestBedAdapter;
  private log = Logger.instance;
  /** Can be used in clearInterval to reset the timer */
  private timeHandler?: NodeJS.Timer;

  constructor(options: ICommandOptions) {
    super();
    this.adapter = new TestBedAdapter({
      kafkaHost: 'localhost:3501',
      schemaRegistry: 'localhost:3502',
      fetchAllSchemas: false,
      clientId: 'Consumer',
      consume: [
        // { topic: ConfigurationTopic }
      ],
      produce: [ TimeTopic ],
      logging: {
        logToConsole: LogLevel.Debug,
        logToKafka: LogLevel.Debug
      }
    });
    this.adapter.on('ready', () => {
      this.subscribe();
      this.log.info('Consumer is connected');
    });
  }

  public connect() {
    this.adapter.connect();
  }

  private subscribe() {
    this.adapter.on('message', (message) => this.handleMessage(message));
  }

  private handleMessage(message: Message) {
    switch (message.topic) {
      case 'test-bed-configuration':
        break;
      default:
        console.log(message.value);
        break;
    }
  }
}
