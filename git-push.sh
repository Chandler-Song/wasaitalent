#!/bin/bash
# =============================================================================
# Git 自动化推送脚本 (git-push.sh)
# 功能：检测变更 → 交互式提交 → 安全同步 → 推送到远程
# 兼容：macOS / Linux (Bash)
# =============================================================================

set -euo pipefail

# -------------------------- 颜色定义 --------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# -------------------------- 工具函数 --------------------------
log_info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()    { echo -e "${BLUE}[STEP]${NC} $1"; }

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 退出并提示错误
die() {
    log_error "$1"
    exit 1
}

# -------------------------- 前置检查 --------------------------
log_step "开始执行 Git 自动化推送脚本..."

# 检查是否在 Git 仓库中
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    die "当前目录不是 Git 仓库，请在项目根目录下运行此脚本"
fi

# 检查 git 命令可用性
if ! command_exists git; then
    die "未找到 git 命令，请先安装 Git"
fi

# -------------------------- 1. 检测变更状态 --------------------------
log_step "检查工作区状态..."

# 获取未暂存的变更
UNSTAGED=$(git diff --name-only 2>/dev/null || true)
# 获取已暂存但未提交的变更
STAGED=$(git diff --cached --name-only 2>/dev/null || true)
# 获取未跟踪的文件
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null || true)

if [ -z "$UNSTAGED" ] && [ -z "$STAGED" ] && [ -z "$UNTRACKED" ]; then
    log_warn "工作区干净，没有需要提交的变更"
    exit 0
fi

# 显示变更摘要
echo ""
log_info "检测到以下变更："
[ -n "$UNSTAGED" ] && echo -e "  ${YELLOW}未暂存:${NC}" && echo "$UNSTAGED" | sed 's/^/    /'
[ -n "$STAGED" ] && echo -e "  ${GREEN}已暂存:${NC}" && echo "$STAGED" | sed 's/^/    /'
[ -n "$UNTRACKED" ] && echo -e "  ${BLUE}未跟踪:${NC}" && echo "$UNTRACKED" | sed 's/^/    /'
echo ""

# -------------------------- 2. 暂存所有变更 --------------------------
log_step "暂存所有变更..."
git add -A

if [ $? -ne 0 ]; then
    die "git add 失败，请检查文件权限或磁盘空间"
fi

log_info "所有变更已暂存 ✓"

# -------------------------- 3. 交互式提交信息 --------------------------
echo ""
log_step "请输入提交信息（直接回车使用默认消息）："
read -r COMMIT_MSG

# 如果用户未输入，使用默认消息
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="chore: auto commit"
    log_warn "使用默认提交信息: $COMMIT_MSG"
fi

# -------------------------- 4. 提交变更 --------------------------
log_step "提交变更..."

git commit -m "$COMMIT_MSG"

if [ $? -ne 0 ]; then
    # 提交失败可能是因为没有实际变更（虽然前面检查过，但以防万一）
    if git diff --cached --quiet 2>/dev/null; then
        log_warn "暂存区为空，跳过提交"
    else
        die "git commit 失败，请手动检查"
    fi
else
    log_info "提交成功 ✓"
fi

# -------------------------- 5. 获取当前分支信息 --------------------------
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || die "无法获取当前分支")
log_info "当前分支: $CURRENT_BRANCH"

# 检查是否有远程追踪分支
REMOTE_BRANCH=$(git rev-parse --abbrev-ref "@{upstream}" 2>/dev/null || true)
if [ -z "$REMOTE_BRANCH" ]; then
    log_warn "当前分支没有设置上游分支，将尝试推送到 origin/$CURRENT_BRANCH"
    REMOTE_NAME="origin"
    REMOTE_REF="$CURRENT_BRANCH"
else
    REMOTE_NAME=$(echo "$REMOTE_BRANCH" | cut -d'/' -f1)
    REMOTE_REF=$(echo "$REMOTE_BRANCH" | cut -d'/' -f2-)
fi

# -------------------------- 6. 安全同步（pull --rebase） --------------------------
log_step "同步远程变更（git pull --rebase）..."

# 先 fetch 最新状态
git fetch "$REMOTE_NAME" >/dev/null 2>&1

if [ $? -ne 0 ]; then
    die "git fetch 失败，请检查网络连接或远程仓库配置"
fi

# 执行 rebase
git pull --rebase "$REMOTE_NAME" "$REMOTE_REF"

PULL_EXIT_CODE=$?

if [ $PULL_EXIT_CODE -eq 0 ]; then
    log_info "同步成功，本地已是最新 ✓"
elif [ $PULL_EXIT_CODE -eq 1 ]; then
    log_error "拉取时发生冲突，需要手动解决"
    log_error "请使用 'git status' 查看冲突文件，解决后重新运行此脚本"
    exit 1
else
    die "git pull --rebase 失败（退出码: $PULL_EXIT_CODE）"
fi

# -------------------------- 7. 推送到远程 --------------------------
log_step "推送到远程仓库..."

git push "$REMOTE_NAME" "$CURRENT_BRANCH"

if [ $? -ne 0 ]; then
    log_error "推送失败，可能原因："
    log_error "  1. 远程有新的提交（请先 pull）"
    log_error "  2. 网络问题"
    log_error "  3. 权限不足"
    log_error ""
    log_error "建议：运行 'git status' 查看详细状态"
    exit 1
fi

log_info "推送成功 ✓"

# -------------------------- 8. 完成提示 --------------------------
echo ""
log_info "=========================================="
log_info "  Git 推送完成！"
log_info "  分支: $CURRENT_BRANCH"
log_info "  提交: $COMMIT_MSG"
log_info "=========================================="
echo ""

exit 0
