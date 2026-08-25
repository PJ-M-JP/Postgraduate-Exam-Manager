@echo off
chcp 65001 >nul
echo ========================================
echo   考研管家 · 安卓 APK 一键打包助手
echo ========================================
echo.

REM --- 检测 Node.js ---
where node >nul 2>&1
if %errorlevel%==0 (
  for /f "tokens=*" %%v in ('node -v') do echo [√] 检测到 Node.js: %%v
) else (
  echo [×] 未检测到 Node.js
  echo     请先安装: https://nodejs.org/  (推荐 LTS 18+)
  echo.
)

REM --- 检测 Java ---
where java >nul 2>&1
if %errorlevel%==0 (
  for /f "tokens=*" %%v in ('java -version 2^>^&1') do echo [√] 检测到 Java: %%v
) else (
  echo [×] 未检测到 Java JDK
  echo     请安装 JDK 17: https://adoptium.net/
  echo.
)

REM --- 检测 Android SDK ---
if defined ANDROID_HOME (
  echo [√] 检测到 ANDROID_HOME: %ANDROID_HOME%
) else (
  echo [×] 未检测到 ANDROID_HOME
  echo     请安装 Android Studio 或命令行工具:
  echo     https://developer.android.com/studio
  echo     安装后设置环境变量 ANDROID_HOME 指向 sdk 目录
  echo.
)

echo.
echo ========================================
echo   环境检测完毕
echo ========================================
echo.
echo 接下来请根据上方提示补齐依赖，然后选择打包方式：
echo.
echo [1] 用 Bubblewrap 快速生成 APK（推荐）
echo     命令: npx @bubblewrap/cli init --manifest ..\app\manifest.webmanifest
echo           npx @bubblewrap/cli build
echo.
echo [2] 用 Android Studio 生成完全离线 APK
echo     打开 Android Studio - New Project - 把 ..\app\ 复制到 assets\
echo     MainActivity 加载 file:///android_asset/index.html
echo.
echo [3] 仅本机浏览器一键安装（无需打包，30 秒搞定）
echo     打开 启动.html，按说明在 Chrome 中安装为 PWA
echo.
pause
