import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './views/Home.vue'
import AdminDashboard from './views/AdminDashboard.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/admin/dashboard', component: AdminDashboard },
  { path: '/admin/dashboard/:token', component: AdminDashboard },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
