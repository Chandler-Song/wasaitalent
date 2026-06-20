#!/usr/bin/env bash
#
# WasaiTalent Python SDK 自动化发布脚本
#
# 用法:
#   bash publish.sh --version 1.0.1                  # 发布到正式 PyPI
#   bash publish.sh --version 1.0.1 --test           # 发布到测试 PyPI
#   bash publish.sh --version 1.0.1 --dry-run        # 仅构建，不上传、不打 tag
#   bash publish.sh --version 1.0.1 --skip-tests     # 跳过 pytest
#
set -euo pipefail

# ========== 颜色输出 ==========
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ========== 定位脚本所在目录（wsapi/） ==========
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ========== 解析命令行参数 ==========
VERSION=""
TEST_PYPI=false
DRY_RUN=false
SKIP_TESTS=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --version|-v)
            VERSION="$2"
            shift 2
            ;;
        --test)
            TEST_PYPI=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --help|-h)
            echo "用法: bash publish.sh --version <版本号> [选项]"
            echo ""
            echo "选项:"
            echo "  --version, -v   指定新版本号 (必填, 如 1.0.1)"
            echo "  --test          上传到测试 PyPI (test.pypi.org)"
            echo "  --dry-run       仅执行环境检查 + 版本更新 + 构建, 不上传不打 tag"
            echo "  --skip-tests    跳过 pytest 测试"
            echo "  --help, -h      显示此帮助信息"
            exit 0
            ;;
        *)
            error "未知参数: $1  (使用 --help 查看帮助)"
            ;;
    esac
done

[[ -z "$VERSION" ]] && error "必须通过 --version 指定版本号, 例如: --version 1.0.1"

# 校验版本号格式 (semver: x.y.z 或 x.y.z.pre)
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+([a-zA-Z0-9._-]*)?$'; then
    error "版本号格式不正确, 应为 x.y.z (如 1.0.1), 当前值: $VERSION"
fi

# ========== 1. 环境检查 ==========
info "========== 步骤 1/6: 环境检查 =========="

check_cmd() {
    if command -v "$1" &>/dev/null; then
        success "$1 $(command -v "$1" 2>/dev/null | head -1)"
    else
        error "未找到 $1, 请先安装: $2"
    fi
}

check_cmd python3 "https://www.python.org"
check_cmd pip     "随 python3 一起安装"

# 优先使用当前环境的 python（如 conda/venv），而非系统 python3
if command -v python &>/dev/null; then
    PYTHON=python
else
    PYTHON=python3
fi
info "使用 Python: $($PYTHON --version) ($($PYTHON -c "import sys; print(sys.executable)"))"

# 检查/自动安装 build
if ! $PYTHON -m build --version &>/dev/null 2>&1; then
    warn "build 未安装, 正在安装..."
    $PYTHON -m pip install build --quiet
fi
success "python-build $($PYTHON -m build --version 2>/dev/null | head -1)"

# 检查/自动安装 twine
if ! twine --version &>/dev/null 2>&1; then
    warn "twine 未安装, 正在安装..."
    $PYTHON -m pip install twine --quiet
fi
success "twine $(twine --version 2>/dev/null | head -1)"

# 读取当前版本
OLD_VERSION=$(sed -n 's/^version = "\(.*\)"/\1/p' pyproject.toml)
INIT_VERSION=$(sed -n 's/.*__version__ = "\(.*\)"/\1/p' __init__.py)
info "当前版本: pyproject.toml=${OLD_VERSION}  __init__.py=${INIT_VERSION}  →  目标版本: ${VERSION}"

if [[ "$OLD_VERSION" == "$VERSION" && "$INIT_VERSION" == "$VERSION" ]]; then
    error "版本号未变化 (均为 $VERSION), 无需发布"
fi

# ========== 2. 运行测试 ==========
if [[ "$SKIP_TESTS" == false && "$DRY_RUN" == false ]]; then
    info "========== 步骤 2/6: 运行测试 =========="
    $PYTHON -m pytest tests/ -v --tb=short
    success "所有测试通过"
else
    if [[ "$DRY_RUN" == true ]]; then
        info "========== 步骤 2/6: 运行测试 (dry-run 模式) =========="
        $PYTHON -m pytest tests/ -v --tb=short
        success "所有测试通过"
    else
        warn "========== 步骤 2/6: 跳过测试 (--skip-tests) =========="
    fi
