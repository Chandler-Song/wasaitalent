#!/bin/bash
# ============================================
# WasaiTalent 服务器端自动化部署脚本
# 从 GitHub 拉取代码，自动安装依赖，Docker 部署
# ============================================
# 使用方式:
#   chmod +x setup-deploy.sh
#   ./setup-deploy.sh
# ============================================

set -e

# ---------- 配置变量 ----------
GITHUB_REPO="https://github.com/Chandler-Song/wasaitalent.git"
DEPLOY_DIR="/opt/wasaitalent"
APP_PORT=3333
DATA_DIR="${DEPLOY_DIR}/server/data"

# ---------- 颜色输出 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "${CYAN}[STEP]${NC} $1"; }

# ============================================
# 步骤1：检查并安装 Git
# ============================================
log_step "步骤1/6：检查 Git..."

if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    log_info "${GIT_VERSION} ✓"
else
    log_warn "Git 未安装，正在安装..."
    if command -v apt-get &> /dev/null; then
        apt-get update -qq && apt-get install -y -qq git
    elif command -v yum &> /dev/null; then
        yum install -y -q git
    elif command -v dnf &> /dev/null; then
        dnf install -y -q git
    else
        log_error "无法自动安装 Git，请手动安装后重试"
        exit 1
    fi
    log_info "Git 安装完成 ✓"
fi

# ============================================
# 步骤2：检查并安装 Docker
# ============================================
log_step "步骤2/6：检查 Docker..."

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    log_info "${DOCKER_VERSION} ✓"
else
    log_warn "Docker 未安装，正在安装..."
    if command -v apt-get &> /dev/null; then
        apt-get update -qq
        apt-get install -y -qq ca-certificates curl gnupg lsb-release
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/$(. /etc/os-release && echo "$ID")/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
        chmod a+r /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$(. /etc/os-release && echo "$ID") $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
        apt-get update -qq
        apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    elif command -v yum &> /dev/null; then
        yum install -y -q yum-utils
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        yum install -y -q docker-ce docker-ce-cli containerd.io docker-compose-plugin
    else
        log_warn "尝试使用通用脚本安装 Docker..."
        curl -fsSL https://get.docker.com | sh
    fi
    systemctl enable docker
    systemctl start docker
    log_info "Docker 安装完成 ✓"
fi

# ============================================
# 步骤3：检查 Docker Compose
# ============================================
log_step "步骤3/6：检查 Docker Compose..."

if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || docker compose version)
    log_info "Docker Compose ${COMPOSE_VERSION} ✓"
else
    log_warn "Docker Compose 不可用，正在安装..."
    if command -v apt-get &> /dev/null; then
        apt-get install -y -qq docker-compose-plugin
    elif command -v yum &> /dev/null; then
        yum install -y -q docker-compose-plugin
    else
        COMPOSE_VERSION="v2.24.0"
        curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        ln -sf /usr/local/bin/docker-compose /usr/libexec/docker/cli-plugins/docker-compose 2>/dev/null || true
    fi
    log_info "Docker Compose 安装完成 ✓"
fi

# ============================================
# 步骤4：检查端口可用性
# ============================================
log_step "步骤4/6：检查端口 ${APP_PORT}..."

if ss -tlnp 2>/dev/null | grep -q ":${APP_PORT} " || \
   netstat -tlnp 2>/dev/null | grep -q ":${APP_PORT} "; then
    log_warn "端口 ${APP_PORT} 已被占用"
    EXISTING_PID=$(ss -tlnp 2>/dev/null | grep ":${APP_PORT} " | grep -oP 'pid=\K[0-9]+' | head -1)
    if [ -n "$EXISTING_PID" ]; then
        EXISTING_PROC=$(ps -p "$EXISTING_PID" -o comm= 2>/dev/null)
        log_info "占用进程: ${EXISTING_PROC} (PID: ${EXISTING_PID})"
    fi
    read -p "是否停止占用端口的进程？(y/N): " STOP_CONFIRM
    if [[ "$STOP_CONFIRM" =~ ^[Yy]$ ]]; then
        kill -9 "$EXISTING_PID" 2>/dev/null || true
        log_info "已停止占用进程"
        sleep 1
    else
        log_error "端口 ${APP_PORT} 被占用，无法继续部署"
        exit 1
    fi
