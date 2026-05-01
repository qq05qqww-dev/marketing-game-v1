# Marketing Game V1

一套從無到有製作的互動式抽獎活動平台，包含前台抽獎頁、會員註冊登入、活動規則控制、後台活動管理、獎項管理、報表中心、會員管理與發獎核銷功能。

---

## 專案簡介

Marketing Game V1 是一套可展示、可操作、可管理的行銷活動系統，適合用於：

- 品牌抽獎活動
- 會員留存活動
- 展場互動活動
- 節慶行銷活動
- 抽獎活動平台原型展示

本專案採用前後端分離架構，包含完整的活動規則控制與後台管理功能。

---

## 核心功能

### 前台功能
- 會員註冊 / 登入 / 登出
- 活動列表
- 活動詳情
- 抽獎遊戲頁
- 動態輪盤
- 指針卡點效果
- 抽獎結果彈窗
- 中獎彩帶 / 特效
- 活動期間顯示
- 抽獎資格限制提示

### 活動規則控制
- 活動開始 / 結束時間
- 每日抽獎次數限制
- 每人總抽獎次數限制
- 需登入才能參加
- 指定角色限制
- 指定會員等級限制

### 後台功能
- 活動管理
- 獎項管理
- 報表中心
- 抽獎紀錄匯出
- 獎品紀錄匯出
- 會員管理
- 發獎核銷管理

### 匯出功能
- CSV 匯出
- Excel `.xlsx` 匯出

---

## 技術架構

### Frontend
- Vue 3
- Vite
- Pinia
- Vue Router
- Tailwind CSS

### Backend
- Node.js
- Express
- Prisma ORM
- JWT
- bcrypt
- ExcelJS

### Database
- PostgreSQL

---

## 專案結構

```bash
marketing-game-v1/
├─ frontend/
│  ├─ src/
│  │  ├─ api/
│  │  ├─ layouts/
│  │  ├─ router/
│  │  ├─ stores/
│  │  ├─ views/
│  │  │  ├─ front/
│  │  │  └─ admin/
│  │  └─ main.js
│  └─ package.json
│
├─ backend/
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ seed.js
│  ├─ src/
│  │  ├─ config/
│  │  ├─ controllers/
│  │  ├─ middleware/
│  │  ├─ routes/
│  │  ├─ services/
│  │  ├─ utils/
│  │  └─ server.js
│  └─ package.json
│
├─ README.md
└─ DELIVERY_CHECKLIST.md