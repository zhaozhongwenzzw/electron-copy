import { createRouter, createWebHashHistory } from 'vue-router'
import SearchView from '@renderer/view/search/index.vue'
import SettingsView from '@renderer/view/settings/index.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/search'
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    }
  ]
})
