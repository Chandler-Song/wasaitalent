<template>
  <div :class="{ 'detail-page': !embedded }">
    <!-- 独立顶部导航栏 (仅独立模式显示) -->
    <div v-if="!embedded" class="detail-header">
      <div class="header-left">
        <el-button @click="goBack" plain size="default">
          <el-icon style="margin-right:4px"><ArrowLeft /></el-icon>
          返回列表
        </el-button>
        <span class="header-title">WasaiTalent · 人才详情</span>
      </div>
      <div class="header-right">
        <el-button type="primary" size="small" @click="openInNewTab('/talents')" plain>人才列表</el-button>
      </div>
    </div>

    <div :class="{ 'detail-body': !embedded }">

    <div v-if="loading" style="text-align:center;padding:60px 0">
      <el-icon class="is-loading" :size="32" color="#409eff"><Loading /></el-icon>
      <div style="color:#909399;margin-top:8px;font-size:13px">加载中...</div>
    </div>

    <el-row :gutter="20" style="margin-top:16px" v-if="talent && !loading">
      <!-- 基本信息 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <div style="display:flex;align-items:center;gap:12px">
                <el-avatar v-if="talent.avatar_url" :src="talent.avatar_url" :size="40" />
                <span style="font-size:18px;font-weight:600">{{ talent.name }}</span>
              </div>
              <div>
                <el-button type="primary" size="small" @click="handleEdit">编辑</el-button>
              </div>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="公司">{{ talent.company || '-' }}</el-descriptions-item>
            <el-descriptions-item label="职位">{{ talent.title || '-' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ talent.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ talent.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="微信" v-if="talent.wechat">{{ talent.wechat }}</el-descriptions-item>
            <el-descriptions-item label="地区">{{ talent.location || '-' }}</el-descriptions-item>
            <el-descriptions-item label="学历">{{ talent.education || '-' }}</el-descriptions-item>
            <el-descriptions-item label="经验年限">{{ talent.experience_years ? talent.experience_years + '年' : '-' }}</el-descriptions-item>
            <el-descriptions-item label="评分"><el-rate :model-value="talent.rating" disabled /></el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="talent.status === 'active' ? 'success' : 'info'">{{ talent.status }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="数据来源">
              <el-tag>{{ talent.data_source }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="导入方式">
              <el-tag type="info">{{ talent.import_method }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="求职状态" v-if="talent.open_to_work">
              <el-tag :type="talent.open_to_work === 'yes' ? 'success' : 'info'">{{ talent.open_to_work === 'yes' ? '在看机会' : talent.open_to_work }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="性别" v-if="talent.gender">{{ talent.gender }}</el-descriptions-item>
            <el-descriptions-item label="期望薪资" v-if="talent.expected_salary">{{ talent.expected_salary }}</el-descriptions-item>
            <el-descriptions-item label="求职偏好" v-if="talent.job_preference">{{ talent.job_preference }}</el-descriptions-item>
            <el-descriptions-item label="适合岗位" :span="2" v-if="talent.suitable_roles">
              <el-tag v-for="role in talent.suitable_roles.split(',').filter(Boolean)" :key="role" size="small" type="warning" style="margin:2px">{{ role.trim() }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="技能" :span="2">
              <el-tag v-for="skill in (talent.skills||'').split(',').filter(Boolean)" :key="skill" size="small" style="margin:2px">{{ skill.trim() }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="标签" :span="2">
              <el-tag v-for="tag in (talent.tags||'').split(',').filter(Boolean)" :key="tag" type="info" size="small" style="margin:2px">{{ tag.trim() }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="简介" :span="2">{{ talent.summary || '-' }}</el-descriptions-item>
            <el-descriptions-item label="个人链接" :span="2" v-if="talent.linkedin_url || talent.maimai_url || talent.github_url || talent.homepage">
              <a v-if="talent.linkedin_url" :href="talent.linkedin_url" target="_blank" style="margin-right:12px;color:#409eff">LinkedIn</a>
              <a v-if="talent.maimai_url" :href="talent.maimai_url" target="_blank" style="margin-right:12px;color:#409eff">脉脉</a>
              <a v-if="talent.github_url" :href="talent.github_url" target="_blank" style="margin-right:12px;color:#409eff">GitHub</a>
              <a v-if="talent.homepage" :href="talent.homepage" target="_blank" style="color:#409eff">主页</a>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 工作经历 -->
        <el-card shadow="never" style="margin-top:16px">
          <template #header>
            <div class="card-header">
              <span>工作经历 ({{ experiences.length }})</span>
              <el-button type="primary" size="small" @click="showExpDialog = true">添加</el-button>
            </div>
          </template>
          <el-timeline v-if="experiences.length > 0">
            <el-timeline-item v-for="exp in experiences" :key="exp.id" placement="top">
              <div class="exp-item">
                <div class="exp-header">
                  <span class="exp-company">{{ exp.company || '-' }}</span>
                  <span class="exp-title">{{ exp.title || '-' }}</span>
                  <el-tag v-if="exp.is_current" type="success" size="small">在职</el-tag>
                  <el-button type="primary" size="small" link @click="editExperience(exp)" style="margin-left:auto">编辑</el-button>
                  <el-button type="danger" size="small" link @click="deleteExperience(exp)">删除</el-button>
                </div>
                <div class="exp-dates">
                  {{ [exp.start_date, exp.end_date || '至今'].filter(Boolean).join(' - ') }}
                  <span v-if="calcDuration(exp.start_date, exp.end_date)" class="exp-duration">（{{ calcDuration(exp.start_date, exp.end_date) }}）</span>
                </div>
                <div v-if="exp.location" class="exp-meta">{{ exp.location }}</div>
                <div v-if="exp.description" class="exp-desc">{{ exp.description }}</div>
                <div v-if="exp.company_details" class="exp-meta">
                  <el-tag v-for="(v, k) in parseCompanyDetails(exp.company_details)" :key="k" size="small" type="info" style="margin:2px">{{ v }}</el-tag>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <div v-else class="empty-compact">暂无工作经历</div>
        </el-card>

        <!-- 教育经历 -->
        <el-card shadow="never" style="margin-top:12px">
          <template #header>
            <div class="card-header">
              <span>教育经历 ({{ educations.length }})</span>
              <el-button type="primary" size="small" @click="showEduDialog = true">添加</el-button>
            </div>
          </template>
          <el-timeline v-if="educations.length > 0">
            <el-timeline-item v-for="edu in educations" :key="edu.id" placement="top">
              <div class="edu-item">
                <div class="edu-header">
                  <span class="edu-school">{{ edu.school || '-' }}</span>
                  <el-button type="primary" size="small" link @click="editEducation(edu)" style="margin-left:auto">编辑</el-button>
                  <el-button type="danger" size="small" link @click="deleteEducation(edu)">删除</el-button>
                </div>
                <div class="edu-dates">{{ [edu.start_date, edu.end_date].filter(Boolean).join(' - ') }}</div>
                <div class="edu-meta">{{ [edu.degree, edu.field].filter(Boolean).join(' · ') }}</div>
                <div v-if="edu.location" class="edu-meta">{{ edu.location }}</div>
                <div v-if="edu.description" class="edu-desc">{{ edu.description }}</div>
                <div v-if="edu.ranking_info" class="edu-ranking">
                  <el-tag v-for="tag in parseRankingTags(edu.ranking_info)" :key="tag" size="small" type="warning" style="margin:2px">{{ tag }}</el-tag>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <div v-else class="empty-compact">暂无教育经历</div>
        </el-card>

        <!-- 论文发表 -->
        <el-card shadow="never" style="margin-top:12px">
          <template #header>
            <div class="card-header">
              <span>论文发表 ({{ papers.length }})</span>
              <el-button type="primary" size="small" @click="showPaperDialog = true">添加</el-button>
            </div>
          </template>
          <div v-for="p in papers" :key="p.id" class="paper-item">
            <div class="paper-header">
              <span class="paper-title">{{ p.title }}</span>
              <el-button type="primary" size="small" link @click="editPaper(p)" style="margin-left:auto">编辑</el-button>
              <el-button type="danger" size="small" link @click="deletePaper(p)">删除</el-button>
            </div>
            <div class="paper-meta">
              <span v-if="p.authors">{{ p.authors }}</span>
              <span v-if="p.venue"> · {{ p.venue }}</span>
              <span v-if="p.year"> · {{ p.year }}</span>
              <span v-if="p.citation_count"> · 引用{{ p.citation_count }}</span>
            </div>
            <div v-if="p.arxiv_id" class="paper-meta">
              <a :href="`https://arxiv.org/abs/${p.arxiv_id}`" target="_blank" style="color:#409eff">arXiv:{{ p.arxiv_id }}</a>
            </div>
            <div v-if="p.abstract" class="paper-abstract">{{ p.abstract.length > 200 ? p.abstract.substring(0, 200) + '...' : p.abstract }}</div>
          </div>
          <div v-if="papers.length === 0" class="empty-compact">暂无论文</div>
        </el-card>

        <!-- 专利 -->
        <el-card shadow="never" style="margin-top:12px">
          <template #header>
            <div class="card-header">
              <span>专利 ({{ patents.length }})</span>
              <el-button type="primary" size="small" @click="showPatentDialog = true">添加</el-button>
            </div>
          </template>
          <div v-for="p in patents" :key="p.id" class="patent-item">
            <div class="patent-header">
              <span class="patent-title">{{ p.title }}</span>
              <el-button type="primary" size="small" link @click="editPatent(p)" style="margin-left:auto">编辑</el-button>
              <el-button type="danger" size="small" link @click="deletePatent(p)">删除</el-button>
            </div>
            <div class="patent-meta">
              <span v-if="p.patent_number">{{ p.patent_number }}</span>
              <span v-if="p.patent_type"> · {{ p.patent_type }}</span>
              <span v-if="p.status"> · {{ p.status }}</span>
            </div>
            <div v-if="p.inventors || p.assignee" class="patent-meta">
              <span v-if="p.inventors">发明人: {{ p.inventors }}</span>
              <span v-if="p.assignee"> · 权利人: {{ p.assignee }}</span>
            </div>
          </div>
          <div v-if="patents.length === 0" class="empty-compact">暂无专利</div>
        </el-card>

        <!-- 行业会议 -->
        <el-card shadow="never" style="margin-top:12px">
          <template #header>
            <div class="card-header">
              <span>行业会议 ({{ conferences.length }})</span>
              <el-button type="primary" size="small" @click="showConferenceDialog = true">添加</el-button>
            </div>
          </template>
          <div v-for="c in conferences" :key="c.id" class="conf-item">
            <div class="conf-header">
              <span class="conf-name">{{ c.conference_name }}</span>
              <el-button type="primary" size="small" link @click="editConference(c)" style="margin-left:auto">编辑</el-button>
              <el-button type="danger" size="small" link @click="deleteConference(c)">删除</el-button>
            </div>
            <div class="conf-meta">
              <span v-if="c.role">{{ c.role }}</span>
              <span v-if="c.title"> · {{ c.title }}</span>
              <span v-if="c.year"> · {{ c.year }}</span>
              <span v-if="c.location"> · {{ c.location }}</span>
            </div>
          </div>
          <div v-if="conferences.length === 0" class="empty-compact">暂无会议记录</div>
        </el-card>

        <!-- GitHub项目 -->
        <el-card shadow="never" style="margin-top:12px">
          <template #header>
            <div class="card-header">
              <span>GitHub项目 ({{ githubRepos.length }})</span>
              <el-button type="primary" size="small" @click="showRepoDialog = true">添加</el-button>
            </div>
          </template>
          <div v-for="repo in githubRepos" :key="repo.id" class="repo-item">
            <div class="repo-header">
              <a v-if="repo.url" :href="repo.url" target="_blank" class="repo-name">{{ repo.full_name || repo.repo_name }}</a>
              <span v-else class="repo-name">{{ repo.full_name || repo.repo_name }}</span>
              <el-tag v-if="repo.language" size="small" type="info">{{ repo.language }}</el-tag>
              <el-tag v-if="repo.is_fork" size="small" type="warning">fork</el-tag>
              <el-button type="primary" size="small" link @click="editRepo(repo)" style="margin-left:auto">编辑</el-button>
              <el-button type="danger" size="small" link @click="deleteRepo(repo)">删除</el-button>
            </div>
            <div v-if="repo.description" class="repo-desc">{{ repo.description }}</div>
            <div class="repo-stats">
              <span v-if="repo.stars">⭐ {{ repo.stars }}</span>
              <span v-if="repo.forks">🍴 {{ repo.forks }}</span>
              <span v-if="repo.license">📄 {{ repo.license }}</span>
              <span v-if="repo.last_pushed_at">更新: {{ repo.last_pushed_at?.slice(0, 10) }}</span>
            </div>
          </div>
          <div v-if="githubRepos.length === 0" class="empty-compact">暂无GitHub项目</div>
        </el-card>
      </el-col>

      <!-- 右侧栏 -->
      <el-col :span="8">
        <!-- 平台档案 -->
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>平台档案 ({{ profiles.length }})</span>
              <el-button type="primary" size="small" @click="showProfileDialog = true">添加</el-button>
            </div>
          </template>
          <div v-for="p in profiles" :key="p.id" class="profile-item">
            <div class="profile-header">
              <el-tag :type="platformTagType(p.platform)" size="small" style="cursor:pointer" @click="viewProfile(p)">{{ platformLabel(p.platform) }}</el-tag>
              <span class="profile-name" style="cursor:pointer" @click="viewProfile(p)">{{ p.display_name || p.username || '-' }}</span>
              <el-button type="primary" size="small" link @click="editProfile(p)">编辑</el-button>
              <el-button type="danger" size="small" link @click="deleteProfile(p)">删除</el-button>
            </div>
            <div v-if="p.platform_url" class="profile-link">
              <a :href="p.platform_url" target="_blank">{{ p.platform_url }}</a>
            </div>
            <div v-if="p.company || p.location" class="profile-meta">{{ [p.company, p.location].filter(Boolean).join(' · ') }}</div>
            <div v-if="p.bio" class="profile-bio">{{ p.bio }}</div>
          </div>
          <div v-if="profiles.length === 0" class="empty-compact">暂无平台档案</div>
        </el-card>

        <!-- 关联人才 -->
        <el-card shadow="never" style="margin-top:16px">
          <template #header>
            <div class="card-header">
              <span>关联人才 ({{ relatedTalents.length }})</span>
              <el-button type="primary" size="small" @click="showMergeDialog = true">关联</el-button>
            </div>
          </template>
          <div v-for="rt in relatedTalents" :key="rt.id" class="related-item">
            <span class="related-name" style="cursor:pointer;color:#409eff" @click="$router.push(`/talents/${rt.id}`)">{{ rt.name }}</span>
            <span class="related-meta">{{ rt.company }} · {{ rt.title }}</span>
            <el-tag size="small">{{ rt.data_source }}</el-tag>
            <el-button type="danger" size="small" link @click="removeRelation(rt)">取消关联</el-button>
          </div>
          <el-empty v-if="relatedTalents.length === 0" description="暂无关联" :image-size="60" />
        </el-card>

        <!-- 备注 -->
        <el-card shadow="never" style="margin-top:16px">
          <template #header><span>备注</span></template>
          <div v-for="note in notes" :key="note.id" class="note-item">
            <div class="note-meta">
              <span>{{ note.username }} · {{ note.created_at }}</span>
              <span style="margin-left:auto">
                <el-button type="primary" size="small" link @click="editNote(note)">编辑</el-button>
                <el-button type="danger" size="small" link @click="deleteNote(note)">删除</el-button>
              </span>
            </div>
            <div v-if="editingNoteId === note.id">
              <el-input v-model="editingNoteContent" type="textarea" :rows="2" />
              <div style="margin-top:4px;display:flex;gap:8px">
                <el-button type="primary" size="small" @click="saveNote(note)">保存</el-button>
                <el-button size="small" @click="editingNoteId = null">取消</el-button>
              </div>
            </div>
            <div v-else class="note-content">{{ note.content }}</div>
          </div>
          <div v-if="notes.length === 0" class="empty-compact">暂无备注</div>
          <el-divider />
          <el-input v-model="newNote" type="textarea" :rows="2" placeholder="添加备注..." />
          <el-button type="primary" size="small" @click="addNote" style="margin-top:8px" :disabled="!newNote.trim()">提交</el-button>
        </el-card>

        <!-- 跟盯记录 -->
        <el-card shadow="never" style="margin-top:16px">
          <template #header>
            <div class="card-header">
              <span>跟盯记录 ({{ followups.length }})</span>
              <el-button type="primary" size="small" @click="openAddFollowup">添加跟盯</el-button>
            </div>
          </template>
          <div v-for="f in followups" :key="f.id" class="followup-item">
            <div class="followup-header">
              <el-tag :type="followupTagType(f.type)" size="small">{{ followupTypeLabel(f.type) }}</el-tag>
              <span class="followup-meta">{{ f.username }} · {{ f.created_at }}</span>
              <el-button type="primary" size="small" link @click="editFollowup(f)" style="margin-left:auto">编辑</el-button>
              <el-button type="danger" size="small" link @click="deleteFollowup(f)">删除</el-button>
            </div>
            <div class="followup-content">{{ f.content }}</div>
            <div v-if="f.next_action || f.next_date" class="followup-next">
              <el-icon><Clock /></el-icon>
              <span v-if="f.next_action">{{ f.next_action }}</span>
              <span v-if="f.next_date" style="color:#409eff">{{ f.next_date }}</span>
            </div>
          </div>
          <div v-if="followups.length === 0" class="empty-compact">暂无跟盯记录</div>
        </el-card>
      </el-col>
    </el-row>
    </div><!-- end detail-body -->

    <!-- 添加/编辑平台档案对话框 -->
    <el-dialog v-model="showProfileDialog" append-to="body" :title="profileForm.id ? '编辑平台档案' : '添加平台档案'" width="500px">
      <el-form :model="profileForm" label-width="80px">
        <el-form-item label="平台" required>
          <el-select v-model="profileForm.platform">
            <el-option label="LinkedIn" value="linkedin" />
            <el-option label="脉脉" value="maimai" />
            <el-option label="GitHub" value="github" />
            <el-option label="AMiner" value="aminer" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台URL"><el-input v-model="profileForm.platform_url" /></el-form-item>
        <el-form-item label="用户名"><el-input v-model="profileForm.username" /></el-form-item>
        <el-form-item label="显示名"><el-input v-model="profileForm.display_name" /></el-form-item>
        <el-form-item label="职位"><el-input v-model="profileForm.title" /></el-form-item>
        <el-form-item label="公司"><el-input v-model="profileForm.company" /></el-form-item>
        <el-form-item label="地区"><el-input v-model="profileForm.location" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="profileForm.email" /></el-form-item>
        <el-form-item label="简介"><el-input v-model="profileForm.bio" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showProfileDialog = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">{{ profileForm.id ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>

    <!-- 查看平台档案详情对话框 -->
    <el-dialog v-model="showProfileDetailDialog" append-to="body" :title="`${platformLabel(viewingProfile.platform)} 档案详情`" width="550px">
      <el-descriptions :column="1" border v-if="viewingProfile">
        <el-descriptions-item label="平台">{{ platformLabel(viewingProfile.platform) }}</el-descriptions-item>
        <el-descriptions-item label="显示名">{{ viewingProfile.display_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ viewingProfile.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="职位">{{ viewingProfile.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="公司">{{ viewingProfile.company || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地区">{{ viewingProfile.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ viewingProfile.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="平台URL">
          <a v-if="viewingProfile.platform_url" :href="viewingProfile.platform_url" target="_blank" style="color:#409eff">{{ viewingProfile.platform_url }}</a>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="简介">{{ viewingProfile.bio || '-' }}</el-descriptions-item>
        <el-descriptions-item label="同步时间">{{ viewingProfile.synced_at || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showProfileDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="showProfileDetailDialog = false; editProfile(viewingProfile)">编辑</el-button>
      </template>
    </el-dialog>

    <!-- 关联人才对话框 -->
    <el-dialog v-model="showMergeDialog" append-to="body" title="关联人才" width="500px">
      <el-tabs v-model="mergeTab">
        <el-tab-pane label="按名字搜索" name="search">
          <el-input v-model="mergeSearchQuery" placeholder="搜索姓名/公司..." @input="searchForMerge" clearable style="margin-bottom:12px" />
          <div v-for="t in mergeSearchResults" :key="t.id" class="merge-search-item" @click="selectMergeTarget(t)">
            <span style="font-weight:500">{{ t.name }}</span>
            <span style="font-size:12px;color:#909399;margin-left:8px">{{ t.company }} · {{ t.title }}</span>
            <el-tag size="small" style="margin-left:auto">{{ t.data_source }}</el-tag>
          </div>
          <el-empty v-if="mergeSearchQuery && mergeSearchResults.length === 0" description="未找到匹配人才" :image-size="40" />
        </el-tab-pane>
        <el-tab-pane label="按ID关联" name="id">
          <el-form label-width="80px">
            <el-form-item label="人才ID">
              <el-input-number v-model="mergeTargetId" :min="1" />
            </el-form-item>
          </el-form>
          <p style="color:#909399;font-size:12px">将ID为{{ mergeTargetId }}的人才与当前人才关联为同一人</p>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="showMergeDialog = false">取消</el-button>
        <el-button type="primary" @click="mergeTalent" :disabled="mergeTab === 'search' && !mergeTargetId">关联</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑工作经历对话框 -->
    <el-dialog v-model="showExpDialog" append-to="body" :title="expForm.id ? '编辑工作经历' : '添加工作经历'" width="500px">
      <el-form :model="expForm" label-width="80px">
        <el-form-item label="公司"><el-input v-model="expForm.company" /></el-form-item>
        <el-form-item label="职位"><el-input v-model="expForm.title" /></el-form-item>
        <el-form-item label="开始时间"><el-input v-model="expForm.start_date" placeholder="YYYY-MM" /></el-form-item>
        <el-form-item label="结束时间"><el-input v-model="expForm.end_date" placeholder="YYYY-MM 或留空表示在职" /></el-form-item>
        <el-form-item label="时长"><el-input v-model="expForm.duration" placeholder="如 2年3个月" /></el-form-item>
        <el-form-item label="工作地点"><el-input v-model="expForm.location" /></el-form-item>
        <el-form-item label="工作描述"><el-input v-model="expForm.description" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExpDialog = false">取消</el-button>
        <el-button type="primary" @click="saveExperience">{{ expForm.id ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑教育经历对话框 -->
    <el-dialog v-model="showEduDialog" append-to="body" :title="eduForm.id ? '编辑教育经历' : '添加教育经历'" width="500px">
      <el-form :model="eduForm" label-width="80px">
        <el-form-item label="学校"><el-input v-model="eduForm.school" /></el-form-item>
        <el-form-item label="学位"><el-input v-model="eduForm.degree" placeholder="硕士/本科/博士" /></el-form-item>
        <el-form-item label="专业"><el-input v-model="eduForm.field" /></el-form-item>
        <el-form-item label="时间"><el-input v-model="eduForm.dates" placeholder="如 2018 - 2023" /></el-form-item>
        <el-form-item label="学校地点"><el-input v-model="eduForm.location" /></el-form-item>
        <el-form-item label="详情描述"><el-input v-model="eduForm.description" type="textarea" :rows="2" placeholder="主修课程、研究方向等" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEduDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEducation">{{ eduForm.id ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑跟盯记录对话框 -->
    <el-dialog v-model="showFollowupDialog" append-to="body" :title="followupForm.id ? '编辑跟盯记录' : '添加跟盯记录'" width="500px">
      <el-form :model="followupForm" label-width="80px">
        <el-form-item label="类型" required>
          <el-select v-model="followupForm.type">
            <el-option label="电话沟通" value="call" />
            <el-option label="微信沟通" value="wechat" />
            <el-option label="视频沟通" value="video" />
            <el-option label="邮件联系" value="email" />
            <el-option label="面试" value="interview" />
            <el-option label="面谈" value="meeting" />
            <el-option label="备注" value="note" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="followupForm.content" type="textarea" :rows="3" placeholder="跟盯内容..." />
        </el-form-item>
        <el-form-item label="后续动作">
          <el-input v-model="followupForm.next_action" placeholder="如: 安排二面、发offer等" />
        </el-form-item>
        <el-form-item label="计划日期">
          <el-input v-model="followupForm.next_date" placeholder="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFollowupDialog = false">取消</el-button>
        <el-button type="primary" @click="saveFollowup">{{ followupForm.id ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑论文对话框 -->
    <el-dialog v-model="showPaperDialog" append-to="body" :title="paperForm.id ? '编辑论文' : '添加论文'" width="550px">
      <el-form :model="paperForm" label-width="80px">
        <el-form-item label="标题" required><el-input v-model="paperForm.title" /></el-form-item>
        <el-form-item label="作者"><el-input v-model="paperForm.authors" placeholder="逗号分隔" /></el-form-item>
        <el-form-item label="期刊/会议"><el-input v-model="paperForm.venue" /></el-form-item>
        <el-form-item label="年份"><el-input-number v-model="paperForm.year" :min="1950" :max="2030" /></el-form-item>
        <el-form-item label="arXiv ID"><el-input v-model="paperForm.arxiv_id" placeholder="如 2312.00001" /></el-form-item>
        <el-form-item label="DOI"><el-input v-model="paperForm.doi" /></el-form-item>
        <el-form-item label="PDF URL"><el-input v-model="paperForm.pdf_url" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="paperForm.categories" placeholder="逗号分隔" /></el-form-item>
        <el-form-item label="引用数"><el-input-number v-model="paperForm.citation_count" :min="0" /></el-form-item>
        <el-form-item label="摘要"><el-input v-model="paperForm.abstract" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPaperDialog = false">取消</el-button>
        <el-button type="primary" @click="savePaper">{{ paperForm.id ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑专利对话框 -->
    <el-dialog v-model="showPatentDialog" append-to="body" :title="patentForm.id ? '编辑专利' : '添加专利'" width="550px">
      <el-form :model="patentForm" label-width="80px">
        <el-form-item label="标题" required><el-input v-model="patentForm.title" /></el-form-item>
        <el-form-item label="专利号"><el-input v-model="patentForm.patent_number" /></el-form-item>
        <el-form-item label="类型"><el-input v-model="patentForm.patent_type" placeholder="发明/实用新型/外观设计" /></el-form-item>
        <el-form-item label="状态"><el-input v-model="patentForm.status" placeholder="申请中/已授权/已驳回" /></el-form-item>
        <el-form-item label="申请日期"><el-input v-model="patentForm.filing_date" placeholder="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="授权日期"><el-input v-model="patentForm.grant_date" placeholder="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="发明人"><el-input v-model="patentForm.inventors" placeholder="逗号分隔" /></el-form-item>
        <el-form-item label="权利人"><el-input v-model="patentForm.assignee" /></el-form-item>
        <el-form-item label="摘要"><el-input v-model="patentForm.abstract" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPatentDialog = false">取消</el-button>
        <el-button type="primary" @click="savePatent">{{ patentForm.id ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑会议对话框 -->
    <el-dialog v-model="showConferenceDialog" append-to="body" :title="conferenceForm.id ? '编辑会议' : '添加会议'" width="500px">
      <el-form :model="conferenceForm" label-width="80px">
        <el-form-item label="会议名称" required><el-input v-model="conferenceForm.conference_name" /></el-form-item>
        <el-form-item label="角色"><el-input v-model="conferenceForm.role" placeholder="如: Speaker/Attendee/PC Member" /></el-form-item>
        <el-form-item label="议题"><el-input v-model="conferenceForm.title" /></el-form-item>
        <el-form-item label="年份"><el-input-number v-model="conferenceForm.year" :min="1990" :max="2030" /></el-form-item>
        <el-form-item label="地点"><el-input v-model="conferenceForm.location" /></el-form-item>
        <el-form-item label="URL"><el-input v-model="conferenceForm.url" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showConferenceDialog = false">取消</el-button>
        <el-button type="primary" @click="saveConference">{{ conferenceForm.id ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑GitHub项目对话框 -->
    <el-dialog v-model="showRepoDialog" append-to="body" :title="repoForm.id ? '编辑GitHub项目' : '添加GitHub项目'" width="550px">
      <el-form :model="repoForm" label-width="80px">
        <el-form-item label="项目名" required><el-input v-model="repoForm.repo_name" placeholder="如: my-project" /></el-form-item>
        <el-form-item label="全名"><el-input v-model="repoForm.full_name" placeholder="如: user/my-project" /></el-form-item>
        <el-form-item label="URL"><el-input v-model="repoForm.url" placeholder="https://github.com/user/repo" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="repoForm.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="语言"><el-input v-model="repoForm.language" placeholder="如: Python, JavaScript" /></el-form-item>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item label="Stars"><el-input-number v-model="repoForm.stars" :min="0" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="Forks"><el-input-number v-model="repoForm.forks" :min="0" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="Issues"><el-input-number v-model="repoForm.open_issues" :min="0" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="License"><el-input v-model="repoForm.license" placeholder="如: MIT, Apache-2.0" /></el-form-item>
        <el-form-item label="Topics"><el-input v-model="repoForm.topics" placeholder="逗号分隔" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRepoDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRepo">{{ repoForm.id ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>
  </div><!-- end detail-page -->
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { talentsApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, ArrowLeft, Loading } from '@element-plus/icons-vue'

const props = defineProps({
  talentId: { type: [Number, String], default: null },
  embedded: { type: Boolean, default: false }
})
const emit = defineEmits(['edit', 'close'])

const route = useRoute()
const router = useRouter()
// talentId prop 优先，否则用 tid.value
const tid = computed(() => props.talentId || route.params.id)
const talent = ref(null)
const profiles = ref([])
const experiences = ref([])
const educations = ref([])
const notes = ref([])
const followups = ref([])
const papers = ref([])
const patents = ref([])
const conferences = ref([])
const githubRepos = ref([])
const relatedTalents = ref([])
const loading = ref(true)

function handleEdit() {
  if (props.embedded) {
    emit('edit', talent.value.id)
  } else {
    router.push(`/talents/${tid.value}/edit`)
  }
}

function goBack() {
  // 如果是由新标签页打开且无历史记录，则跳转到列表页
  if (window.history.length > 1) {
    router.push('/talents')
  } else {
    window.location.href = '/#/talents'
  }
}

function openInNewTab(path) {
  window.open(`/#${path}`, '_blank')
}
const newNote = ref('')
const editingNoteId = ref(null)
const editingNoteContent = ref('')
const showProfileDialog = ref(false)
const showProfileDetailDialog = ref(false)
const showMergeDialog = ref(false)
const showExpDialog = ref(false)
const showEduDialog = ref(false)
const showFollowupDialog = ref(false)
const showPaperDialog = ref(false)
const showPatentDialog = ref(false)
const showConferenceDialog = ref(false)
const showRepoDialog = ref(false)
const mergeTargetId = ref(1)
const mergeTab = ref('search')
const mergeSearchQuery = ref('')
const mergeSearchResults = ref([])
const viewingProfile = ref({})
const profileForm = ref({ platform: 'github', platform_url: '', username: '', display_name: '', bio: '', title: '', company: '', location: '', email: '' })
const expForm = ref({ company: '', title: '', start_date: '', end_date: '', duration: '', location: '', description: '' })
const eduForm = ref({ school: '', degree: '', field: '', dates: '', location: '', description: '' })
const followupForm = ref({ type: 'note', content: '', next_action: '', next_date: '' })
const paperForm = ref({ title: '', authors: '', abstract: '', venue: '', year: null, doi: '', arxiv_id: '', pdf_url: '', categories: '', citation_count: 0 })
const patentForm = ref({ title: '', patent_number: '', patent_type: '', status: '', filing_date: '', grant_date: '', inventors: '', assignee: '', abstract: '' })
const conferenceForm = ref({ conference_name: '', role: '', title: '', year: null, location: '', url: '' })
const repoForm = ref({ repo_name: '', full_name: '', description: '', url: '', language: '', stars: 0, forks: 0, open_issues: 0, is_fork: 0, topics: '', license: '', last_pushed_at: '' })

async function loadDetail() {
  loading.value = true
  try {
    const res = await talentsApi.get(tid.value)
    talent.value = res.data
    profiles.value = res.profiles || []
    experiences.value = res.experiences || []
    educations.value = res.educations || []
    notes.value = res.notes || []
    followups.value = res.followups || []
    papers.value = res.papers || []
    patents.value = res.patents || []
    conferences.value = res.conferences || []
    githubRepos.value = res.githubRepos || []
    relatedTalents.value = res.relatedTalents || []
  } catch (err) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function addNote() {
  try {
    const res = await talentsApi.addNote(tid.value, newNote.value)
    notes.value.unshift(res.data)
    newNote.value = ''
    ElMessage.success('备注已添加')
  } catch (err) { ElMessage.error('添加备注失败') }
}

function editNote(note) { editingNoteId.value = note.id; editingNoteContent.value = note.content }
async function saveNote(note) {
  try {
    const res = await talentsApi.updateNote(tid.value, note.id, editingNoteContent.value)
    const idx = notes.value.findIndex(x => x.id === note.id)
    if (idx !== -1) notes.value[idx] = res.data
    editingNoteId.value = null
    ElMessage.success('备注已更新')
  } catch (err) { ElMessage.error('更新备注失败') }
}
async function deleteNote(note) {
  try {
    await ElMessageBox.confirm('确定删除此备注？', '确认', { type: 'warning' })
    await talentsApi.deleteNote(tid.value, note.id)
    notes.value = notes.value.filter(x => x.id !== note.id)
    ElMessage.success('备注已删除')
  } catch (err) {
    if (err !== 'cancel' && err?.message !== 'cancel') ElMessage.error('删除备注失败')
  }
}

function viewProfile(p) {
  viewingProfile.value = { ...p }
  showProfileDetailDialog.value = true
}

function editProfile(p) {
  profileForm.value = { ...p }
  showProfileDialog.value = true
}

async function saveProfile() {
  try {
    if (profileForm.value.id) {
      const { id, talent_id, created_at, updated_at, raw_data, synced_at, ...data } = profileForm.value
      const res = await talentsApi.updateProfile(tid.value, id, data)
      const idx = profiles.value.findIndex(x => x.id === id)
      if (idx !== -1) profiles.value[idx] = res.data
      ElMessage.success('档案已更新')
    } else {
      const res = await talentsApi.addProfile(tid.value, profileForm.value)
      profiles.value.push(res.data)
      ElMessage.success('档案已添加')
    }
    showProfileDialog.value = false
    profileForm.value = { platform: 'github', platform_url: '', username: '', display_name: '', bio: '', title: '', company: '', location: '', email: '' }
  } catch (err) { ElMessage.error(profileForm.value.id ? '更新档案失败' : '添加档案失败') }
}

async function deleteProfile(p) {
  try {
    await talentsApi.deleteProfile(tid.value, p.id)
    profiles.value = profiles.value.filter(x => x.id !== p.id)
    ElMessage.success('档案已删除')
  } catch (err) { ElMessage.error('删除档案失败') }
}

async function searchForMerge() {
  if (!mergeSearchQuery.value.trim()) { mergeSearchResults.value = []; return }
  try {
    const res = await talentsApi.list({ search: mergeSearchQuery.value, limit: 10 })
    mergeSearchResults.value = res.data.filter(t => t.id !== parseInt(tid.value))
  } catch { mergeSearchResults.value = [] }
}

function selectMergeTarget(t) {
  mergeTargetId.value = t.id
  ElMessage.success(`已选择: ${t.name} (ID=${t.id})`)
}

async function mergeTalent() {
  try {
    await talentsApi.merge({ primary_talent_id: parseInt(tid.value), merged_talent_id: mergeTargetId.value })
    ElMessage.success('关联成功')
    showMergeDialog.value = false
    mergeSearchQuery.value = ''
    mergeSearchResults.value = []
    loadDetail()
  } catch (err) { ElMessage.error(err.error || '关联失败') }
}

async function removeRelation(rt) {
  try {
    await ElMessageBox.confirm(`确定取消与 ${rt.name} 的关联？`, '确认', { type: 'warning' })
    await talentsApi.unmerge({ primary_talent_id: parseInt(tid.value), merged_talent_id: rt.id })
    relatedTalents.value = (relatedTalents.value || []).filter(x => x.id !== rt.id)
    ElMessage.success('已取消关联')
  } catch (err) {
    const isCancel = err === 'cancel' || err?.message === 'cancel' || err?.action === 'cancel'
    if (!isCancel) ElMessage.error(err?.error || err?.message || '取消关联失败')
  }
}

function platformLabel(p) {
  const map = { linkedin: 'LinkedIn', maimai: '脉脉', github: 'GitHub', aminer: 'AMiner', wechat: '微信', arxiv: 'arXiv', patent: '专利', conference: '会议' }
  return map[p] || p
}
function platformTagType(p) {
  const map = { linkedin: 'primary', maimai: 'success', github: 'warning', aminer: 'info', wechat: 'success', arxiv: 'warning', patent: 'info', conference: 'primary', google_scholar: 'warning' }
  return map[p] || 'info'
}

function calcDuration(start, end) {
  if (!start) return ''
  const s = new Date(start)
  const e = end ? new Date(end) : new Date()
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return ''
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  if (months < 0) return ''
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y > 0 && m > 0) return `${y}年${m}个月`
  if (y > 0) return `${y}年`
  if (m > 0) return `${m}个月`
  return '不到1个月'
}

function parseJsonArray(str) {
  try { return JSON.parse(str) } catch { return [] }
}

function parseCompanyDetails(str) {
  try { return JSON.parse(str) } catch { return {} }
}

function parseRankingTags(str) {
  try {
    const info = JSON.parse(str)
    return info.tags || []
  } catch { return [] }
}

function editExperience(exp) {
  expForm.value = { ...exp }
  showExpDialog.value = true
}

async function saveExperience() {
  try {
    if (expForm.value.id) {
      const { id, ...data } = expForm.value
      await talentsApi.updateExperience(tid.value, id, data)
      ElMessage.success('工作经历已更新')
    } else {
      await talentsApi.addExperience(tid.value, { ...expForm.value, data_source: 'manual' })
      ElMessage.success('工作经历已添加')
    }
    showExpDialog.value = false
    expForm.value = { company: '', title: '', start_date: '', end_date: '', duration: '', location: '', description: '' }
    loadDetail()
  } catch (err) {
    ElMessage.error(expForm.value.id ? '更新工作经历失败' : '添加工作经历失败')
  }
}

async function deleteExperience(exp) {
  try {
    await talentsApi.deleteExperience(tid.value, exp.id)
    experiences.value = experiences.value.filter(x => x.id !== exp.id)
    ElMessage.success('工作经历已删除')
  } catch (err) { ElMessage.error('删除工作经历失败') }
}

function editEducation(edu) {
  eduForm.value = { ...edu }
  showEduDialog.value = true
}

async function saveEducation() {
  try {
    if (eduForm.value.id) {
      const { id, ...data } = eduForm.value
      await talentsApi.updateEducation(tid.value, id, data)
      ElMessage.success('教育经历已更新')
    } else {
      await talentsApi.addEducation(tid.value, { ...eduForm.value, data_source: 'manual' })
      ElMessage.success('教育经历已添加')
    }
    showEduDialog.value = false
    eduForm.value = { school: '', degree: '', field: '', dates: '', location: '', description: '' }
    loadDetail()
  } catch (err) {
    ElMessage.error(eduForm.value.id ? '更新教育经历失败' : '添加教育经历失败')
  }
}

async function deleteEducation(edu) {
  try {
    await talentsApi.deleteEducation(tid.value, edu.id)
    educations.value = educations.value.filter(x => x.id !== edu.id)
    ElMessage.success('教育经历已删除')
  } catch (err) { ElMessage.error('删除教育经历失败') }
}

function followupTypeLabel(t) {
  const map = { call: '电话沟通', wechat: '微信沟通', video: '视频沟通', email: '邮件联系', interview: '面试', meeting: '面谈', note: '备注', other: '其他' }
  return map[t] || t
}

function followupTagType(t) {
  const map = { call: 'primary', wechat: 'success', video: 'warning', email: 'info', interview: 'warning', meeting: 'success', note: 'info', other: 'info' }
  return map[t] || 'info'
}

function openAddFollowup() {
  followupForm.value = { type: 'note', content: '', next_action: '', next_date: '' }
  showFollowupDialog.value = true
}

function editFollowup(f) {
  followupForm.value = { ...f }
  showFollowupDialog.value = true
}

async function saveFollowup() {
  try {
    if (followupForm.value.id) {
      const { id, ...data } = followupForm.value
      const res = await talentsApi.updateFollowup(tid.value, id, data)
      const idx = followups.value.findIndex(x => x.id === id)
      if (idx !== -1) followups.value[idx] = res.data
      ElMessage.success('跟盯记录已更新')
    } else {
      const res = await talentsApi.addFollowup(tid.value, followupForm.value)
      followups.value.unshift(res.data)
      ElMessage.success('跟盯记录已添加')
    }
    showFollowupDialog.value = false
    followupForm.value = { type: 'note', content: '', next_action: '', next_date: '' }
  } catch (err) { ElMessage.error(followupForm.value.id ? '更新跟盯记录失败' : '添加跟盯记录失败') }
}

async function deleteFollowup(f) {
  try {
    await talentsApi.deleteFollowup(tid.value, f.id)
    followups.value = followups.value.filter(x => x.id !== f.id)
    ElMessage.success('跟盯记录已删除')
  } catch (err) { ElMessage.error('删除跟盯记录失败') }
}

// ========== 论文 ==========
function editPaper(p) { paperForm.value = { ...p }; showPaperDialog.value = true }
async function savePaper() {
  try {
    if (paperForm.value.id) {
      const { id, ...data } = paperForm.value
      const res = await talentsApi.updatePaper(tid.value, id, data)
      const idx = papers.value.findIndex(x => x.id === id)
      if (idx !== -1) papers.value[idx] = res.data
      ElMessage.success('论文已更新')
    } else {
      const res = await talentsApi.addPaper(tid.value, { ...paperForm.value, data_source: 'manual' })
      papers.value.unshift(res.data)
      ElMessage.success('论文已添加')
    }
    showPaperDialog.value = false
    paperForm.value = { title: '', authors: '', abstract: '', venue: '', year: null, doi: '', arxiv_id: '', pdf_url: '', categories: '', citation_count: 0 }
  } catch (err) { ElMessage.error(paperForm.value.id ? '更新论文失败' : '添加论文失败') }
}
async function deletePaper(p) {
  try { await talentsApi.deletePaper(tid.value, p.id); papers.value = papers.value.filter(x => x.id !== p.id); ElMessage.success('论文已删除') }
  catch (err) { ElMessage.error('删除论文失败') }
}

// ========== 专利 ==========
function editPatent(p) { patentForm.value = { ...p }; showPatentDialog.value = true }
async function savePatent() {
  try {
    if (patentForm.value.id) {
      const { id, ...data } = patentForm.value
      const res = await talentsApi.updatePatent(tid.value, id, data)
      const idx = patents.value.findIndex(x => x.id === id)
      if (idx !== -1) patents.value[idx] = res.data
      ElMessage.success('专利已更新')
    } else {
      const res = await talentsApi.addPatent(tid.value, { ...patentForm.value, data_source: 'manual' })
      patents.value.unshift(res.data)
      ElMessage.success('专利已添加')
    }
    showPatentDialog.value = false
    patentForm.value = { title: '', patent_number: '', patent_type: '', status: '', filing_date: '', grant_date: '', inventors: '', assignee: '', abstract: '' }
  } catch (err) { ElMessage.error(patentForm.value.id ? '更新专利失败' : '添加专利失败') }
}
async function deletePatent(p) {
  try { await talentsApi.deletePatent(tid.value, p.id); patents.value = patents.value.filter(x => x.id !== p.id); ElMessage.success('专利已删除') }
  catch (err) { ElMessage.error('删除专利失败') }
}

// ========== 会议 ==========
function editConference(c) { conferenceForm.value = { ...c }; showConferenceDialog.value = true }
async function saveConference() {
  try {
    if (conferenceForm.value.id) {
      const { id, ...data } = conferenceForm.value
      const res = await talentsApi.updateConference(tid.value, id, data)
      const idx = conferences.value.findIndex(x => x.id === id)
      if (idx !== -1) conferences.value[idx] = res.data
      ElMessage.success('会议已更新')
    } else {
      const res = await talentsApi.addConference(tid.value, { ...conferenceForm.value, data_source: 'manual' })
      conferences.value.unshift(res.data)
      ElMessage.success('会议已添加')
    }
    showConferenceDialog.value = false
    conferenceForm.value = { conference_name: '', role: '', title: '', year: null, location: '', url: '' }
  } catch (err) { ElMessage.error(conferenceForm.value.id ? '更新会议失败' : '添加会议失败') }
}
async function deleteConference(c) {
  try { await talentsApi.deleteConference(tid.value, c.id); conferences.value = conferences.value.filter(x => x.id !== c.id); ElMessage.success('会议已删除') }
  catch (err) { ElMessage.error('删除会议失败') }
}

// ========== GitHub项目 ==========
function editRepo(r) { repoForm.value = { ...r }; showRepoDialog.value = true }
async function saveRepo() {
  try {
    if (repoForm.value.id) {
      const { id, ...data } = repoForm.value
      const res = await talentsApi.updateRepo(tid.value, id, data)
      const idx = githubRepos.value.findIndex(x => x.id === id)
      if (idx !== -1) githubRepos.value[idx] = res.data
      ElMessage.success('GitHub项目已更新')
    } else {
      const res = await talentsApi.addRepo(tid.value, { ...repoForm.value, data_source: 'github' })
      githubRepos.value.unshift(res.data)
      ElMessage.success('GitHub项目已添加')
    }
    showRepoDialog.value = false
    repoForm.value = { repo_name: '', full_name: '', description: '', url: '', language: '', stars: 0, forks: 0, open_issues: 0, is_fork: 0, topics: '', license: '', last_pushed_at: '' }
  } catch (err) { ElMessage.error(repoForm.value.id ? '更新GitHub项目失败' : '添加GitHub项目失败') }
}
async function deleteRepo(r) {
  try { await talentsApi.deleteRepo(tid.value, r.id); githubRepos.value = githubRepos.value.filter(x => x.id !== r.id); ElMessage.success('GitHub项目已删除') }
  catch (err) { ElMessage.error('删除GitHub项目失败') }
}

onMounted(loadDetail)
// 嵌入模式下，talentId 变化时重新加载
watch(() => props.talentId, (newVal) => { if (newVal) loadDetail() })
</script>

<style scoped>
.detail-page { min-height: 100vh; background: #f5f7fa; }
.detail-header {
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-left { display: flex; align-items: center; gap: 16px; }
.header-title { font-size: 15px; color: #606266; font-weight: 500; }
.header-right { display: flex; align-items: center; gap: 8px; }
.detail-body { padding: 20px 24px; }
.page-header { margin-bottom: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.empty-compact {
  text-align: center;
  color: #c0c4cc;
  font-size: 13px;
  padding: 12px 0;
  line-height: 1.4;
}
.profile-item { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
.profile-item:last-child { border-bottom: none; }
.profile-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.profile-name { font-weight: 500; }
.profile-link a { color: #409eff; text-decoration: none; font-size: 12px; }
.profile-meta { font-size: 12px; color: #909399; }
.profile-bio { font-size: 13px; color: #606266; margin-top: 4px; }
.related-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 4px 0; }
.related-item:hover { background: #f5f7fa; }
.related-name { font-weight: 500; }
.related-meta { font-size: 12px; color: #909399; flex: 1; }
.merge-search-item { display: flex; align-items: center; gap: 8px; padding: 8px; cursor: pointer; border-radius: 4px; }
.merge-search-item:hover { background: #f5f7fa; }
.note-item { margin-bottom: 12px; }
.note-meta { font-size: 12px; color: #909399; display: flex; align-items: center; }
.note-content { font-size: 14px; margin-top: 4px; }
.exp-item { }
.exp-header { display: flex; align-items: center; gap: 8px; }
.exp-company { font-weight: 600; font-size: 15px; }
.exp-title { color: #606266; }
.exp-meta { font-size: 12px; color: #909399; margin-top: 4px; }
.exp-dates { font-size: 13px; color: #606266; margin-top: 2px; }
.exp-duration { color: #909399; font-size: 12px; }
.exp-desc { font-size: 13px; color: #606266; margin-top: 4px; }
.exp-detail { font-size: 12px; color: #606266; margin-top: 2px; }
.edu-item { }
.edu-header { display: flex; align-items: center; gap: 8px; }
.edu-school { font-weight: 600; font-size: 15px; }
.edu-meta { font-size: 12px; color: #909399; margin-top: 4px; }
.edu-dates { font-size: 13px; color: #606266; margin-top: 2px; }
.edu-desc { font-size: 13px; color: #606266; margin-top: 4px; }
.edu-ranking { margin-top: 4px; }
.followup-item { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
.followup-item:last-child { border-bottom: none; }
.followup-header { display: flex; align-items: center; gap: 8px; }
.followup-meta { font-size: 12px; color: #909399; }
.followup-content { font-size: 14px; margin-top: 4px; }
.followup-next { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #606266; margin-top: 4px; padding: 4px 8px; background: #f5f7fa; border-radius: 4px; }
.paper-item { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
.paper-item:last-child { border-bottom: none; }
.paper-header { display: flex; align-items: flex-start; gap: 8px; }
.paper-title { font-weight: 600; font-size: 14px; flex: 1; }
.paper-meta { font-size: 12px; color: #909399; margin-top: 4px; }
.paper-abstract { font-size: 12px; color: #606266; margin-top: 4px; }
.patent-item { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
.patent-item:last-child { border-bottom: none; }
.patent-header { display: flex; align-items: flex-start; gap: 8px; }
.patent-title { font-weight: 600; font-size: 14px; flex: 1; }
.patent-meta { font-size: 12px; color: #909399; margin-top: 4px; }
.conf-item { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
.conf-item:last-child { border-bottom: none; }
.conf-header { display: flex; align-items: flex-start; gap: 8px; }
.conf-name { font-weight: 600; font-size: 14px; flex: 1; }
.conf-meta { font-size: 12px; color: #909399; margin-top: 4px; }
.repo-item { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
.repo-item:last-child { border-bottom: none; }
.repo-header { display: flex; align-items: center; gap: 8px; }
.repo-name { font-weight: 600; font-size: 14px; color: #409eff; text-decoration: none; }
.repo-name:hover { text-decoration: underline; }
.repo-desc { font-size: 12px; color: #606266; margin-top: 4px; }
.repo-stats { font-size: 12px; color: #909399; margin-top: 4px; display: flex; gap: 12px; }
</style>
