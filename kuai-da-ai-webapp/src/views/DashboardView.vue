<!-- src/views/DashboardView.vue -->
<template>
  <div class="dashboard-container">
    <header>
      <h1>YKUDA - AI</h1>
      <div class="status">
        状态: 
        <span :class="answersStore.isConnected ? 'connected' : 'disconnected'">
          {{ answersStore.isConnected ? '已连接' : '未连接' }}
        </span>
      </div>
      <button @click="userStore.logout()">退出登录</button>
    </header>
    
    <main class="answer-area">
      <div v-if="answersStore.answers.length === 0" class="placeholder">
        等待题目...
      </div>
      <div v-else class="answer-list">
        <div v-for="(item, index) in answersStore.answers" :key="index" class="answer-card">
          <p><strong>回答:</strong> {{ item.answer }}</p>
          <div class="meta">
            <span><strong>模型:</strong> {{ item.model }}</span>
            <small>{{ new Date(item.timestamp).toLocaleString() }}</small>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { useAnswersStore } from '@/stores/answers';

const userStore = useUserStore();
const answersStore = useAnswersStore();

onMounted(() => {
  if (userStore.token) {
    answersStore.connect(userStore.token);
  } else {
    // 如果没有token，强制返回登录页
    userStore.logout();
  }
});

onUnmounted(() => {
  answersStore.disconnect();
});
</script>

<style scoped>
  .dashboard-container { display: flex; flex-direction: column; height: 100vh; }
  header { display: flex; align-items: center; padding: 1rem 2rem; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  header h1 { font-size: 1.2rem; margin-right: auto; }
  .status { margin-right: 1rem; }
  .connected { color: #28a745; }
  .disconnected { color: #dc3545; }
  .answer-area { flex-grow: 1; padding: 2rem; overflow-y: auto; }
  .placeholder { text-align: center; color: #888; margin-top: 5rem; }
  .answer-list { display: flex; flex-direction: column; gap: 1.5rem; max-width: 800px; margin: 0 auto; }
  .answer-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .answer-card p { margin: 0 0 1rem 0; line-height: 1.6; }
  .meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; color: #666; }
</style>