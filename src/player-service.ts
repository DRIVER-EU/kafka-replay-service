import { ILogMessage, messageQueue } from './models/message';
import { ICommandOptions } from './index';
import { EventEmitter } from 'events';
import { ProduceRequest } from 'kafka-node';
import { TestBedAdapter, Logger, LogLevel, IAdapterMessage } from 'node-test-bed-adapter';

const log = Logger.instance;

export class PlayerService extends EventEmitter {
  private adapter: TestBedAdapter;

  constructor(options: ICommandOptions) {
    super();
    this.adapter = new TestBedAdapter({
      kafkaHost: options.kafkaHost,
      schemaRegistry: options.schemaRegistry,
      wrapUnions: 'auto',
      schemaFolder: options.schemaFolder,
      autoRegisterSchemas: options.schemaFolder ? true : false,
      fetchAllSchemas: true,
      clientId: 'kafka-replay-service',
      consume: [
        // { topic: ConfigurationTopic }
      ],
      produce: [],
      logging: {
        logToConsole: LogLevel.Debug,
        logToKafka: LogLevel.Error
      }
    });
    this.adapter.on('ready', () => {
      this.subscribe();
      this.startEventLoop();
      log.info('Consumer is connected');
    });
  }

  public connect() {
    this.adapter.connect();
  }

  private subscribe() {
    this.adapter.on('message', (message) => this.handleMessage(message));
  }

  private startEventLoop() {
    let eventQueue: { timestamp: number; message: ILogMessage }[] = [];

    const enqueue = () => {
      if (messageQueue.length === 0) {
        return;
      }
      const curTime = this.adapter.simTime.valueOf();
      while (messageQueue.length > 0) {
        const m = messageQueue.shift() as ILogMessage;
        eventQueue.push({ timestamp: curTime + m.timestampMsec, message: m });
      }
    };

    const activeMessages = () => {
      const curTime = this.adapter.simTime.valueOf();
      const outbox = {} as { [topic: string]: ILogMessage[] };
      if (eventQueue.length === 0) { return undefined; }
      eventQueue = eventQueue.filter((c) => {
        if (c.timestamp <= curTime) {
          if (!outbox.hasOwnProperty(c.message.topic)) {
            outbox[c.message.topic] = [c.message];
            Promise.resolve(this.adapter.addProducerTopics(c.message.topic));
            return false;
          } else {
            outbox[c.message.topic].push(c.message);
            return false;
          }
        }
        return true;
      });
      return outbox;
    };

    const send = (outbox?: { [topic: string]: ILogMessage[] }) => {
      if (!outbox) { return; }
      Object.keys(outbox)
        .map((topic) => outbox[topic])
        .map((messages) =>
          messages.map(
            (m) => ({ topic: m.topic, messages: m.value, key: m.key, partion: m.partition } as ProduceRequest)
          )
        )
        .forEach((pr) =>
          this.adapter.send(pr, (error, data) => {
            if (error) {
              log.error(`startEventLoop - send: Error sending message: ${error}!`);
            } else {
              log.debug(`startEventLoop - send:\n` + JSON.stringify(data, null, 2));
            }
          })
        );
    };

    const mainLoop = () => {
      enqueue();
      send(activeMessages());
      run();
    };

    const run = () => {
      setTimeout(() => {
        mainLoop();
      }, 5);
    };

    run();
  }

  private handleMessage(message: IAdapterMessage) {
    switch (message.topic) {
      case 'test-bed-configuration':
        break;
      default:
        log.info(JSON.stringify(message, null, 2));
        break;
    }
  }
}
