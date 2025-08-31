import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token'))
  const userId = ref(localStorage.getItem('userId'))
  
  const isLoggedIn = ref(!!token.value)

  async function attemptLogin(email, password) {
    try {
      const response = await axios.post('http://192.168.1.75:3000/login', { email, password });
      
      token.value = response.data.token
      userId.value = response.data.userId
      isLoggedIn.value = true
      
      localStorage.setItem('token', token.value)
      localStorage.setItem('userId', userId.value)
      
      // 登录成功后，跳转到主界面
      router.push('/dashboard')
    } catch (error) {
      alert(error.response?.data?.message || '登录失败')
    }
  }
  
  async function attemptRegister(email, password) {
    try {
      const response = await axios.post('http://192.168.1.75:3000/register', { email, password });
      alert(response.data.message + '，请现在登录。');
      // 注册成功后可以自动跳转或提示用户登录
    } catch (error) {
       alert(error.response?.data?.message || '注册失败');
    }
  }

  function logout() {
    token.value = null
    userId.value = null
    isLoggedIn.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    router.push('/') // 登出后返回登录页
  }

  return { token, userId, isLoggedIn, attemptLogin, attemptRegister, logout }
})