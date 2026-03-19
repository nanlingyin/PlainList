import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(sessionStorage.getItem('pl_token') || null)
  const currentUser = ref(null)
  const isAdmin = ref(false)

  const isLoggedIn = computed(() => !!token.value && !!currentUser.value)

  function setAuth(t, user, admin) {
    token.value = t
    currentUser.value = user
    isAdmin.value = admin
    sessionStorage.setItem('pl_token', t)
  }

  function logout() {
    token.value = null
    currentUser.value = null
    isAdmin.value = false
    sessionStorage.removeItem('pl_token')
  }

  return { token, currentUser, isAdmin, isLoggedIn, setAuth, logout }
})
