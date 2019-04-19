import Vue from 'vue'
import Vuetify from 'Vuetify'
import 'vuetify/dist/vuetify.min.css'
import XLSX from 'xlsx';

import App from './App'
Vue.use(Vuetify)
if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false
Vue.prototype.xlsx = XLSX
/* eslint-disable no-new */
new Vue({
  components: { App },
  template: '<App/>'
}).$mount('#app')
