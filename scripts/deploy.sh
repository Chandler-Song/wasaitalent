#!/bin/bash
# ============================================
# WasaiTalent 部署脚本
# 功能：打包项目代码并传输到目标服务器
# 配置：从 .env 文件读取服务器信息
# 目标目录：/opt/wasaitalent/
# ============================================

set -e  # 遇到错误立即退出

# ---------- 加载环境变量 ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "\033[0;31m[ERROR]\033[0m 环境变量文件不存在: $ENV_FILE"
    echo "请创建 .env 文件并配置 SERVER_IP 和 SERVER_USER"
    exit 1
fi

# 加载 .env 文件
source "$ENV_FILE"

# 验证必要的环境变量
if [ -z "$SERVER_IP" ]; then
    echo -e "\033[0;31m[ERROR]\033[0m SERVER_IP 未在 .env 中配置"
    exit 1
fi

if [ -z "$SERVER_USER" ]; then
    echo -e "\033[0;31m[ERROR]\033[0m SERVER_USER 未在 .env 中配置"
    exit 1
fi

# ---------- 配置变量 ----------
# TARGET_DIR 从 .env 加载，如未配置则使用默认值
TARGET_DIR="${TARGET_DIR:-/opt/wasaitalent}"
PROJECT_NAME="wasaitalent"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="${PROJECT_NAME}-${TIMESTAMP}.tar.gz"

# 项目根目录（脚本所在目录的上级）
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 排除的文件/目录
EXCLUDE_PATTERNS=(
    "--exclude=node_modules"
    "--exclude=.git"
    "--exclude=dist"
    "--exclude=server/data"
    "--exclude=*.log"
    "--exclude=.DS_Store"
    "--exclude=scripts/*.tar.gz"
)

# ---------- 颜色输出 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ---------- 步骤1：检查环境 ----------
log_info "步骤1：检查环境..."

# 检查项目根目录
if [ ! -d "$PROJECT_ROOT" ]; then
    log_error "项目根目录不存在: $PROJECT_ROOT"
    exit 1
fi

# 检查必要的文件
if [ ! -f "$PROJECT_ROOT/Dockerfile" ]; then
    log_error "Dockerfile 不存在，请确保在项目根目录"
    exit 1
fi

if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    log_error "docker-compose.yml 不存在，请确保在项目根目录"
    exit 1
fi

log_info "环境检查通过"

# ---------- 步骤2：打包项目代码 ----------
log_info "步骤2：打包项目代码..."

cd "$PROJECT_ROOT"

# 创建临时打包文件
TEMP_ARCHIVE="/tmp/${ARCHIVE_NAME}"

# 执行打包
tar -czf "$TEMP_ARCHIVE" \
    "${EXCLUDE_PATTERNS[@]}" \
    -C "$PROJECT_ROOT" .

if [ $? -ne 0 ]; then
    log_error "打包失败"
    exit 1
fi

# 显示打包结果
ARCHIVE_SIZE=$(du -h "$TEMP_ARCHIVE" | cut -f1)
log_info "打包完成: ${ARCHIVE_NAME} (${ARCHIVE_SIZE})"

# ---------- 步骤3：确保服务器目录存在 ----------
log_info "步骤3：确保服务器目录存在..."

ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${TARGET_DIR}"

if [ $? -ne 0 ]; then
    log_error "无法创建服务器目录"
    exit 1
fi

log_info "服务器目录准备就绪"

# ---------- 步骤4：传输到服务器 ----------
log_info "步骤4：传输文件到服务器..."

scp "$TEMP_ARCHIVE" "${SERVER_USER}@${SERVER_IP}:${TARGET_DIR}/"

if [ $? -ne 0 ]; then
    log_error "文件传输失败"
    rm -f "$TEMP_ARCHIVE"
    exit 1
fi

log_info "文件传输完成"

# ---------- 步骤5：在服务器上解压 ----------
log_info "步骤5：在服务器上解压文件..."

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/wasaitalent
# 解压最新的包
tar -xzf wasaitalent-*.tar.gz 2>/dev/null || tar -xzf $(ls -t wasaitalent-*.tar.gz | head -1)
# 清理旧的打包文件（保留最新的一个）
ls -t wasaitalent-*.tar.gz 2>/dev/null | tail -n +2 | xargs -r rm -f
echo "解压完成"
ls -la
ENDSSH

if [ $? -ne 0 ]; then
    log_error "服务器端解压失败"
    exit 1
fi

log_info "服务器端解压完成"

# ---------- 步骤6：清理本地临时文件 ----------
log_info "步骤6：清理本地临时文件..."

rm -f "$TEMP_ARCHIVE"

log_info "本地临时文件已清理"

# ---------- 完成 ----------
echo ""
log_info "=========================================="
log_info "部署包准备完成！"
log_info "=========================================="
log_info "服务器: ${SERVER_USER}@${SERVER_IP}"
log_info "目录: ${TARGET_DIR}"
log_info ""
log_info "后续步骤（手动执行）:"
log_info "1. SSH 登录服务器: ssh ${SERVER_USER}@${SERVER_IP}"
log_info "2. 进入项目目录: cd ${TARGET_DIR}"
log_info "3. 构建 Docker 镜像: docker compose build"
log_info "4. 启动服务: docker compose up -d"
log_info "5. 查看日志: docker compose logs -f"
log_info "=========================================="
