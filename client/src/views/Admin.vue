<template>
  <div v-loading="loading">
    <!-- 统计卡片 -->
    <el-row :gutter="16" v-if="dashboard">
      <el-col :span="4">
        <el-card shadow="never" class="stat-card"><el-statistic title="总用户数" :value="dashboard.totalUsers" /></el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never" class="stat-card"><el-statistic title="总人才数" :value="dashboard.totalTalents" /></el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never" class="stat-card"><el-statistic title="平台档案" :value="dashboard.totalProfiles" /></el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never" class="stat-card"><el-statistic title="人才关联" :value="dashboard.totalMerges" /></el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never" class="stat-card"><el-statistic title="总备注" :value="dashboard.totalNotes" /></el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never" class="stat-card"><el-statistic title="API密钥" :value="dashboard.totalApiKeys" /></el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top:20px">
      <!-- 数据来源分布 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header><span>数据来源分布</span></template>
          <div v-for="item in dashboard?.sourceStats" :key="item.data_source" class="source-bar">
            <span class="source-label">{{ sourceLabel(item.data_source) }}</span>
            <el-progress :percentage="Math.round(item.count / dashboard.totalTalents * 100)" :stroke-width="18" :text-inside="true" :format="() => item.count" />
          </div>
        </el-card>
      </el-col>

      <!-- 导入方式分布 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header><span>导入方式分布</span></template>
          <div v-for="item in dashboard?.importMethodStats" :key="item.import_method" class="source-bar">
            <span class="source-label">{{ importMethodLabel(item.import_method) }}</span>
            <el-progress :percentage="Math.round(item.count / dashboard.totalTalents * 100)" :stroke-width="18" :text-inside="true" :format="() => item.count" type="success" />
          </div>
        </el-card>
      </el-col>

      <!-- 平台档案分布 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header><span>平台档案分布</span></template>
          <div v-for="item in dashboard?.platformStats" :key="item.platform" class="source-bar">
            <span class="source-label">{{ platformLabel(item.platform) }}</span>
            <el-progress :percentage="dashboard.totalProfiles ? Math.round(item.count / dashboard.totalProfiles * 100) : 0" :stroke-width="18" :text-inside="true" :format="() => item.count" type="warning" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近添加的人才 -->
    <el-card shadow="never" style="margin-top:20px">
      <template #header><span>最近添加的人才</span></template>
      <el-table :data="dashboard?.recentTalents" size="small">
        <el-table-column prop="name" label="姓名" width="80" />
        <el-table-column prop="company" label="公司" width="100" />
        <el-table-column prop="title" label="职位" width="100" />
        <el-table-column prop="data_source" label="数据来源" width="90" />
        <el-table-column prop="import_method" label="导入方式" width="90" />
        <el-table-column prop="created_at" label="时间" />
      </el-table>
    </el-card>

    <!-- 用户管理 -->
    <el-card shadow="never" style="margin-top:20px">
      <template #header><span>用户管理</span></template>
      <el-table :data="users" size="small">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : ''">{{ row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-select v-model="row.role" size="small" @change="updateRole(row)" style="width:100px">
              <el-option label="管理员" value="admin" />
              <el-option label="用户" value="user" />
              <el-option label="观察者" value="viewer" />
            </el-select>
            <el-button size="small" type="danger" @click="deleteUser(row)" :disabled="row.id === userStore.user?.id" style="margin-left:8px">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- API密钥管理 -->
    <el-card shadow="never" style="margin-top:20px">
      <template #header>
        <div class="card-header">
          <span>API密钥管理</span>
          <el-button type="primary" size="small" @click="showApiKeyDialog = true">创建密钥</el-button>
        </div>
      </template>
      <el-table :data="apiKeys" size="small">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="permissions" label="权限" width="100" />
        <el-table-column prop="last_used_at" label="最后使用" width="180" />
        <el-table-column prop="created_at" label="创建时间" />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="deleteApiKey(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建API密钥对话框 -->
    <el-dialog v-model="showApiKeyDialog" title="创建API密钥" width="400px">
      <el-form :model="apiKeyForm" label-width="60px">
        <el-form-item label="名称"><el-input v-model="apiKeyForm.name" placeholder="密钥名称" /></el-form-item>
        <el-form-item label="权限">
          <el-select v-model="apiKeyForm.permissions">
            <el-option label="只读" value="read" />
            <el-option label="读写" value="write" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApiKeyDialog = false">取消</el-button>
        <el-button type="primary" @click="createApiKey">创建</el-button>
      </template>
    </el-dialog>

    <!-- 新密钥展示对话框 -->
    <el-dialog v-model="showKeyResult" title="API密钥已创建" width="500px">
      <el-alert type="warning" :closable="false" style="margin-bottom:16px">请妥善保存此密钥，关闭后将无法再次查看完整密钥。</el-alert>
      <el-input :model-value="newKeyValue" readonly>
        <template #append><el-button @click="copyKey">复制</el-button></template>
      </el-input>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '../api'
