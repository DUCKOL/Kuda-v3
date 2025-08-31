// src/stores/user.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'

// 这是一个简化版的 user store，专注于客户端逻辑
export const useUserStore = defineStore('user', () => {
  const email = ref<string | null>(null)
  const token = ref<string | null>(null)
  const userId = ref<string | null>(null)

  const isLoggedIn = ref(false)

  async function login(loginEmail: string, password: string): Promise<boolean> {
    try {
      const response = await axios.post('http://localhost:3000/login', {
        email: loginEmail,
        password,
      })

      token.value = response.data.token
      userId.value = response.data.userId
      email.value = loginEmail
      isLoggedIn.value = true
      
      return true
    } catch (error: any) {
      alert(error.response?.data?.message || '登录失败')
      return false
    }
  }

  function logout() {
    email.value = null
    token.value = null
    userId.value = null
    isLoggedIn.value = false
  }

  return { email, token, userId, isLoggedIn, login, logout }
})