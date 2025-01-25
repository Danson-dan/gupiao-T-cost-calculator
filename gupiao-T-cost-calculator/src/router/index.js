import { createRouter, createWebHistory } from 'vue-router'
import Calculator from '../views/Calculator.vue'
import History from '../views/History.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Calculator',
      component: Calculator,
    },
    {
      path: '/History',
      name: 'History',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/History.vue'),
    },
  ],
})

export default router
