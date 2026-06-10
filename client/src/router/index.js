import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    // 人才详情页 - 独立页面，不在 Layout 内，支持多标签页独立状态
    path: '/talents/:id',
    name: 'TalentDetail',
    component: () => import('../views/TalentDetail.vue'),
    meta: { title: '人才详情' }
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    redirect: '/talents',
    children: [
      {
        path: 'talents',
        name: 'Talents',
        component: () => import('../views/TalentList.vue'),
        meta: { title: '人才列表' }
      },
      {
        path: 'talents/create',
        name: 'TalentCreate',
        component: () => import('../views/TalentForm.vue'),
        meta: { title: '添加人才' }
      },
      {
        path: 'talents/:id/edit',
        name: 'TalentEdit',
        component: () => import('../views/TalentForm.vue'),
        meta: { title: '编辑人才' }
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('../views/Admin.vue'),
        meta: { title: '管理后台', requireAdmin: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else if (to.meta.requireAdmin) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role !== 'admin') {
      next('/')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
