<template>
  <div>
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <!-- 基础搜索行 -->
      <el-row :gutter="12" align="middle">
        <el-col :span="6">
          <el-input v-model="filters.search" placeholder="搜索姓名/公司/技能/邮箱/电话..." clearable @clear="loadTalents" @keyup.enter="loadTalents" prefix-icon="Search" />
        </el-col>
        <el-col :span="3">
          <el-select v-model="filters.data_source" placeholder="数据来源" clearable @change="loadTalents">
            <el-option label="LinkedIn" value="linkedin" />
            <el-option label="脉脉" value="maimai" />
            <el-option label="GitHub" value="github" />
            <el-option label="AMiner" value="aminer" />
            <el-option label="微信" value="wechat" />
            <el-option label="arXiv" value="arxiv" />
            <el-option label="专利" value="patent" />
            <el-option label="会议" value="conference" />
            <el-option label="手动录入" value="manual" />
            <el-option label="CSV" value="csv" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select v-model="filters.status" placeholder="状态" clearable @change="loadTalents">
            <el-option label="活跃" value="active" />
            <el-option label="已联系" value="contacted" />
            <el-option label="不活跃" value="inactive" />
            <el-option label="待处理" value="pending" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select v-model="filters.open_to_work" placeholder="求职状态" clearable @change="loadTalents">
            <el-option label="在看机会" value="yes" />
            <el-option label="不在看" value="no" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="loadTalents" icon="Search">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button link type="primary" @click="showAdvanced = !showAdvanced">
            {{ showAdvanced ? '收起' : '高级搜索' }}
            <el-icon style="margin-left:4px"><ArrowUp v-if="showAdvanced" /><ArrowDown v-else /></el-icon>
          </el-button>
        </el-col>
      </el-row>

      <!-- 高级搜索面板 -->
      <el-collapse-transition>
        <div v-if="showAdvanced" class="advanced-search">
          <el-divider style="margin:12px 0" />
          <el-row :gutter="12" style="margin-bottom:10px">
            <el-col :span="4">
              <el-input v-model="filters.location" placeholder="地区" clearable @clear="loadTalents" @keyup.enter="loadTalents" />
            </el-col>
            <el-col :span="4">
              <el-input v-model="filters.skills" placeholder="技能关键词" clearable @clear="loadTalents" @keyup.enter="loadTalents" />
            </el-col>
            <el-col :span="3">
              <el-select v-model="filters.education" placeholder="学历" clearable @change="loadTalents">
                <el-option label="博士" value="博士" />
                <el-option label="硕士" value="硕士" />
                <el-option label="本科" value="本科" />
                <el-option label="大专" value="大专" />
                <el-option label="MBA" value="MBA" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-col>
            <el-col :span="3">
              <el-select v-model="filters.gender" placeholder="性别" clearable @change="loadTalents">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-col>
            <el-col :span="3">
              <el-select v-model="filters.import_method" placeholder="导入方式" clearable @change="loadTalents">
                <el-option label="手动" value="manual" />
                <el-option label="API" value="api" />
                <el-option label="CSV" value="csv_import" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <div style="display:flex;align-items:center;gap:4px">
                <el-input-number v-model="filters.experience_years_min" :min="0" :max="50" placeholder="经验最少" size="default" controls-position="right" style="flex:1" />
                <span style="color:#909399">~</span>
                <el-input-number v-model="filters.experience_years_max" :min="0" :max="50" placeholder="最多" size="default" controls-position="right" style="flex:1" />
                <span style="font-size:12px;color:#909399;white-space:nowrap">年</span>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="4">
              <el-input v-model="filters.email" placeholder="邮箱包含" clearable @clear="loadTalents" @keyup.enter="loadTalents" />
            </el-col>
            <el-col :span="4">
              <el-input v-model="filters.phone" placeholder="电话包含" clearable @clear="loadTalents" @keyup.enter="loadTalents" />
            </el-col>
            <el-col :span="4">
              <el-input v-model="filters.wechat" placeholder="微信包含" clearable @clear="loadTalents" @keyup.enter="loadTalents" />
            </el-col>
            <el-col :span="4">
              <el-input v-model="filters.suitable_roles" placeholder="适合岗位" clearable @clear="loadTalents" @keyup.enter="loadTalents" />
            </el-col>
            <el-col :span="4">
              <el-input v-model="filters.job_preference" placeholder="求职偏好" clearable @clear="loadTalents" @keyup.enter="loadTalents" />
            </el-col>
            <el-col :span="4">
              <div style="display:flex;align-items:center;gap:4px">
                <el-input v-model="filters.expected_salary_min" placeholder="薪资最低" clearable style="flex:1" />
                <span style="color:#909399">~</span>
                <el-input v-model="filters.expected_salary_max" placeholder="最高" clearable style="flex:1" />
              </div>
            </el-col>
          </el-row>
        </div>
      </el-collapse-transition>
    </el-card>

    <!-- 人才列表 -->
    <el-card shadow="never" style="margin-top:16px">
      <template #header>
        <div class="list-header">
          <span>人才列表 ({{ total }})</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="showColConfig = !showColConfig" plain>列配置</el-button>
            <el-button type="success" size="small" @click="openEdit(null)" icon="Plus">添加人才</el-button>
          </div>
        </div>
      </template>

      <!-- 列配置面板 -->
      <div v-if="showColConfig" class="col-config">
        <el-checkbox-group v-model="visibleCols">
          <el-checkbox v-for="col in allCols" :key="col.key" :label="col.key">{{ col.label }}</el-checkbox>
        </el-checkbox-group>
      </div>

      <el-table :data="talents" v-loading="loading" stripe style="width:100%" @row-click="openDetail" class="talent-table">
        <el-table-column prop="name" label="姓名" width="100" fixed="left" />
        <el-table-column prop="company" label="公司" width="130" v-if="visibleCols.includes('company')" />
        <el-table-column prop="title" label="职位" width="120" v-if="visibleCols.includes('title')" />
        <el-table-column prop="location" label="地区" width="80" v-if="visibleCols.includes('location')" />
        <el-table-column prop="skills" label="技能" min-width="160" v-if="visibleCols.includes('skills')">
          <template #default="{ row }">
            <el-tag v-for="skill in (row.skills||'').split(',').filter(Boolean).slice(0,3)" :key="skill" size="small" style="margin:2px">{{ skill.trim() }}</el-tag>
            <span v-if="(row.skills||'').split(',').filter(Boolean).length > 3" style="color:#909399;font-size:12px"> +{{ (row.skills||'').split(',').filter(Boolean).length - 3 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="data_source" label="数据来源" width="90" v-if="visibleCols.includes('data_source')">
          <template #default="{ row }">
            <el-tag :type="sourceTagType(row.data_source)" size="small">{{ sourceLabel(row.data_source) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" v-if="visibleCols.includes('status')">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="档案" width="60" align="center" v-if="visibleCols.includes('profile_count')">
          <template #default="{ row }">
            <el-badge :value="row.profile_count" :hidden="!row.profile_count" type="info">
              <el-icon><Link /></el-icon>
            </el-badge>
          </template>
        </el-table-column>
        <el-table-column prop="rating" label="评分" width="110" v-if="visibleCols.includes('rating')">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="open_to_work" label="求职" width="60" align="center" v-if="visibleCols.includes('open_to_work')">
          <template #default="{ row }">
            <el-tag v-if="row.open_to_work === 'yes'" type="success" size="small">在看</el-tag>
            <el-tag v-else-if="row.open_to_work === 'no'" type="info" size="small">不看</el-tag>
            <span v-else style="color:#c0c4cc;font-size:12px">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="110" v-if="visibleCols.includes('created_at')">
          <template #default="{ row }">
            <span style="font-size:12px;color:#909399">{{ row.created_at?.slice(0, 10) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click.stop="openEdit(row.id)">编辑</el-button>
            <el-button size="small" type="danger" link @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="limit"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadTalents"
          @current-change="loadTalents"
        />
      </div>
    </el-card>
    <!-- 人才详情模态框 -->
    <el-dialog v-model="showDetailDialog" :title="'人才详情 #' + selectedTalentId" width="92%" top="3vh" destroy-on-close class="detail-dialog">
      <TalentDetail
        v-if="showDetailDialog"
        :talent-id="selectedTalentId"
        :embedded="true"
        @edit="(id) => { showDetailDialog = false; openEdit(id) }"
      />
    </el-dialog>

    <!-- 人才编辑模态框 -->
    <el-dialog v-model="showEditDialog" :title="editingTalentId ? '编辑人才 #' + editingTalentId : '添加人才'" width="80%" top="3vh" destroy-on-close>
      <TalentForm
        v-if="showEditDialog"
        :talent-id="editingTalentId"
        :embedded="true"
        @saved="onEditSaved"
        @cancel="showEditDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { talentsApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import TalentDetail from './TalentDetail.vue'
import TalentForm from './TalentForm.vue'

const router = useRouter()
const talents = ref([])
const loading = ref(false)
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const showColConfig = ref(false)
const showAdvanced = ref(false)

// 模态框状态
const showDetailDialog = ref(false)
const selectedTalentId = ref(null)
const showEditDialog = ref(false)
const editingTalentId = ref(null)

function openDetail(row) {
  selectedTalentId.value = row.id
  showDetailDialog.value = true
}

function openEdit(id) {
  editingTalentId.value = id || null
  showEditDialog.value = true
}

function onEditSaved() {
  showEditDialog.value = false
  editingTalentId.value = null
  loadTalents()
}

const defaultFilters = {
  search: '', data_source: '', import_method: '', status: '', open_to_work: '',
  education: '', gender: '', location: '', skills: '',
  experience_years_min: undefined, experience_years_max: undefined,
  expected_salary_min: '', expected_salary_max: '',
  email: '', phone: '', wechat: '', suitable_roles: '', job_preference: ''
}
const filters = reactive({ ...defaultFilters })

function resetFilters() {
  Object.assign(filters, { ...defaultFilters })
  page.value = 1
  loadTalents()
}

const allCols = [
  { key: 'company', label: '公司' },
  { key: 'title', label: '职位' },
  { key: 'location', label: '地区' },
  { key: 'skills', label: '技能' },
  { key: 'data_source', label: '数据来源' },
  { key: 'status', label: '状态' },
  { key: 'profile_count', label: '档案' },
  { key: 'rating', label: '评分' },
  { key: 'open_to_work', label: '求职' },
  { key: 'created_at', label: '创建时间' },
]
const visibleCols = ref(['company', 'title', 'location', 'skills', 'data_source', 'status', 'rating'])

async function loadTalents() {
  loading.value = true
  try {
    const params = { page: page.value, limit: limit.value }
    // 将 filters 中非空字段加入 params
    for (const [k, v] of Object.entries(filters)) {
      if (v !== '' && v !== undefined && v !== null) params[k] = v
    }
    const res = await talentsApi.list(params)
    talents.value = res.data
    total.value = res.pagination.total
  } catch (err) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function handleRowClick(row) {
  openDetail(row)
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.name} 的信息？`, '确认', { type: 'warning' })
    await talentsApi.delete(row.id)
    ElMessage.success('删除成功')
    loadTalents()
  } catch {}
}

function sourceLabel(s) {
  const map = { linkedin: 'LinkedIn', maimai: '脉脉', github: 'GitHub', aminer: 'AMiner', wechat: '微信', arxiv: 'arXiv', patent: '专利', conference: '会议', manual: '手动', api: 'API', csv: 'CSV' }
  return map[s] || s
}
function sourceTagType(s) {
  const map = { linkedin: 'primary', maimai: 'success', github: 'warning', aminer: 'info', wechat: 'success', arxiv: 'warning', patent: 'info', conference: 'primary', manual: 'info', api: 'success', csv: 'info', google_scholar: 'warning' }
  return map[s] || 'info'
}
function statusLabel(s) {
  const map = { active: '活跃', contacted: '已联系', inactive: '不活跃', pending: '待处理' }
  return map[s] || s || '-'
}
function statusTagType(s) {
  const map = { active: 'success', contacted: 'warning', inactive: 'info', pending: 'warning' }
  return map[s] || 'info'
}
function importMethodLabel(m) {
  const map = { manual: '手动', api: 'API', csv_import: 'CSV' }
  return map[m] || m
}

onMounted(loadTalents)
</script>

<style scoped>
.search-card { border-radius: 8px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.list-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 8px; }
.col-config { padding: 12px; margin-bottom: 12px; background: #f5f7fa; border-radius: 4px; }
.talent-table { cursor: pointer; }
.advanced-search { }
</style>

<style>
/* 全局样式 - 详情对话框 */
.detail-dialog .el-dialog__body {
  padding: 0;
  max-height: 85vh;
  overflow-y: auto;
}
</style>