fi
log_info "端口 ${APP_PORT} 可用 ✓"

# ============================================
# 步骤5：从 GitHub 获取项目代码
# ============================================
log_step "步骤5/6：获取项目代码..."

if [ -d "${DEPLOY_DIR}/.git" ]; then
    log_info "项目目录已存在，执行 git pull 更新..."
    cd "${DEPLOY_DIR}"
    git fetch origin
    git reset --hard origin/main
    log_info "代码更新完成 ✓"
else
    if [ -d "${DEPLOY_DIR}" ] && [ "$(ls -A ${DEPLOY_DIR})" ]; then
        log_warn "目录 ${DEPLOY_DIR} 存在但非 Git 仓库，备份后重新克隆..."
        mv "${DEPLOY_DIR}" "${DEPLOY_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    fi
    log_info "正在克隆仓库..."
    git clone "${GITHUB_REPO}" "${DEPLOY_DIR}"
    log_info "代码克隆完成 ✓"
fi

# ============================================
# 步骤6：Docker 构建与启动
# ============================================
log_step "步骤6/6：Docker 构建与启动..."

cd "${DEPLOY_DIR}"

# 创建数据目录并设置权限（容器内 nodejs 用户 UID 1001）
mkdir -p "${DATA_DIR}"
chown -R 1001:1001 "${DATA_DIR}"
log_info "数据目录准备完成: ${DATA_DIR}"

# 停止旧容器（如果存在）
if docker compose ps -q 2>/dev/null | grep -q .; then
    log_info "停止旧容器..."
    docker compose down
fi

# 构建镜像
log_info "正在构建 Docker 镜像（首次约 3-5 分钟）..."
docker compose build --progress=plain

# 启动服务
log_info "正在启动服务..."
docker compose up -d

# 等待服务就绪
log_info "等待服务启动..."
RETRIES=0
MAX_RETRIES=30
while [ $RETRIES -lt $MAX_RETRIES ]; do
    if curl -sf http://localhost:${APP_PORT}/api/health > /dev/null 2>&1; then
        break
    fi
    RETRIES=$((RETRIES + 1))
    sleep 2
    printf "."
done
echo ""

# ============================================
# 部署结果
# ============================================
if curl -sf http://localhost:${APP_PORT}/api/health > /dev/null 2>&1; then
    echo ""
    log_info "=========================================="
    log_info "  部署成功！"
    log_info "=========================================="
    echo ""
    SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
    log_info "访问地址: http://${SERVER_IP}:${APP_PORT}"
    log_info "健康检查: http://localhost:${APP_PORT}/api/health"
    log_info "数据目录: ${DATA_DIR}"
    echo ""
    log_info "常用命令:"
    log_info "  查看日志: cd ${DEPLOY_DIR} && docker compose logs -f"
    log_info "  重启服务: cd ${DEPLOY_DIR} && docker compose restart"
    log_info "  停止服务: cd ${DEPLOY_DIR} && docker compose down"
    log_info "  备份数据: cp ${DATA_DIR}/talents.db ./backup-\$(date +%Y%m%d).db"
    echo ""
    log_info "默认管理员账号: admin / admin123"
    log_warn "请首次登录后立即修改密码！"
    log_info "=========================================="

    # 显示容器状态
    docker compose ps
else
    echo ""
    log_error "=========================================="
    log_error "  部署可能未完全成功"
    log_error "=========================================="
    log_error "服务未在预期时间内响应"
    log_info "请检查日志: cd ${DEPLOY_DIR} && docker compose logs -f"
    log_info "容器状态:"
    docker compose ps
    exit 1
fi
