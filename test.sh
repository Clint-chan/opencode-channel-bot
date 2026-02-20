#!/bin/bash

echo "🧪 OpenCode Telegram Bot - 测试脚本"
echo "===================================="
echo ""

source .env 2>/dev/null || {
    echo "❌ 错误：找不到 .env 文件"
    echo "请先运行: cp .env.example .env"
    exit 1
}

echo "1️⃣ 测试配置..."
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN 未设置"
    exit 1
fi
echo "✅ Telegram Bot Token: ${TELEGRAM_BOT_TOKEN:0:10}..."

if [ -z "$ALLOWED_CHAT_IDS" ]; then
    echo "❌ ALLOWED_CHAT_IDS 未设置"
    exit 1
fi
echo "✅ Allowed Chat IDs: $ALLOWED_CHAT_IDS"

if [ -z "$OPENCODE_SERVER_PASSWORD" ]; then
    echo "❌ OPENCODE_SERVER_PASSWORD 未设置"
    exit 1
fi
echo "✅ OpenCode Server Password: ****"

echo ""
echo "2️⃣ 测试 Telegram Bot API..."
RESPONSE=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe")
if echo "$RESPONSE" | grep -q '"ok":true'; then
    BOT_USERNAME=$(echo "$RESPONSE" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Bot 连接成功: @$BOT_USERNAME"
else
    echo "❌ Bot Token 无效"
    echo "$RESPONSE"
    exit 1
fi

echo ""
echo "3️⃣ 测试 OpenCode Server..."
SERVER_URL=${OPENCODE_SERVER_URL:-http://127.0.0.1:4096}
AUTH_HEADER=$(echo -n "${OPENCODE_SERVER_USERNAME:-admin}:${OPENCODE_SERVER_PASSWORD}" | base64)

HEALTH_CHECK=$(curl -s -w "\n%{http_code}" -H "Authorization: Basic $AUTH_HEADER" "$SERVER_URL/health")
HTTP_CODE=$(echo "$HEALTH_CHECK" | tail -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OpenCode Server 连接成功"
else
    echo "❌ OpenCode Server 连接失败 (HTTP $HTTP_CODE)"
    echo "请确保 OpenCode Server 正在运行："
    echo "  OPENCODE_SERVER_PASSWORD=$OPENCODE_SERVER_PASSWORD opencode serve"
    exit 1
fi

echo ""
echo "4️⃣ 测试数据库..."
if [ -f "data/bot.db" ]; then
    echo "✅ 数据库文件存在"
else
    echo "⚠️  数据库文件不存在（首次运行时会自动创建）"
fi

echo ""
echo "5️⃣ 测试 Node.js 依赖..."
if [ -d "node_modules" ]; then
    echo "✅ 依赖已安装"
else
    echo "❌ 依赖未安装"
    echo "请运行: npm install"
    exit 1
fi

echo ""
echo "✅ 所有测试通过！"
echo ""
echo "🚀 启动 Bot："
echo "   npm start"
echo ""
echo "📱 在 Telegram 中测试："
echo "   1. 打开 @$BOT_USERNAME"
echo "   2. 发送 /start"
echo ""
