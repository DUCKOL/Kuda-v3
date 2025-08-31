<template>
  <div class="auth-container">
    <h1>快答AI - 智能笔试辅助系统</h1>
    
    <div v-if="isLoginView">
      <h2>用户登录</h2>
      <form @submit.prevent="handleLogin">
        <input v-model="email" type="email" placeholder="邮箱" required />
        <input v-model="password" type="password" placeholder="密码" required />
        <button type="submit">登录</button>
      </form>
    </div>
    
    <div v-else>
      <h2>用户注册</h2>
      <form @submit.prevent="handleRegister">
        <input v-model="email" type="email" placeholder="邮箱" required />
        <input v-model="password" type="password" placeholder="密码" required />
        <button type="submit">注册</button>
      </form>
    </div>
    
    <button @click="isLoginView = !isLoginView" class="toggle-btn">
      {{ isLoginView ? '还没有账户？去注册' : '已有账户？去登录' }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const isLoginView = ref(true);
const email = ref('');
const password = ref('');

const handleLogin = () => {
  userStore.attemptLogin(email.value, password.value);
};

const handleRegister = () => {
  userStore.attemptRegister(email.value, password.value);
};
</script>

<style scoped>
  /* 在这里可以添加一些美化样式 */
  .auth-container { max-width: 400px; margin: 50px auto; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  input { display: block; width: 100%; padding: 0.75rem; margin-bottom: 1rem; border-radius: 4px; border: 1px solid #ccc; }
  button { width: 100%; padding: 0.75rem; border: none; border-radius: 4px; color: white; background-color: #007bff; cursor: pointer; }
  .toggle-btn { background: none; color: #007bff; margin-top: 1rem; }
</style>