/*
 * 考研备考管理系统 - 配置文件
 * ------------------------------------------------------------
 * 云端同步凭据填写处：
 *   把你的 Supabase 项目 URL 和 anon key 填到下面。
 *   获取方式：Supabase 后台 → Settings → API
 *   填好后，APP 会自动启用云端同步；留空则纯本地运行。
 */
window.APP_CONFIG = {
  // 留空字符串 "" 表示不使用云端，纯本地 IndexedDB 存储
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // 考研初试日期（用于倒计时）。请改成你的目标考试日期。
  EXAM_DATE: "2026-12-26",

  // 本地数据版本，结构变更时 +1
  SCHEMA_VERSION: 1,
};
