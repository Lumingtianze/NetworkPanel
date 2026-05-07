import { createApp } from 'vue'
import App from './App.vue'
import { VueClipboard } from '@soerenmartius/vue3-clipboard'
import 'element-plus/theme-chalk/dark/css-vars.css'
import "./assets/elm-theme.css"

const app = createApp(App)
app.use(VueClipboard)

app.mount('#app')
