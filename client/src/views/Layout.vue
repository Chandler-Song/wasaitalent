<template>
  <el-container class="layout-container">
    <!-- 左侧导航栏，支持折叠/展开 -->
    <el-aside :width="collapsed ? '64px' : '220px'" class="sidebar" :class="{ collapsed }">
      <div class="logo" @click="collapsed = !collapsed" style="cursor:pointer">
        <h2 v-if="!collapsed">WasaiTalent</h2>
        <span v-else class="logo-icon">WT</span>
      </div>
      <el-menu
        :default-active="currentRoute"
        router
        class="sidebar-menu"
        background-color="#1d1e2c"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        :collapse="collapsed"
        :collapse-transition="true"
      >
        <el-menu-item index="/talents">
          <el-icon><User /></el-icon>
          <template #title>人才列表</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.isAdmin" index="/admin">
          <el-icon><Setting /></el-icon>
          <template #title>管理后台</template>
        </el-menu-item>
      </el-menu>
      <!-- 底部折叠按钮 -->
      <div class="collapse-btn" @click="collapsed = !collapsed">
        <el-icon v-if="collapsed"><Expand /></el-icon>
        <el-icon v-else><Fold /></el-icon>
        <span v-if="!collapsed" style="margin-left:8px">收起菜单</span>
      </div>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="toggle-btn" @click="collapsed = !collapsed" style="cursor:pointer;font-size:20px;margin-right:16px">
            <Fold v-if="!collapsed" />
            <Expand v-else />
          </el-icon>
          <span class="page-title">{{ currentTitle }}</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><UserFilled /></el-icon>
              {{ userStore.user?.username }}
              <el-tag v-if="userStore.isAdmin" type="danger" size="small" style="margin-left:6px">管理员</el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view :key="$route.fullPath" />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const collapsed = ref(false)

const currentRoute = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || 'WasaiTalent')

function handleCommand(cmd) {
  if (cmd === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container { height: 100vh; }
.sidebar {
  background: #1d1e2c;
  overflow: hidden;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
}
.sidebar.collapsed {
  overflow-x: hidden;
}
.logo {
  padding: 16px 20px;
  text-align: center;
  border-bottom: 1px solid #2d2e3e;
  white-space: nowrap;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo h2 {
  color: #409eff;
  margin: 0;
  font-size: 18px;
}
.logo-icon {
  color: #409eff;
  font-size: 18px;
  font-weight: bold;
}
.sidebar-menu {
  border-right: none;
  flex: 1;
}
.collapse-btn {
  padding: 12px 20px;
  border-top: 1px solid #2d2e3e;
  color: #bfcbd9;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 13px;
  white-space: nowrap;
  transition: color 0.2s;
}
.collapse-btn:hover { color: #409eff; }
.header {
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  padding: 0 20px;
}
.header-left { display: flex; align-items: center; }
.page-title { font-size: 16px; font-weight: 600; color: #303133; }
.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #606266;
}
.main-content {
  background: #f5f7fa;
  padding: 20px;
}
</style>
