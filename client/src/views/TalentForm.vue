<template>
  <div>
    <el-page-header v-if="!embedded" @back="$router.back()" :title="'返回'" />
    <el-card shadow="never" :style="embedded ? '' : 'margin-top:16px'">
      <template #header>
        <span>{{ isEdit ? '编辑人才信息' : '添加人才信息' }}</span>
      </template>
      <el-form :model="form" label-width="100px" style="max-width:800px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" required>
              <el-input v-model="form.name" placeholder="姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="form.email" placeholder="邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="电话">
              <el-input v-model="form.phone" placeholder="电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信">
              <el-input v-model="form.wechat" placeholder="微信号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公司">
              <el-input v-model="form.company" placeholder="公司" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="职位">
              <el-input v-model="form.title" placeholder="职位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地区">
              <el-input v-model="form.location" placeholder="地区" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学历">
              <el-select v-model="form.education" placeholder="学历" clearable>
                <el-option label="本科" value="本科" />
                <el-option label="硕士" value="硕士" />
                <el-option label="博士" value="博士" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经验年限">
              <el-input-number v-model="form.experience_years" :min="0" :max="50" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="技能">
          <el-input v-model="form.skills" placeholder="技能(逗号分隔)" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.tags" placeholder="标签(逗号分隔)" />
        </el-form-item>
        <el-form-item label="评分">
          <el-rate v-model="form.rating" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.summary" type="textarea" :rows="3" placeholder="简介" />
        </el-form-item>

        <el-divider content-position="left">扩展信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别">
              <el-select v-model="form.gender" placeholder="性别" clearable>
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="求职状态">
              <el-select v-model="form.open_to_work" placeholder="求职状态" clearable>
                <el-option label="在看机会" value="yes" />
                <el-option label="不在看" value="no" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="期望薪资">
              <el-input v-model="form.expected_salary" placeholder="如 70k以上/月" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="求职偏好">
              <el-input v-model="form.job_preference" placeholder="如 北京·Principal Engineer" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="适合岗位">
          <el-input v-model="form.suitable_roles" placeholder="适合岗位(逗号分隔)" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="LinkedIn">
              <el-input v-model="form.linkedin_url" placeholder="LinkedIn URL" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="脉脉">
              <el-input v-model="form.maimai_url" placeholder="脉脉 URL" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="GitHub">
              <el-input v-model="form.github_url" placeholder="GitHub URL" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="个人主页">
              <el-input v-model="form.homepage" placeholder="URL" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">数据来源与导入方式</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="数据来源">
              <el-select v-model="form.data_source" placeholder="数据来源">
                <el-option label="手动录入" value="manual" />
                <el-option label="LinkedIn" value="linkedin" />
                <el-option label="脉脉" value="maimai" />
                <el-option label="GitHub" value="github" />
                <el-option label="AMiner" value="aminer" />
                <el-option label="微信" value="wechat" />
                <el-option label="arXiv" value="arxiv" />
                <el-option label="专利" value="patent" />
                <el-option label="会议" value="conference" />
                <el-option label="CSV" value="csv" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="导入方式">
              <el-select v-model="form.import_method" placeholder="导入方式">
                <el-option label="手动录入" value="manual" />
                <el-option label="API导入" value="api" />
                <el-option label="CSV导入" value="csv_import" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">{{ isEdit ? '保存修改' : '创建' }}</el-button>
          <el-button @click="embedded ? $emit('cancel') : $router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { talentsApi } from '../api'
import { ElMessage } from 'element-plus'

const props = defineProps({
  talentId: { type: [Number, String], default: null },
  embedded: { type: Boolean, default: false }
})
const emit = defineEmits(['saved', 'cancel'])

const route = useRoute()
const router = useRouter()
const currentId = computed(() => props.talentId || route.params.id)
const isEdit = computed(() => !!currentId.value)
const submitting = ref(false)

const form = ref({
  name: '', email: '', phone: '', company: '', title: '', location: '',
  skills: '', education: '', experience_years: null, summary: '',
  data_source: 'manual', import_method: 'manual',
  tags: '', rating: 0, status: 'active',
  open_to_work: '', suitable_roles: '', homepage: '', github_url: '', google_scholar_url: '',
  gender: '', expected_salary: '', job_preference: '', wechat: '',
  linkedin_url: '', maimai_url: ''
})

onMounted(async () => {
  if (isEdit.value) {
    try {
      const res = await talentsApi.get(currentId.value)
      form.value = { ...form.value, ...res.data }
    } catch (err) {
      ElMessage.error('加载失败')
    }
  }
})

async function handleSubmit() {
  if (!form.value.name) {
    ElMessage.warning('姓名为必填项')
    return
  }
  submitting.value = true
  try {
    if (isEdit.value) {
      await talentsApi.update(currentId.value, form.value)
      ElMessage.success('更新成功')
    } else {
      await talentsApi.create(form.value)
      ElMessage.success('创建成功')
    }
    if (props.embedded) {
      emit('saved')
    } else if (isEdit.value) {
      router.push(`/talents/${currentId.value}`)
    } else {
      router.push('/talents')
    }
  } catch (err) {
    ElMessage.error(err.error || '操作失败')
  } finally {
    submitting.value = false
  }
}
</script>
