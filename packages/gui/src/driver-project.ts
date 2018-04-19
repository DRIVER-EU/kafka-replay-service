import {  IDashboardOptions,  IWidgetOptions,  Project,  ILayoutManagerConfig, IMenu, INotification} from "@csnext/cs-core";
import { LayoutManager, MdWidget, AppState } from "@csnext/cs-client";
import Replay from "./components/replay/replay";
import './assets/example.css'

export const project: Project = {
  header: {
    title: "Replay Service",
    logo: "./images/driver.png"
  },
  navigation: {
    style: "tabs",
  },
  datasources: {
    testdata: {
      id: "testdata",
      source: "./testdata/test.json",
      handlers: [
        {
          processorId: "webrequest"
        }
      ]
    }
  },
  theme: {
    dark: false,
    colors: {
      primary: "#fdb836",
      secondary: "#e5e9ea",
      accent: "#82B1FF",
      error: "#FF5252",
      info: "#2196F3",
      success: "#4CAF50",
      warning: "#FFC107"
    }
  },
  menus: [
    <IMenu>{
      id: "stop",
      icon: "stop",
      title: "Stop",
      enabled: true,
      visible: true
    }
  ],
    dashboards: [
      {
        title: "Player",
        icon: "assignment",
        path: '/',
        layout: 'single',
        options: <IDashboardOptions>{ editButton: false, class: 'column-layout'},
        widgets: [ { component: Replay, datasource: 'testdata'}]
      }
    ]
  }
