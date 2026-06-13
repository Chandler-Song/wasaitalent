<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="title">WasaiTalent</h1>
      <p class="subtitle">人才管理系统</p>
      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" @submit.prevent="handleLogin" class="form">
            <el-form-item>
              <el-input v-model="loginForm.username" placeholder="用户名/邮箱" prefix-icon="User" size="large" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="loginForm.password" type="password" placeholder="密码" prefix-icon="Lock" size="large" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleLogin" :loading="loading" size="large" style="width:100%">登录</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <el-form :model="registerForm" @submit.prevent="handleRegister" class="form">
            <el-form-item>
              <el-input v-model="registerForm.username" placeholder="用户名" prefix-icon="User" size="large" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="registerForm.email" placeholder="邮箱" prefix-icon="Message" size="large" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="registerForm.password" type="password" placeholder="密码(至少6位)" prefix-icon="Lock" size="large" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleRegister" :loading="loading" size="large" style="width:100%">注册</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('login')
const loading = ref(false)

const loginForm = ref({ username: '', password: '' })
const registerForm = ref({ username: '', email: '', password: '' })

async function handleLogin() {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.warning('请填写用户名和密码')
    return
  }
  loading.value = true
  try {
    await userStore.login(loginForm.value)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (err) {
    ElMessage.error(err.error || '登录失败')
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  const f = registerForm.value
  if (!f.username || !f.email || !f.password) {
    ElMessage.warning('请填写所有字段')
    return
  }
  loading.value = true
  try {
    await userStore.register(f)
    ElMessage.success('注册成功')
    router.push('/')
  } catch (err) {
    ElMessage.error(err.error || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.title {
  text-align: center;
  font-size: 28px;
  color: #303133;
  margin: 0 0 4px 0;
}
.subtitle {
  text-align: center;
  color: #909399;
  margin: 0 0 24px 0;
  font-size: 14px;
}
.form { margin-top: 16px; }
.hint {
  text-align: center;
  color: #909399;
  font-size: 12px;
  margin-top: 16px;
}
</style>