import { useUserStore } from '../stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const userStore = useUserStore()
const loading = ref(true)
const dashboard = ref(null)
const users = ref([])
const apiKeys = ref([])
const showApiKeyDialog = ref(false)
const showKeyResult = ref(false)
const newKeyValue = ref('')
const apiKeyForm = ref({ name: '', permissions: 'read' })

async function loadDashboard() {
  loading.value = true
  try {
    const [dashRes, usersRes, keysRes] = await Promise.all([adminApi.dashboard(), adminApi.users(), adminApi.listApiKeys()])
    dashboard.value = dashRes.data
    users.value = usersRes.data
    apiKeys.value = keysRes.data
  } catch (err) { ElMessage.error('加载管理数据失败') }
  finally { loading.value = false }
}

async function updateRole(user) {
  try { await adminApi.updateRole(user.id, user.role); ElMessage.success('角色已更新') }
  catch (err) { ElMessage.error('更新角色失败') }
}

async function deleteUser(user) {
  try { await ElMessageBox.confirm(`确定删除用户 ${user.username}？`, '确认', { type: 'warning' }); await adminApi.deleteUser(user.id); ElMessage.success('用户已删除'); loadDashboard() }
  catch {}
}

async function createApiKey() {
  try {
    const res = await adminApi.createApiKey(apiKeyForm.value)
    newKeyValue.value = res.data.key; showApiKeyDialog.value = false; showKeyResult.value = true
    apiKeyForm.value = { name: '', permissions: 'read' }; loadDashboard()
  } catch (err) { ElMessage.error('创建密钥失败') }
}

async function deleteApiKey(key) {
  try { await adminApi.deleteApiKey(key.id); ElMessage.success('密钥已删除'); loadDashboard() }
  catch (err) { ElMessage.error('删除密钥失败') }
}

function copyKey() { navigator.clipboard.writeText(newKeyValue.value); ElMessage.success('已复制到剪贴板') }

const sourceMap = { linkedin: 'LinkedIn', maimai: '脉脉', github: 'GitHub', aminer: 'AMiner', wechat: '微信', arxiv: 'arXiv', patent: '专利', conference: '会议', manual: '手动录入', api: 'API', csv: 'CSV' }
const importMap = { api: 'API导入', csv_import: 'CSV导入', manual: '手动录入', openapi: '开放API', batch: '批量导入' }
const platformMap = { linkedin: 'LinkedIn', maimai: '脉脉', github: 'GitHub', aminer: 'AMiner', wechat: '微信', arxiv: 'arXiv', patent: '专利', conference: '会议' }

function sourceLabel(v) { return sourceMap[v] || v }
function importMethodLabel(v) { return importMap[v] || v }
function platformLabel(v) { return platformMap[v] || v }

onMounted(loadDashboard)
</script>

<style scoped>
.stat-card { text-align: center; }
.source-bar { margin-bottom: 12px; }
.source-label { display: inline-block; width: 80px; font-size: 14px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
