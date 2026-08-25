# 考研管家 · 安卓安装包

Android 设备用户，按以下任一方式安装「考研管家」。

## 方式一：浏览器一键安装（推荐，30 秒）

适用于 Android 5.0+ 且 Chrome 76+ / Edge / 华为浏览器。

1. 用浏览器打开本目录下的 `启动.html`
2. 点击页面上的 **「🚀 立即打开考研管家」** 进入 App
3. 浏览器自动弹出 **「安装应用」** 提示（或菜单 → 安装应用 / 添加到主屏幕）
4. 点 **「安装」**，几秒完成
5. 桌面出现 📚 考研管家 图标，全屏打开、完全离线可用

## 方式二：Bubblewrap 一键打包 APK

如需独立 `.apk` 安装包分发到应用商店 / 任意设备：

**环境要求：** Node.js 18+、JDK 17、Android SDK 命令行工具

```bash
# 1. 安装 Bubblewrap CLI
npm i -g @bubblewrap/cli

# 2. 在 PWA 已部署到 HTTPS 域名后：
bubblewrap init --manifest https://你的域名/app/manifest.webmanifest
bubblewrap build
# 生成的 app-release-bundle.apk 即可分发
```

**注意：** Bubblewrap 生成的 APK 体积约 1-2 MB，运行时仍会从线上 PWA 加载。如需完全离线 APK（5 MB 左右），请用方式三。

## 方式三：Android Studio WebView 工程（完全离线 APK）

1. 安装 [Android Studio](https://developer.android.com/studio)
2. 新建空项目，Min SDK 21
3. 把 `../app/` 整个目录复制到 `app/src/main/assets/`
4. `MainActivity.java`：
   ```java
   WebView wv = new WebView(this);
   wv.getSettings().setJavaScriptEnabled(true);
   wv.getSettings().setDomStorageEnabled(true);
   wv.getSettings().setAllowFileAccessFromFileURLs(true);
   wv.loadUrl("file:///android_asset/index.html");
   setContentView(wv);
   ```
5. 菜单 `Build → Build Bundle(s) / APK(s) → Build APK(s)`
6. 约 5-10 MB 的独立 APK，**完全离线、无需联网**

本项目所有依赖已本地化（pdf.js 在 `app/vendor/`），不会触发任何外部网络请求。

## 特性

- ✅ 离线可用：Service Worker 缓存（方式一）/ 完全本地（方式二三）
- ✅ 数据本地存储 + 可选 Supabase 云端同步
- ✅ 适配手机/平板横竖屏

## 文件说明

| 文件 | 用途 |
| --- | --- |
| `启动.html` | 安卓安装引导页（打开它开始安装） |
| `README.md` | 本说明文件 |
| `打包APK.bat` | Windows 一键提示脚本（引导安装环境） |
| `打包APK.sh` | macOS / Linux 一键提示脚本 |

App 本体位于上级目录的 `app/`，三端共享同一份代码。
