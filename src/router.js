// src/router.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Details from './views/Details.vue'

const routes = [
  { path: '/', redirect: '/divisions' },
  { path: '/divisions', component: Home },
  { path: '/division/:id/districts', component: Home },
  { path: '/district/:id/upazilas', component: Home },
  { path: '/upazila/:id/unions', component: Home },
  {
  path: '/details/:level/:id',
  component: Details
  }

]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
