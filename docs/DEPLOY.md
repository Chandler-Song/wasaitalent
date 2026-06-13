# WasaiTalent 部署文档

> **项目**：WasaiTalent 人才管理系统  
> **部署方式**：Docker 容器化部署  
> **目标服务器**：127.0.0.1 
> **服务端口**：3333  
> **访问地址**：`http://127.0.0.1:3333`

---

## 目录

1. [环境要求](#1-环境要求)
2. [部署前准备](#2-部署前准备)
3. [部署流程](#3-部署流程)
4. [Docker 配置说明](#4-docker-配置说明)
5. [部署后验证](#5-部署后验证)
6. [常见问题排查](#6-常见问题排查)
7. [回滚步骤](#7-回滚步骤)

---

## 1. 环境要求

### 1.1 服务器配置要求

| 项目 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 1 核 | 2 核+ |
| 内存 | 1 GB | 2 GB+ |
| 磁盘 | 10 GB | 20 GB+ |
| 操作系统 | Ubuntu 20.04 / CentOS 7+ | Ubuntu 22.04 LTS |
| 网络 | 开放 3333 端口 | 支持 HTTPS |

### 1.2 必需软件

| 软件 | 最低版本 | 推荐版本 | 用途 |
|------|----------|----------|------|
| Docker | 20.10+ | 24.0+ | 容器运行时 |
| Docker Compose | 2.0+ | 2.20+ | 服务编排 |
| OpenSSH | 8.0+ | 9.0+ | 远程连接 |

> **注意**：本地开发机仅需 Node.js 18+ 和 npm 9+，Docker 相关工具由部署脚本自动调用。

### 1.3 软件安装

**Ubuntu / Debian**：
```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker && sudo systemctl start docker

# Docker Compose 已内置于 Docker 20.10+
# 验证安装
docker --version
docker compose version
```

**CentOS / RHEL**：
```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker && sudo systemctl start docker

# 验证
docker --version
docker compose version
```

---

## 2. 部署前准备

### 2.1 服务器环境检查清单

```bash
# 1. 检查操作系统版本
cat /etc/os-release

# 2. 检查 Docker 是否安装
docker --version

# 3. 检查 Docker Compose 是否可用
docker compose version

# 4. 检查 Docker 服务状态
sudo systemctl status docker

# 5. 检查磁盘空间
df -h

# 6. 检查内存
free -h
```

### 2.2 端口开放确认

确保服务器防火墙已开放 **3333** 端口：

```bash
# 检查端口是否被占用
sudo ss -tlnp | grep 3333

# Ubuntu/Debian - UFW 防火墙
sudo ufw allow 3333/tcp
sudo ufw status

# CentOS - firewalld
sudo firewall-cmd --permanent --add-port=3333/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports

# 云服务器安全组
# 登录云控制台 → 安全组规则 → 添加入站规则：
#   协议：TCP
#   端口：3333
#   来源：0.0.0.0/0（或指定 IP）
```

### 2.3 RSA 密钥配置

部署脚本使用预配置的 RSA 密钥进行 SSH 连接，无需每次输入密码。

**检查本地是否已有 SSH 密钥**：
```bash
ls -la ~/.ssh/id_rsa*
```

**如没有密钥，生成一对**：
```bash
ssh-keygen -t rsa -b 4096 -C "wasaitalent-deploy"
```

**将公钥复制到服务器**：
```bash
ssh-copy-id root@<YOUR_SERVER_IP>
```

**测试免密登录**：
```bash
ssh root@<YOUR_SERVER_IP>
# 应无需密码即可登录
```

### 2.4 目标目录创建

部署脚本会自动创建目标目录，也可手动提前创建：

```bash
ssh root@<YOUR_SERVER_IP> "mkdir -p /opt/wasaitalent"
```

---

## 3. 部署流程

### 3.1 配置部署环境变量

1）复制环境变量示例文件：
```bash
cp scripts/.env.example scripts/.env
```

2）编辑 `scripts/.env`，填入实际服务器信息：
```bash
# 目标服务器 IP 地址
SERVER_IP="<YOUR_SERVER_IP>"

# SSH 登录用户名
SERVER_USER="root"

# 服务器上的部署目录
TARGET_DIR="/opt/wasaitalent"
```

> **重要**：`scripts/.env` 文件已在 `.gitignore` 中忽略，不会提交到版本库。请勿将真实 IP 和用户名提交到 Git。

### 3.2 使用部署脚本

`scripts/deploy.sh` 脚本会自动完成以下操作：
- 检查本地环境（Dockerfile、docker-compose.yml 是否存在）
- 打包项目代码（排除 node_modules、.git、dist、数据库文件等）
- 通过 SCP 传输到服务器
- 在服务器端解压并清理旧包

**执行部署脚本**：
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**预期输出**：
```
[INFO] 步骤1：检查环境...
[INFO] 环境检查通过
[INFO] 步骤2：打包项目代码...
[INFO] 打包完成: wasaitalent-20260610_220000.tar.gz (380K)
[INFO] 步骤3：确保服务器目录存在...
[INFO] 服务器目录准备就绪
[INFO] 步骤4：传输文件到服务器...
[INFO] 文件传输完成
[INFO] 步骤5：在服务器上解压文件...
[INFO] 服务器端解压完成
[INFO] 步骤6：清理本地临时文件...
[INFO] 本地临时文件已清理

[INFO] ==========================================
[INFO] 部署包准备完成！
[INFO] ==========================================
[INFO] 服务器: root@<YOUR_SERVER_IP>
[INFO] 目录: /opt/wasaitalent
[INFO]
[INFO] 后续步骤（手动执行）:
[INFO] 1. SSH 登录服务器: ssh root@<YOUR_SERVER_IP>
[INFO] 2. 进入项目目录: cd /opt/wasaitalent
[INFO] 3. 构建 Docker 镜像: docker compose build
[INFO] 4. 启动服务: docker compose up -d
[INFO] 5. 查看日志: docker compose logs -f
[INFO] ==========================================
```

### 3.3 手动 Docker 部署

脚本执行完成后，SSH 登录服务器完成 Docker 构建和启动：

```bash
# 1. SSH 登录服务器
ssh root@<YOUR_SERVER_IP>

# 2. 进入项目目录
cd /opt/wasaitalent

# 3. 验证文件完整性
ls -la Dockerfile docker-compose.yml

# 4. 构建 Docker 镜像（首次约 3-5 分钟）
docker compose build

# 5. 启动服务（后台运行）
docker compose up -d

# 6. 查看启动日志
docker compose logs -f
```

> **提示**：如果是更新部署，先执行 `docker compose down` 停止旧容器，再执行 `docker compose up -d --build`。

---

## 4. Docker 配置说明

### 4.1 Dockerfile 关键配置

项目采用**多阶段构建**，减小最终镜像体积：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 基础镜像 | `node:20-alpine` | 轻量级 Node.js 镜像 |
| 前端构建 | 阶段 1 | 安装前端依赖并执行 `npm run build` |
| 生产运行 | 阶段 2 | 仅包含后端依赖和前端构建产物 |
| EXPOSE | `3333` | 容器暴露端口 |
| ENV PORT | `3333` | 应用监听端口 |
| ENV NODE_ENV | `production` | 生产环境模式 |
| USER | `nodejs` | 非 root 用户运行，提升安全性 |
| ENTRYPOINT | `dumb-init` | 正确处理容器信号 |
| CMD | `node server/index.js` | 启动 Express 服务 |

### 4.2 docker-compose.yml 服务配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| container_name | `wasaitalent-app` | 容器名称 |
| restart | `unless-stopped` | 异常自动重启 |
| ports | `3333:3333` | 宿主机端口映射 |
| volumes | `./server/data:/app/server/data` | SQLite 宿主机绑定挂载（实时同步） |
| memory limit | `512M` | 内存上限 |
| cpu limit | `1.0` | CPU 上限 |
| memory reservation | `256M` | 内存预留 |

**环境变量**：

| 变量 | 值 | 说明 |
|------|-----|------|
| NODE_ENV | `production` | 运行环境 |
| PORT | `3333` | 服务端口 |
| JWT_SECRET | （已配置强密钥） | JWT 签名密钥 |

> **警告**：生产环境中建议通过 Docker 环境变量或 secrets 管理 JWT_SECRET，不要硬编码在 docker-compose.yml 中。

### 4.3 健康检查配置

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3333/api/health"]
  interval: 30s    # 每 30 秒检查一次
  timeout: 10s     # 超时时间
  retries: 3       # 连续失败 3 次标记为 unhealthy
  start_period: 15s  # 启动宽限期
```

### 4.4 数据库持久化（宿主机绑定挂载）

SQLite 数据库文件通过**绑定挂载（bind mount）**直接存储在宿主机目录，与容器实时同步：

| 项目 | 说明 |
|------|------|
| 挂载方式 | 绑定挂载（bind mount） |
| 宿主机路径 | `./server/data`（即 `/opt/wasaitalent/server/data`） |
| 容器内路径 | `/app/server/data` |
| 数据文件 | `talents.db` |
| 同步方式 | 实时同步，容器写入即宿主机写入 |

> **优势**：数据库文件直接存储在宿主机文件系统中，无需通过 `docker cp` 即可直接备份、复制、迁移。

**首次部署前准备**：
```bash
# 在服务器上创建数据目录并设置权限
# 容器内以 nodejs 用户（UID 1001）运行，需确保该用户可写
mkdir -p /opt/wasaitalent/server/data
chown -R 1001:1001 /opt/wasaitalent/server/data
```

**备份数据库**：
```bash
# 方式1：直接复制宿主机文件（推荐，最简单）
cp /opt/wasaitalent/server/data/talents.db ./talents-backup-$(date +%Y%m%d).db

# 方式2：停止服务后备份（确保数据完整性）
docker compose stop
cp /opt/wasaitalent/server/data/talents.db ./talents-backup-$(date +%Y%m%d).db
docker compose start
```

**恢复数据库**：
```bash
# 直接复制备份文件到宿主机数据目录
cp ./talents-backup.db /opt/wasaitalent/server/data/talents.db

# 重启服务使数据库生效
docker compose restart
```

**定时自动备份（可选）**：
```bash
# 添加 crontab 定时任务，每天凌晨 2 点自动备份
# crontab -e
0 2 * * * cp /opt/wasaitalent/server/data/talents.db /opt/wasaitalent/backups/talents-$(date +\%Y\%m\%d).db
```

---

## 5. 部署后验证

### 5.1 检查服务状态

```bash
# 查看容器状态
docker compose ps

# 预期输出：
# NAME               STATUS          PORTS
# wasaitalent-app    Up (healthy)    0.0.0.0:3333->3333/tcp
```

### 5.2 访问地址验证

在浏览器中打开：
```
http://<YOUR_SERVER_IP>:3333
```

应看到 WasaiTalent 登录页面。

**默认管理员账号**：
- 用户名：`admin`
- 密码：`admin123`

> **重要**：首次登录后请立即修改默认密码。

### 5.3 健康检查端点测试

```bash
# 健康检查
curl http://<YOUR_SERVER_IP>:3333/api/health

# 预期响应：
# {"status":"ok","timestamp":"..."}
```

### 5.4 登录接口测试

```bash
curl -X POST http://<YOUR_SERVER_IP>:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 5.5 日志查看

```bash
# 查看实时日志
docker compose logs -f

# 查看最近 100 行日志
docker compose logs --tail=100

# 查看容器资源使用
docker stats wasaitalent-app
```

---

## 6. 常见问题排查

### 6.1 SSH 连接失败

**现象**：`Permission denied (publickey)` 或连接超时

**排查步骤**：
```bash
# 1. 检查 SSH 密钥是否存在
ls -la ~/.ssh/id_rsa*

# 2. 检查密钥权限
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub

# 3. 测试 SSH 连接（详细模式）
ssh -vvv root@<YOUR_SERVER_IP>

# 4. 检查服务器 SSH 服务状态
ssh root@<YOUR_SERVER_IP> "sudo systemctl status sshd"

# 5. 确认公钥已添加到服务器
ssh root@<YOUR_SERVER_IP> "cat ~/.ssh/authorized_keys"
```

### 6.2 Docker 构建失败

**现象**：`docker compose build` 报错

**排查步骤**：
```bash
# 1. 检查 Docker 服务状态
sudo systemctl status docker

# 2. 检查磁盘空间（构建需要临时空间）
df -h

# 3. 清理 Docker 缓存
docker system prune -a

# 4. 检查网络连接（构建需下载依赖）
docker run --rm alpine ping -c 3 registry.npmmirror.com

# 5. 查看详细构建日志
docker compose build --progress=plain
```

**常见错误**：
- `npm ci` 失败：检查网络，npm 镜像源是否可达
- `COPY failed`：确认项目文件完整，Dockerfile 和 docker-compose.yml 在项目根目录

### 6.3 端口占用问题

**现象**：`Bind for 0.0.0.0:3333 failed: port is already allocated`

**解决方法**：
```bash
# 1. 查找占用端口的进程
sudo ss -tlnp | grep 3333
# 或
sudo lsof -i :3333

# 2. 停止占用端口的进程
sudo kill -9 <PID>

# 3. 或修改 docker-compose.yml 端口映射
# 例如改为 3334:3333
# ports:
#   - "3334:3333"

# 4. 重启服务
docker compose down
docker compose up -d
```

### 6.4 数据库初始化问题

**现象**：启动后无法登录或 API 返回数据库错误

**解决方法**：
```bash
# 1. 检查宿主机数据目录
ls -la /opt/wasaitalent/server/data/

# 2. 检查目录权限（容器以 UID 1001 运行）
chown -R 1001:1001 /opt/wasaitalent/server/data

# 3. 查看应用日志中的数据库错误
docker compose logs | grep -i "database\|sqlite\|error"

# 4. 如果数据库损坏，可重置（会丢失所有数据）
docker compose down
rm /opt/wasaitalent/server/data/talents.db
docker compose up -d

# 5. 从备份恢复
cp ./backup.db /opt/wasaitalent/server/data/talents.db
docker compose restart
```

### 6.5 容器无法启动

```bash
# 查看容器退出原因
docker compose ps
docker inspect wasaitalent-app --format='{{.State.ExitCode}} {{.State.Error}}'

# 查看详细日志
docker compose logs --tail=50

# 进入容器调试
docker run -it --rm wasaitalent-app sh
```

### 6.6 健康检查持续失败

```bash
# 查看健康检查状态
docker inspect wasaitalent-app --format='{{json .State.Health}}'

# 手动执行健康检查命令
docker exec wasaitalent-app wget --no-verbose --tries=1 --spider http://localhost:3333/api/health

# 检查应用端口是否正确
docker exec wasaitalent-app env | grep PORT
```

---

## 7. 回滚步骤

### 7.1 停止服务

```bash
# SSH 登录服务器
ssh root@<YOUR_SERVER_IP>

# 进入项目目录
cd /opt/wasaitalent

# 停止容器
docker compose down
```

### 7.2 清理容器和镜像

```bash
# 停止并删除容器
docker compose down

# 删除镜像
docker rmi wasaitalent-app

# 完全清理（包括数据卷，谨慎操作）
docker compose down -v
docker rmi wasaitalent-app
```

### 7.3 恢复到之前版本

```bash
# 1. 停止当前服务
docker compose down

# 2. 备份当前数据（直接复制宿主机文件）
cp /opt/wasaitalent/server/data/talents.db ./talents-backup-$(date +%Y%m%d).db

# 3. 重新部署旧版本代码（使用旧版部署包）
# 将旧版本代码解压到 /opt/wasaitalent/

# 4. 重新构建并启动
docker compose up -d --build

# 5. 验证服务正常
curl http://localhost:3333/api/health
```

### 7.4 数据恢复

```bash
# 从备份文件恢复数据库（直接复制到宿主机数据目录）
cp ./talents-backup-20260610.db /opt/wasaitalent/server/data/talents.db

# 重启服务使数据库生效
docker compose restart

# 验证数据已恢复
curl http://localhost:3333/api/health
```

---

## 附录：部署命令速查表

| 操作 | 命令 |
|------|------|
| 执行部署脚本 | `./scripts/deploy.sh` |
| SSH 登录服务器 | `ssh root@<YOUR_SERVER_IP>` |
| 构建镜像 | `docker compose build` |
| 启动服务 | `docker compose up -d` |
| 停止服务 | `docker compose down` |
| 重启服务 | `docker compose restart` |
| 查看日志 | `docker compose logs -f` |
| 查看状态 | `docker compose ps` |
| 健康检查 | `curl http://<YOUR_SERVER_IP>:3333/api/health` |
| 备份数据 | `cp /opt/wasaitalent/server/data/talents.db ./backup-$(date +%Y%m%d).db` |
| 查看资源 | `docker stats wasaitalent-app` |
| 进入容器 | `docker exec -it wasaitalent-app sh` |

---

*文档最后更新：2026年6月*
