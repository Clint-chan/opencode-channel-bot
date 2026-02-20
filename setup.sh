#!/bin/bash

echo "🚀 OpenCode Telegram Bot 快速部署脚本"
echo "========================================"
echo ""

if [ ! -f .env ]; then
    echo "📝 创建 .env 配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件，填入你的配置："
    echo "   - TELEGRAM_BOT_TOKEN"
    echo "   - ALLOWED_CHAT_IDS"
    echo "   - OPENCODE_SERVER_PASSWORD"
    echo ""
    read -p "按回车键继续编辑 .env 文件..." 
    ${EDITOR:-nano} .env
fi

echo ""
echo "📦 安装依赖..."
npm install

echo ""
echo "📁 创建数据目录..."
mkdir -p data projects

echo ""
echo "✅ 部署完成！"
echo ""
echo "📖 下一步："
echo "1. 启动 OpenCode Server："
echo "   cd /path/to/your/project"
echo "   OPENCODE_SERVER_PASSWORD=your_password opencode serve"
echo ""
echo "2. 启动 Telegram Bot："
echo "   npm start"
echo ""
echo "或使用 Docker Compose："
echo "   docker-compose up -d"
echo ""
