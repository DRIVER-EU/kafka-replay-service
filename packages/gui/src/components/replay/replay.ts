import { Configuration } from "./../../datasources/configuration";
import {
  SessionsApi,
  SessionName,
  TopicName,
  Message,
  MessagesApi
} from "./../../datasources/swagger";
import { Component, Prop, Vue } from "vue-property-decorator";
import { AppState, WidgetBase } from "@csnext/cs-client";
import VueJsonPretty from "vue-json-pretty";
import "./replay.css";
import { INotification } from "@csnext/cs-core";
import { format } from "url";

@Component({
  template: require("./replay.html"),
  components: {
    VueJsonPretty
  }
})
export default class Replay extends WidgetBase {
  public sessions: SessionName[] = [];
  public selectedSession?: SessionName;
  public topics: TopicName[] = [];
  public selectedTopic?: TopicName;
  public messages: Message[] = [];
  private sessionsApi = new SessionsApi({
    basePath: (process.env.VUE_APP_PATH as string).replace(/\/+$/, "")
  });
  private messageApi = new MessagesApi({
    basePath: (process.env.VUE_APP_PATH as string).replace(/\/+$/, "")
  });
  public selectedMessage: Message = {};

  public rowsPerPageItems = [15, 100, 250];
  public pagination = {
    rowsPerPage: 15
  };

  created() {
    this.sessionsApi.sessionsGet().then(sessions => {
      Vue.set(this, "sessions", sessions);
    });
  }

  selectSession(session: SessionName) {
    this.selectedSession = session;
    this.sessionsApi
      .sessionsSessionIDTopicsGet(session as string)
      .then(topics => {
        Vue.set(this, "topics", topics);
        Vue.set(this, "messages", []);
        if (this.topics.length === 1) {
          this.selectTopic(topics[0]);
        }
      });
    this.selectedMessage = {};
  }

  selectTopic(topic: TopicName) {
    this.selectedTopic = topic;
    this.sessionsApi
      .sessionsSessionIDTopicIDGet(
        this.selectedSession as string,
        topic as string
      )
      .then(messages => {
        Vue.set(this, "messages", messages);
        this.selectedMessage = {};
      });
  }

  selectMessage(message: Message) {
    this.selectedMessage = message;
    console.log(message);
  }

  playMessage(message: Message) {
    if (message.id) {
      this.messageApi
        .messagesMessageIDPost(message.id)
        .catch(() => {
          AppState.Instance.TriggerNotification(<INotification>{
            title: `Error starting ${message.label}`
          });
        })
        .then(() => {
          AppState.Instance.TriggerNotification(<INotification>{
            title: `Message ${message.label} inserted`
          });
        });
    }
  }

  playTopic(topic: TopicName) {
    this.sessionsApi
      .sessionsSessionIDTopicIDPost(
        this.selectedSession as string,
        topic as string
      )
      .catch(() => {
        AppState.Instance.TriggerNotification(<INotification>{
          title: `Error starting ${topic}`
        });
      })
      .then(() => {
        AppState.Instance.TriggerNotification(<INotification>{
          title: `Topic ${topic} started`
        });
      });
  }

  playSession(session: SessionName) {
    this.sessionsApi
      .sessionsSessionIDPost(session as string)
      .catch(() => {
        AppState.Instance.TriggerNotification(<INotification>{
          title: `Error starting ${session}`
        });
      })
      .then(() => {
        AppState.Instance.TriggerNotification(<INotification>{
          title: `Session ${session} started`
        });
      });
  }
}
