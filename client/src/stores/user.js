import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api'

export const useUserStore = defineStore('user', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || '')

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(credentials) {
    const res = await authApi.login(credentials)
    user.value = res.user
    token.value = res.token
    localStorage.setItem('user', JSON.stringify(res.user))
    localStorage.setItem('token', res.token)
    return res
  }

  async function register(data) {
    const res = await authApi.register(data)
    user.value = res.user
    token.value = res.token
    localStorage.setItem('user', JSON.stringify(res.user))
    localStorage.setItem('token', res.token)
    return res
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return { user, token, isLoggedIn, isAdmin, login, register, logout }
})
