import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'  // <- Make sure the path and filename are correct
import 'leaflet/dist/leaflet.css'


createApp(App)
  .use(router)
  .mount('#app')
