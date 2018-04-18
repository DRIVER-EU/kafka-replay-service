
import Vue from 'vue'
import App from './App.vue'
import { CsApp, AppState } from '@csnext/cs-client';
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css';
import './assets/icons.css';
import 'portable-fetch';
import {SessionsApi } from './datasources/swagger'
Vue.use(Vuetify);
import { project } from './driver-project';
import { BaseAPI } from './datasources/swagger';
// import { project } from './defaultproject';

Vue.config.productionTip = false

new Vue({
  render: h => h(CsApp)
}).$mount('#app');


AppState.Instance.init(project);
(<any>window).app = AppState.Instance; 