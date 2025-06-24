#!/bin/bash

echo "🚀 启动 Moments 全栈应用..."

# 检查环境变量文件
if [ ! -f .env.local ]; then
    echo "⚠️  未找到 .env.local 文件"
    echo "请复制 .env.example 到 .env.local 并配置相关环境变量："
    echo "cp .env.example .env.local"
    exit 1
fi

# 检查是否安装了依赖
if [ ! -d node_modules ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 创建上传目录
echo "📁 创建上传目录..."
mkdir -p public/uploads/images
mkdir -p public/uploads/videos

# 启动开发服务器
echo "🎯 启动开发服务器..."
echo "应用将在 http://localhost:3000 运行"
echo "API 端点可通过 http://localhost:3000/api/* 访问"
echo ""
echo "按 Ctrl+C 停止服务器"

npm run dev 