#!/usr/bin/env bash
# 考研管家 · 安卓 APK 一键打包助手 (macOS / Linux)
echo "========================================"
echo "  考研管家 · 安卓 APK 一键打包助手"
echo "========================================"
echo

# Node.js
if command -v node >/dev/null 2>&1; then
  echo "[√] 检测到 Node.js: $(node -v)"
else
  echo "[×] 未检测到 Node.js"
  echo "    请先安装: https://nodejs.org/  (推荐 LTS 18+)"
  echo
fi

# Java
if command -v java >/dev/null 2>&1; then
  echo "[√] 检测到 Java: $(java -version 2>&1 | head -1)"
else
  echo "[×] 未检测到 Java JDK"
  echo "    macOS:  brew install openjdk@17"
  echo "    Ubuntu: sudo apt install openjdk-17-jdk"
  echo
fi

# Android SDK
if [ -n "$ANDROID_HOME" ]; then
  echo "[√] 检测到 ANDROID_HOME: $ANDROID_HOME"
else
  echo "[×] 未检测到 ANDROID_HOME"
  echo "    安装 Android Studio: https://developer.android.com/studio"
  echo "    或命令行工具后 export ANDROID_HOME=~/Library/Android/sdk"
  echo
fi

echo
echo "========================================"
echo "  环境检测完毕"
echo "========================================"
echo
echo "接下来请根据上方提示补齐依赖，然后选择打包方式："
echo
echo "[1] 用 Bubblewrap 快速生成 APK（推荐）"
echo "    npx @bubblewrap/cli init --manifest ../app/manifest.webmanifest"
echo "    npx @bubblewrap/cli build"
echo
echo "[2] 用 Android Studio 生成完全离线 APK"
echo "    打开 Android Studio - New Project - 把 ../app/ 复制到 assets/"
echo "    MainActivity 加载 file:///android_asset/index.html"
echo
echo "[3] 仅本机浏览器一键安装（无需打包，30 秒搞定）"
echo "    打开 启动.html，按说明在 Chrome 中安装为 PWA"
echo
