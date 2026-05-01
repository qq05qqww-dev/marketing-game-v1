import express from "express";

const router = express.Router();

const SYSTEM_VERSION = {
  systemName: "Multi Game Platform",
  internalName: "Multi Game Platform V2 Beta",
  version: "V2.0 Beta",
  buildName: "V2.0 Beta 整合開發版",
  nextVersion: "V2.1 Stable",
  status: "BETA_INTEGRATION",
  statusText: "Beta 整合開發中",
  positioning: "多遊戲互動活動平台",

  stack: {
    frontend: "Vue 3 + Vite + Tailwind CSS",
    backend: "Node.js + Express",
    database: "PostgreSQL",
    orm: "Prisma",
  },

  modules: {
    frontend: [
      "首頁",
      "活動列表",
      "活動詳情頁",
      "遊戲入口",
      "輪盤遊戲",
      "翻牌遊戲",
      "九宮格遊戲",
      "刮刮樂類型",
      "會員登入",
      "會員註冊",
    ],
    admin: [
      "後台首頁",
      "活動管理",
      "獎項管理",
      "會員管理",
      "發獎核銷",
      "報表中心",
      "樣式編輯器 V2",
    ],
    backend: [
      "活動管理 API",
      "獎項管理 API",
      "會員管理 API",
      "獎勵管理 API",
      "報表 API",
      "輪盤抽獎 API",
    ],
    database: [
      "User",
      "Campaign",
      "Prize",
      "UserReward",
      "PlayRecord",
    ],
  },

  currentFocus: [
    "補 API 穩定性",
    "修頁面錯誤",
    "統一前後端欄位",
    "優化分頁 / 搜尋 / 編輯流程",
    "補更多正式功能",
  ],

  roadmap: [
    {
      version: "V2.0 Beta",
      name: "整合開發版",
      status: "CURRENT",
      description: "前後台雛形、多遊戲架構、資料庫模型與主要 API 已建立。",
    },
    {
      version: "V2.1 Stable",
      name: "穩定版",
      status: "NEXT",
      description: "穩定後台 CRUD、前台遊戲流程、報表查詢匯出、登入權限。",
    },
    {
      version: "V2.5 Operations Build",
      name: "營運版",
      status: "PLANNED",
      description: "強化樣式編輯器、活動規則設定、完整分頁搜尋篩選、測試部署。",
    },
    {
      version: "V3.0 Release",
      name: "正式商用版",
      status: "PLANNED",
      description: "完整多遊戲活動平台，支援正式營運、會員、核銷、報表與行銷流程。",
    },
  ],

  updatedAt: new Date().toISOString(),
};

router.get("/version", (req, res) => {
  res.json({
    success: true,
    message: "取得系統版本資訊成功",
    data: SYSTEM_VERSION,
  });
});

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "系統運作正常",
    data: {
      status: "OK",
      service: "Multi Game Platform API",
      version: SYSTEM_VERSION.version,
      time: new Date().toISOString(),
    },
  });
});

export default router;