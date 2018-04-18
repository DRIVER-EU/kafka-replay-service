import {  IDashboardOptions,  IWidgetOptions,  Project,  ILayoutManagerConfig, IMenu, INotification} from "@csnext/cs-core";
import { LayoutManager, MdWidget, AppState } from "@csnext/cs-client";
import DataSource from "./components/DataSource.vue";
import './assets/example.css'

export const project: Project = {
  header: {
    title: "Test project",
    logo: "./images/logo.png",
    breadcrumbs: false,
    dense: false
  },
  navigation: {
    style: "tabs"
  },
  leftSidebar: {
    open: false,
    mini: false,
    clipped: true,
    permanent: false,
    temporary: true,
    dashboard: {
      widgets: [{ component: MdWidget, data: "left sidebar" }]
    }
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
    dark: true,
    colors: {
      primary: "#000",
      secondary: "#e5e9ea",
      accent: "#82B1FF",
      error: "#FF5252",
      info: "#2196F3",
      success: "#4CAF50",
      warning: "#FFC107"
    }
  },
  rightSidebar: {
    open: false,
    right: true,
    clipped: false,
    temporary: false,
    dashboard: {
      widgets: [{ component: MdWidget, data: "right sidebar" }]
    }
  },
  menus: [
    <IMenu>{
      id: "addmenu",
      icon: "add",
      title: "add chart",
      enabled: true,
      items: [
        {
          id: "adddashboard",
          icon: "note_add",
          title: "add dashboard",
          enabled: true,
          visible: true,
          action: () => {
            AppState.Instance.TriggerNotification(<INotification>{
              title: "Add new dashboard"
            });
          }
        },
        {
          id: "addchart",
          icon: "note_add",
          title: "add chart",
          enabled: true,
          visible: true,
          action: () => {
            AppState.Instance.TriggerNotification(<INotification>{
              title: "Add new chart"
            });
          }
        }
      ],
      visible: true
    }
  ],
    dashboards: [
      {
        title: "Single",
        icon: "assignment",
        path: '/',
        layout: 'single',    
        options: <IDashboardOptions>{ editButton: false},
        widgets: [ { component: DataSource, datasource: 'testdata'}]
      },
      {
        title: "Grid",
        icon: "assignment",
        path: '/grid',
        layout: 'grid',    
        options: <IDashboardOptions>{ editButton: true},
        widgets: [ { component: MdWidget, options: { class: 'widget-1'}, data: 'welcome'}]
      }
        
    ]
  }
