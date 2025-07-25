# Moments - 私人朋友圈
基于notion创建独属于自己的朋友圈，记录所思所想

**本仓库所有代码使用Cursor生成**

## ✨ 特性

- **全栈架构**：基于 Next.js 13+ App Router，前后端统一
- **Notion 集成**：使用 Notion 作为数据库存储
- **文件上传**：支持图片和视频文件上传
- **状态管理**：支持闪念、待办、进行中、已完成等状态
- **响应式设计**：适配桌面端和移动端

## 🚢 部署
### 1. notion 配置

1. **创建 Notion Integration**
   - 访问 https://www.notion.so/my-integrations
   - 点击 "New integration"
   - 填写名称和选择 workspace
   - 复制 Internal Integration Token

2. **创建数据库**
   - 在 Notion 中创建一个新的数据库
   - 添加以下属性：
     - Title (标题) - Title 类型
     - Content (内容) - Text 类型  
     - Tags (标签) - Multi-select 类型
     - Status (状态) - Select 类型
     - Images (图片) - Files & media 类型
     - Videos (视频) - Files & media 类型
     - Created (创建时间) - Created time 类型
     - Favorited（收藏）- 复选框类型

3. **共享数据库**
   - 点击数据库右上角的 "Share"
   - 邀请您的 integration，给予 "Edit" 权限
   - 复制数据库 ID（URL 中的 32 位字符串）


### 2. 环境变量配置

首先，复制环境变量模板并填入您的配置：

```bash
cp env.template .env
```

编辑 `.env` 文件，填入必要的配置：

```bash
# 必填项
NOTION_API_KEY=your_notion_api_key_here
NOTION_DATABASE_ID=your_notion_database_id_here
AUTH_PASSWORD=your_secure_password_here
JWT_SECRET=your_long_random_jwt_secret

# 可选项（如需要覆盖默认值）
PORT=3000
MAX_FILE_SIZE=10485760
```

### 3. 使用 Docker Compose 部署（推荐）

```bash

# 4. 拉取镜像并启动服务
docker-compose up -d

# 5. 查看日志
docker-compose logs -f

# 6. 停止服务
docker-compose down
```

### 4. 使用 Docker 命令部署

```bash
# 拉取镜像
docker pull liangyanjun/moments:latest

# 运行容器
docker run -d \
  --name moments \
  -p 3000:3000 \
  -e NOTION_API_KEY=your_notion_api_key_here \
  -e NOTION_DATABASE_ID=your_notion_database_id_here \
  -e AUTH_PASSWORD=your_secure_password_here \
  -e JWT_SECRET=your_long_random_jwt_secret \
  -e SESSION_EXPIRE_HOURS=24 \
  -v $(pwd)/uploads:/app/public/uploads \
  liangyanjun/moments:latest
```

## 环境变量说明

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `NOTION_API_KEY` | ✅ | - | Notion API 密钥 |
| `NOTION_DATABASE_ID` | ✅ | - | Notion 数据库 ID |
| `AUTH_PASSWORD` | ✅ | - | 访问密码 |
| `JWT_SECRET` | ✅ | - | JWT 签名密钥（建议设置强密钥） |
| `SESSION_EXPIRE_HOURS` | ✅ | `24` | 会话过期时间（小时） |
| `PORT` | ❌ | `3000` | 应用端口 |
| `UPLOAD_DIR` | ❌ | `./public/uploads` | 文件上传目录 |
| `MAX_FILE_SIZE` | ❌ | `10485760` | 最大文件大小（字节） |
| `ALLOWED_IMAGE_EXTENSIONS` | ❌ | `jpg,jpeg,png,gif,webp` | 允许的图片格式 |
| `ALLOWED_VIDEO_EXTENSIONS` | ❌ | `mp4,mov,avi,mkv` | 允许的视频格式 |
| `UPLOAD_TO_NOTION` | ❌ | `false` | 是否上传文件到 Notion |


## 🚀 开发环境

### 环境要求

- Node.js 18+ 
- npm 或 yarn
- Notion 账户和 API 密钥

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd moments
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp env.example .env.local
   ```
   
   编辑 `.env.local` 文件，填入以下配置：
   ```
   NOTION_API_KEY=your_notion_api_key_here
   NOTION_DATABASE_ID=your_notion_database_id_here
   AUTH_PASSWORD=your_secure_password_here
   JWT_SECRET=your_long_random_jwt_secret
   ```

4. **启动应用**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```
   
   或者直接使用 npm：
   ```bash
   npm run dev
   ```

5. **访问应用**
   - 前端界面：http://localhost:3000
   - API 文档：http://localhost:3000/api/*
   - 健康检查：http://localhost:3000/api/health
