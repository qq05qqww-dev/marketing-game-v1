<template>
  <div class="min-h-screen bg-slate-100 p-6">
    <div class="mx-auto max-w-7xl space-y-6">
      <!-- 頁面標題 -->
      <div class="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-sm font-medium text-indigo-600">
              System Version Center
            </p>
            <h1 class="mt-1 text-2xl font-bold text-slate-900">
              系統狀態 / 版本資訊
            </h1>
            <p class="mt-2 text-sm text-slate-500">
              用來檢查目前平台版本、模組完成度、後續開發階段與系統定位。
            </p>
          </div>

          <div class="rounded-xl bg-indigo-50 px-5 py-4 text-right">
            <p class="text-xs text-indigo-500">目前版本</p>
            <p class="text-xl font-bold text-indigo-700">
              {{ systemInfo.version }}
            </p>
            <p class="mt-1 text-xs text-indigo-500">
              {{ systemInfo.stage }}
            </p>
          </div>
        </div>
      </div>

      <!-- 版本摘要卡片 -->
      <div class="grid gap-4 md:grid-cols-4">
        <div
          v-for="item in summaryCards"
          :key="item.label"
          class="rounded-2xl bg-white p-5 shadow-sm border border-slate-200"
        >
          <p class="text-sm text-slate-500">
            {{ item.label }}
          </p>
          <p class="mt-2 text-xl font-bold text-slate-900">
            {{ item.value }}
          </p>
          <p class="mt-1 text-xs text-slate-400">
            {{ item.desc }}
          </p>
        </div>
      </div>

      <!-- 系統基本資料 -->
      <div class="grid gap-6 lg:grid-cols-3">
        <div class="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 lg:col-span-2">
          <h2 class="text-lg font-bold text-slate-900">
            系統基本資料
          </h2>

          <div class="mt-5 overflow-hidden rounded-xl border border-slate-200">
            <table class="w-full text-sm">
              <tbody>
                <tr
                  v-for="row in basicInfoRows"
                  :key="row.label"
                  class="border-b border-slate-100 last:border-b-0"
                >
                  <td class="w-48 bg-slate-50 px-4 py-3 font-medium text-slate-600">
                    {{ row.label }}
                  </td>
                  <td class="px-4 py-3 text-slate-800">
                    {{ row.value }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 目前狀態 -->
        <div class="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <h2 class="text-lg font-bold text-slate-900">
            目前版本狀態
          </h2>

          <div class="mt-5 rounded-2xl bg-amber-50 p-5 border border-amber-200">
            <p class="text-sm font-medium text-amber-700">
              {{ systemInfo.statusLabel }}
            </p>
            <p class="mt-3 text-sm leading-6 text-amber-800">
              {{ systemInfo.statusDescription }}
            </p>
          </div>

          <div class="mt-5 space-y-3">
            <div
              v-for="item in statusItems"
              :key="item"
              class="flex items-center gap-3 text-sm text-slate-700"
            >
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-700">
                ✓
              </span>
              <span>{{ item }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 模組完成度 -->
      <div class="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-900">
              模組完成度
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              這裡用來判斷目前哪些功能已經進入 V2 Beta，哪些要往 V2.1 Stable 補齊。
            </p>
          </div>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="module in modules"
            :key="module.name"
            class="rounded-2xl border border-slate-200 p-5"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="font-bold text-slate-900">
                  {{ module.name }}
                </h3>
                <p class="mt-1 text-xs text-slate-500">
                  {{ module.desc }}
                </p>
              </div>

              <span
                class="rounded-full px-3 py-1 text-xs font-medium"
                :class="getStatusClass(module.status)"
              >
                {{ module.status }}
              </span>
            </div>

            <div class="mt-4">
              <div class="flex items-center justify-between text-xs text-slate-500">
                <span>完成度</span>
                <span>{{ module.percent }}%</span>
              </div>

              <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-indigo-500"
                  :style="{ width: module.percent + '%' }"
                ></div>
              </div>
            </div>

            <ul class="mt-4 space-y-2 text-sm text-slate-600">
              <li
                v-for="feature in module.features"
                :key="feature"
                class="flex gap-2"
              >
                <span class="text-emerald-500">•</span>
                <span>{{ feature }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 版本路線圖 -->
      <div class="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <h2 class="text-lg font-bold text-slate-900">
          版本規劃路線圖
        </h2>

        <div class="mt-6 space-y-4">
          <div
            v-for="version in roadmap"
            :key="version.version"
            class="rounded-2xl border p-5"
            :class="version.current ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-slate-900">
                    {{ version.version }}
                  </h3>

                  <span
                    v-if="version.current"
                    class="rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white"
                  >
                    目前版本
                  </span>
                </div>

                <p class="mt-2 text-sm text-slate-600">
                  {{ version.desc }}
                </p>
              </div>

              <p class="text-sm font-medium text-slate-500">
                {{ version.stage }}
              </p>
            </div>

            <ul class="mt-4 grid gap-2 md:grid-cols-2">
              <li
                v-for="task in version.tasks"
                :key="task"
                class="flex gap-2 text-sm text-slate-700"
              >
                <span class="text-indigo-500">✓</span>
                <span>{{ task }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 下一步建議 -->
      <div class="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
        <h2 class="text-lg font-bold">
          下一步建議
        </h2>

        <p class="mt-3 text-sm leading-7 text-slate-300">
          目前最建議往 V2.1 Stable 前進，優先把後台 CRUD、分頁、搜尋、篩選、匯出、會員權限與遊戲流程穩定下來。
          等這些穩定後，再進入 V2.5 Operations Build，補完整樣式編輯器、活動規則視覺化設定、部署測試環境。
        </p>

        <div class="mt-5 grid gap-3 md:grid-cols-3">
          <div class="rounded-xl bg-white/10 p-4">
            <p class="font-bold">1. 穩定後台 CRUD</p>
            <p class="mt-2 text-xs leading-5 text-slate-300">
              活動、獎項、會員、發獎核銷都要能新增、編輯、刪除、查詢。
            </p>
          </div>

          <div class="rounded-xl bg-white/10 p-4">
            <p class="font-bold">2. 穩定前台遊戲</p>
            <p class="mt-2 text-xs leading-5 text-slate-300">
              輪盤、翻牌、九宮格、刮刮樂都要統一走後端抽獎 API。
            </p>
          </div>

          <div class="rounded-xl bg-white/10 p-4">
            <p class="font-bold">3. 補正式報表</p>
            <p class="mt-2 text-xs leading-5 text-slate-300">
              支援真分頁、日期篩選、活動篩選、CSV / XLSX 匯出。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const systemInfo = {
  name: 'Multi Game Platform',
  version: 'V2.0 Beta',
  internalVersion: 'V2.0 Beta 整合開發版',
  nextVersion: 'V2.1 Stable',
  stage: 'Beta 整合中',
  position: '多遊戲互動活動平台',
  statusLabel: '目前屬於 V2 Beta 整合版',
  statusDescription:
    '系統已經具備前後台完整雛形、資料庫模型、後端 API、真實資料串接與多遊戲架構，但仍在補 API 穩定性、欄位統一、分頁搜尋、編輯流程與正式功能。',
}

const summaryCards = [
  {
    label: '系統名稱',
    value: systemInfo.name,
    desc: '活動互動平台',
  },
  {
    label: '目前版本',
    value: systemInfo.version,
    desc: '整合開發階段',
  },
  {
    label: '下一階段',
    value: systemInfo.nextVersion,
    desc: '穩定版目標',
  },
  {
    label: '遊戲架構',
    value: '4 種',
    desc: '輪盤 / 翻牌 / 九宮格 / 刮刮樂',
  },
]

const basicInfoRows = [
  {
    label: '系統名稱',
    value: systemInfo.name,
  },
  {
    label: '版本編號',
    value: systemInfo.version,
  },
  {
    label: '內部標示',
    value: systemInfo.internalVersion,
  },
  {
    label: '系統定位',
    value: systemInfo.position,
  },
  {
    label: '目前階段',
    value: systemInfo.stage,
  },
  {
    label: '下一版本',
    value: systemInfo.nextVersion,
  },
  {
    label: '前端技術',
    value: 'Vue 3 / Vite / Tailwind CSS',
  },
  {
    label: '後端技術',
    value: 'Node.js / Express / Prisma / PostgreSQL',
  },
]

const statusItems = [
  '前後台完整雛形已建立',
  '資料庫正式模型已建立',
  '後端 API 已開始串接',
  '活動 / 獎項 / 會員 / 報表模組已具備',
  '多遊戲架構已成形',
  '輪盤遊戲完成度最高',
]

const modules = [
  {
    name: '前台活動入口',
    desc: '首頁、活動列表、活動詳情、遊戲入口',
    status: '已接入',
    percent: 75,
    features: ['首頁入口', '活動列表', '活動詳情', '遊戲入口'],
  },
  {
    name: '會員系統',
    desc: '登入、註冊、角色、會員等級',
    status: '開發中',
    percent: 70,
    features: ['登入頁', '註冊頁', 'USER / ADMIN', 'NORMAL / VIP'],
  },
  {
    name: '後台活動管理',
    desc: '活動 CRUD、活動類型、活動期間',
    status: '開發中',
    percent: 80,
    features: ['新增活動', '編輯活動', '刪除活動', '活動列表'],
  },
  {
    name: '獎項管理',
    desc: '獎項 CRUD、庫存、機率設定',
    status: '開發中',
    percent: 78,
    features: ['新增獎項', '編輯獎項', '刪除獎項', '機率設定'],
  },
  {
    name: '會員管理',
    desc: '會員列表、搜尋、篩選、等級更新',
    status: '修整中',
    percent: 65,
    features: ['會員列表', '角色篩選', '等級篩選', '分頁顯示'],
  },
  {
    name: '發獎核銷',
    desc: '獎勵紀錄、兌換碼、狀態更新',
    status: '開發中',
    percent: 68,
    features: ['發獎資料', '兌換碼', '狀態更新', '刪除資料'],
  },
  {
    name: '報表中心',
    desc: '摘要統計、每日統計、匯出、真分頁',
    status: '開發中',
    percent: 72,
    features: ['報表摘要', '每日統計', 'CSV 匯出', 'XLSX 匯出'],
  },
  {
    name: '樣式編輯器 V2',
    desc: '輪盤樣式、即時預覽、前台讀取',
    status: '開發中',
    percent: 60,
    features: ['活動選擇', '即時預覽', '色彩設定', '儲存樣式'],
  },
  {
    name: '多遊戲系統',
    desc: '輪盤、翻牌、九宮格、刮刮樂',
    status: 'Beta',
    percent: 55,
    features: ['WHEEL', 'FLIP', 'GRID', 'SCRATCH'],
  },
]

const roadmap = [
  {
    version: 'V2.0 Beta',
    stage: '目前版本',
    current: true,
    desc: '多遊戲互動活動平台整合開發版，已具備前後台雛形與主要資料模型。',
    tasks: [
      '前台活動入口',
      '後台管理中心',
      '活動管理',
      '獎項管理',
      '會員管理',
      '報表中心',
      '輪盤遊戲 API 串接',
      '樣式編輯器 V2 雛形',
    ],
  },
  {
    version: 'V2.1 Stable',
    stage: '下一階段',
    current: false,
    desc: '穩定後台 CRUD、前台遊戲流程、登入權限、報表匯出與分頁搜尋。',
    tasks: [
      '所有後台 CRUD 穩定',
      '前台遊戲流程穩定',
      '報表正常查詢與匯出',
      '會員權限流程穩定',
      '後端真分頁統一',
      '搜尋與篩選統一',
    ],
  },
  {
    version: 'V2.5 Operations Build',
    stage: '營運版',
    current: false,
    desc: '補齊樣式編輯器、活動規則可視化、正式營運流程與部署測試環境。',
    tasks: [
      '樣式編輯器完整化',
      '活動規則可視化設定',
      '完整分頁搜尋篩選',
      '測試環境部署',
      '核銷流程優化',
      '活動資料匯出',
    ],
  },
  {
    version: 'V3.0 Release',
    stage: '正式版',
    current: false,
    desc: '多遊戲平台正式商用版，具備完整活動編排、會員行銷、核銷與報表模組。',
    tasks: [
      '正式商用版',
      '多遊戲完整模組',
      '會員行銷模組',
      '報表分析模組',
      '活動樣式完整編排',
      '正式部署上線',
    ],
  },
]

function getStatusClass(status) {
  if (status === '已接入') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (status === '開發中') {
    return 'bg-indigo-100 text-indigo-700'
  }

  if (status === '修整中') {
    return 'bg-amber-100 text-amber-700'
  }

  if (status === 'Beta') {
    return 'bg-purple-100 text-purple-700'
  }

  return 'bg-slate-100 text-slate-600'
}
</script>