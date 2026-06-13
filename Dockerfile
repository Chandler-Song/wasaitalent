# ============================================
# WasaiTalent 人才管理系统 - Docker 生产镜像
# 多阶段构建：前端构建 + 后端运行
# ============================================

# ---------- 阶段1：前端构建 ----------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

# 复制前端依赖文件
COPY client/package.json client/package-lock.json* ./

# 安装前端依赖
RUN npm ci --registry=https://registry.npmmirror.com

# 复制前端源码
COPY client/ ./

# 构建前端
RUN npm run build

# ---------- 阶段2：生产运行镜像 ----------
FROM node:20-alpine AS production

# 设置工作目录
WORKDIR /app

# 安装 dumb-init 用于正确处理信号
RUN apk add --no-cache dumb-init

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 复制后端依赖文件
COPY server/package.json server/package-lock.json* ./server/

# 安装后端依赖
WORKDIR /app/server
RUN npm ci --omit=dev --registry=https://registry.npmmirror.com

# 创建数据目录
WORKDIR /app
RUN mkdir -p /app/server/data && \
    chown -R nodejs:nodejs /app

# 复制后端源码
COPY server/ ./server/

# 从前端构建阶段复制 dist
COPY --from=frontend-builder /app/client/dist ./client/dist

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3333

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3333

# 使用 dumb-init 作为 PID 1 进程
ENTRYPOINT ["dumb-init", "--"]

# 启动命令
CMD ["node", "server/index.js"]
