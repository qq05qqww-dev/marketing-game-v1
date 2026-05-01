# Marketing Game V1 - 專案交付清單

## 一、環境確認
- [x] 已安裝 Node.js
- [x] 已安裝 PostgreSQL
- [x] 已建立資料庫 `marketing_game_v1`
- [x] 已設定 `backend/.env`
- [x] 已安裝 frontend 套件
- [x] 已安裝 backend 套件

## 二、資料庫初始化
- [x] 已執行 `prisma generate`
- [x] 已執行 `prisma migrate dev`
- [x] 已執行 `prisma:seed`
- [x] Prisma Studio 可正常查看資料

## 三、前台功能檢查
- [x] 首頁可正常開啟
- [x] 註冊頁可正常開啟
- [x] 登入頁可正常開啟
- [x] 活動列表可正常顯示
- [x] 活動詳情可正常顯示
- [x] 抽獎頁可正常顯示
- [x] 輪盤可正常轉動
- [x] 結果彈窗可正常顯示
- [x] 中獎特效可正常顯示
- [x] 活動資格限制可正常提示

## 四、後台功能檢查
- [x] `/admin/campaigns` 可正常開啟
- [x] `/admin/prizes` 可正常開啟
- [x] `/admin/reports` 可正常開啟
- [x] `/admin/users` 可正常開啟
- [x] `/admin/rewards` 可正常開啟

## 五、活動規則檢查
- [x] 活動開始時間限制正常
- [x] 活動結束時間限制正常
- [x] 每日次數限制正常
- [x] 每人總次數限制正常
- [x] 需登入限制正常
- [x] 角色限制正常
- [x] 會員等級限制正常

## 六、權限檢查
- [x] 一般會員不可進入後台
- [x] 管理員可進入後台
- [x] JWT 驗證正常
- [x] ADMIN / USER 分流正常

## 七、會員與核銷檢查
- [x] 會員列表正常顯示
- [x] 會員搜尋正常
- [x] 會員等級修改正常
- [x] 獎品紀錄正常顯示
- [x] 發獎狀態修改正常
- [x] 核銷狀態儲存正常

## 八、報表與匯出檢查
- [x] 報表摘要正常顯示
- [x] 每日統計正常顯示
- [x] 抽獎紀錄 CSV 可下載
- [x] 獎品紀錄 CSV 可下載
- [x] 抽獎紀錄 Excel 可下載
- [x] 獎品紀錄 Excel 可下載

## 九、Demo 帳號確認
### 一般會員
- [x] `test@example.com / 123456`

### 管理員
- [x] `admin@example.com / 123456`

## 十、交付前建議
- [x] 備份整個專案資料夾
- [x] 備份 PostgreSQL 資料庫
- [x] 確認 `.env` 未外流
- [x] 確認帳號密碼可正常登入
- [x] 確認首頁展示版內容正常
- [x] 確認 README 已更新

## 十一、交付狀態
- [x] 可本機啟動
- [x] 可展示前台
- [x] 可展示後台
- [x] 可展示抽獎流程
- [x] 可展示會員管理
- [x] 可展示發獎核銷
- [x] 可展示匯出功能

## 十二、版本標記
- 專案名稱：Marketing Game V1 Final
- 狀態：最終展示版
- 建議備份名稱：`marketing-game-v1-final`