fi

# ========== 3. 版本号更新 ==========
info "========== 步骤 3/6: 更新版本号 =========="

# 更新 pyproject.toml
sed -i.bak "s/^version = \"[^\"]*\"/version = \"${VERSION}\"/" pyproject.toml && rm -f pyproject.toml.bak
NEW_PY=$(sed -n 's/^version = "\(.*\)"/\1/p' pyproject.toml)
[[ "$NEW_PY" == "$VERSION" ]] && success "pyproject.toml: ${OLD_VERSION} → ${VERSION}" || error "pyproject.toml 版本更新失败"

# 更新 __init__.py
sed -i.bak "s/__version__ = \"[^\"]*\"/__version__ = \"${VERSION}\"/" __init__.py && rm -f __init__.py.bak
NEW_INIT=$(sed -n 's/.*__version__ = "\(.*\)"/\1/p' __init__.py)
[[ "$NEW_INIT" == "$VERSION" ]] && success "__init__.py:   ${INIT_VERSION} → ${VERSION}" || error "__init__.py 版本更新失败"

# ========== 4. 清理旧构建 & 构建 ==========
info "========== 步骤 4/6: 构建分发包 =========="

rm -rf dist/ build/ *.egg-info
success "已清理旧的构建产物"

$PYTHON -m build
success "构建完成"

# 列出生成的文件
info "构建产物:"
for f in dist/*; do
    SIZE=$(du -h "$f" | cut -f1)
    echo "  $(basename "$f")  ($SIZE)"
done

# ========== 5. 上传发布 ==========
if [[ "$DRY_RUN" == true ]]; then
    warn "========== 步骤 5/6: 跳过上传 (--dry-run) =========="
else
    info "========== 步骤 5/6: 上传到 PyPI =========="

    # 先校验包是否合法
    info "校验构建产物..."
    twine check dist/*
    success "构建产物校验通过"

    if [[ "$TEST_PYPI" == true ]]; then
        info "上传到 测试 PyPI (test.pypi.org)..."
        twine upload --repository testpypi dist/*
        success "已上传到测试 PyPI: https://test.pypi.org/project/wsapi/${VERSION}/"
        info "安装测试: pip install --index-url https://test.pypi.org/simple/ wsapi==${VERSION}"
    else
        info "上传到 正式 PyPI (pypi.org)..."
        twine upload dist/*
        success "已上传到 PyPI: https://pypi.org/project/wsapi/${VERSION}/"
        info "安装: pip install wsapi==${VERSION}"
    fi
fi

# ========== 6. Git 操作 ==========
if [[ "$DRY_RUN" == true ]]; then
    warn "========== 步骤 6/6: 跳过 Git 操作 (--dry-run) =========="
else
    info "========== 步骤 6/6: Git Tag & Push =========="

    # 检查 git 工作区是否干净（除了 dist/ 和 egg-info）
    DIRTY_FILES=$(git status --porcelain | grep -v -E '(dist/|egg-info|\.pytest_cache|__pycache__)' || true)
    if [[ -n "$DIRTY_FILES" ]]; then
        warn "工作区有未提交的变更:"
        echo "$DIRTY_FILES"
        info "将版本号变更提交到 Git..."
        git add pyproject.toml __init__.py
        git commit -m "chore: bump version to ${VERSION}"
        success "版本号变更已提交"
    fi

    TAG="v${VERSION}"

    # 检查 tag 是否已存在
    if git rev-parse "$TAG" &>/dev/null; then
        error "Git tag ${TAG} 已存在, 请先删除: git tag -d ${TAG}"
    fi

    git tag -a "$TAG" -m "release: wsapi v${VERSION}"
    success "已创建 tag: ${TAG}"

    git push origin HEAD
    git push origin "$TAG"
    success "已推送代码和 tag 到远程仓库"
fi

# ========== 完成 ==========
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  wsapi v${VERSION} 发布${NC}"
if [[ "$DRY_RUN" == true ]]; then
    echo -e "${YELLOW}  (dry-run 模式: 仅构建, 未上传和打 tag)${NC}"
elif [[ "$TEST_PYPI" == true ]]; then
    echo -e "${GREEN}  已上传到 测试 PyPI${NC}"
else
    echo -e "${GREEN}  已上传到 正式 PyPI${NC}"
fi
echo -e "${GREEN}============================================${NC}"
echo ""

