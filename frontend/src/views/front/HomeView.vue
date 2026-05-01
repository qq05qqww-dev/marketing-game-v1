<script setup>
import { useRouter } from 'vue-router'
import PlatformNavbar from '../../components/PlatformNavbar.vue'
import PlatformFooter from '../../components/PlatformFooter.vue'

const router = useRouter()

const goGames = () => {
  router.push('/games')
}

const goCampaigns = () => {
  router.push('/campaigns')
}

const goLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-100">
    <PlatformNavbar />

    <main class="flex-1">
      <section class="relative overflow-hidden bg-slate-950">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,.35),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,.25),transparent_35%)]" />

        <div class="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <div class="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-blue-100 backdrop-blur">
              Multi Game Platform V2.1 Stable
            </div>

            <h1 class="mt-6 text-4xl font-black leading-tight text-white md:text-6xl">
              互動行銷遊戲平台
            </h1>

            <p class="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              建立抽獎活動、管理獎項、設定遊戲玩法，讓品牌活動更有趣、更容易提高參與率。
            </p>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                class="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
                @click="goGames"
              >
                進入遊戲中心
              </button>

              <button
                type="button"
                class="rounded-2xl bg-white px-6 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-100"
                @click="goCampaigns"
              >
                查看活動列表
              </button>

              <button
                type="button"
                class="rounded-2xl border border-white/20 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
                @click="goLogin"
              >
                會員登入
              </button>
            </div>
          </div>

          <div class="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-3xl bg-white p-5 shadow-lg">
                <div class="text-4xl">🎁</div>
                <h3 class="mt-4 text-lg font-black text-slate-800">
                  九宮格抽獎
                </h3>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  適合優惠券、兌換碼、即抽即中活動。
                </p>
              </div>

              <div class="rounded-3xl bg-white p-5 shadow-lg">
                <div class="text-4xl">🎫</div>
                <h3 class="mt-4 text-lg font-black text-slate-800">
                  刮刮卡
                </h3>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  手機操作直覺，適合 LINE 活動導流。
                </p>
              </div>

              <div class="rounded-3xl bg-white p-5 shadow-lg">
                <div class="text-4xl">🎡</div>
                <h3 class="mt-4 text-lg font-black text-slate-800">
                  幸運輪盤
                </h3>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  活動現場感強，適合大螢幕互動。
                </p>
              </div>

              <div class="rounded-3xl bg-white p-5 shadow-lg">
                <div class="text-4xl">🃏</div>
                <h3 class="mt-4 text-lg font-black text-slate-800">
                  翻牌遊戲
                </h3>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  簡單好懂，適合快速製作活動。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-4 py-12">
        <div class="grid gap-6 md:grid-cols-3">
          <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="text-3xl">🎮</div>
            <h3 class="mt-4 text-lg font-black text-slate-800">
              多種遊戲玩法
            </h3>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              支援九宮格、刮刮卡、輪盤、翻牌、敲金蛋等互動玩法。
            </p>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="text-3xl">🏆</div>
            <h3 class="mt-4 text-lg font-black text-slate-800">
              獎項與中獎管理
            </h3>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              可設定獎項、數量、機率，並記錄每位玩家的中獎結果。
            </p>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="text-3xl">📊</div>
            <h3 class="mt-4 text-lg font-black text-slate-800">
              活動數據報表
            </h3>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              後台可查看參與人數、中獎紀錄、核銷狀態與活動成效。
            </p>
          </div>
        </div>
      </section>
    </main>

    <PlatformFooter />
  </div>
</template>