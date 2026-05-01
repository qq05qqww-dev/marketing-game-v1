<script setup>
import { useRouter } from 'vue-router'
import PlatformNavbar from '../../components/PlatformNavbar.vue'
import PlatformFooter from '../../components/PlatformFooter.vue'
import BasePageHeader from '../../components/common/BasePageHeader.vue'
import BaseActionCard from '../../components/common/BaseActionCard.vue'
import BaseButton from '../../components/common/BaseButton.vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goCampaigns = () => {
  router.push('/campaigns')
}

const goGames = () => {
  router.push('/games')
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-100">
    <PlatformNavbar />

    <main class="flex-1">
      <div class="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <BasePageHeader
          eyebrow="Page Not Found"
          title="找不到這個頁面"
          description="這個網址可能不存在、已被移除，或目前沒有對應的前台頁面。你可以返回首頁，或前往活動列表與遊戲入口繼續操作。"
          variant="slate"
          badgeIcon="404"
          badgeText="Not Found"
        >
          <BaseButton
            variant="dark"
            @click="goHome"
          >
            返回首頁
          </BaseButton>

          <BaseButton
            variant="primary"
            @click="goCampaigns"
          >
            活動列表
          </BaseButton>

          <BaseButton
            variant="indigo"
            @click="goGames"
          >
            遊戲入口
          </BaseButton>

          <BaseButton
            variant="secondary"
            @click="goBack"
          >
            返回上一頁
          </BaseButton>

          <template #right>
            <div class="rounded-[32px] border border-white/70 bg-white/85 p-8 text-center shadow-sm backdrop-blur">
              <div class="mx-auto flex h-28 w-28 items-center justify-center rounded-[36px] bg-gradient-to-br from-slate-900 to-slate-700 text-5xl font-black text-white shadow-xl">
                404
              </div>

              <div class="mt-5 text-sm font-black text-slate-400">
                Error Page
              </div>

              <div class="mt-1 text-2xl font-black text-slate-900">
                Not Found
              </div>
            </div>
          </template>
        </BasePageHeader>

        <section class="grid gap-4 md:grid-cols-3">
          <BaseActionCard
            icon="🏠"
            title="首頁"
            description="查看平台介紹、最新活動與會員狀態。"
            variant="slate"
            @click="goHome"
          />

          <BaseActionCard
            icon="🎮"
            title="活動列表"
            description="查看所有活動，依遊戲類型、狀態與資格篩選。"
            variant="rose"
            @click="goCampaigns"
          />

          <BaseActionCard
            icon="🕹️"
            title="遊戲入口"
            description="快速進入輪盤、翻牌、九宮格與刮刮樂。"
            variant="indigo"
            @click="goGames"
          />
        </section>
      </div>
    </main>

    <PlatformFooter />
  </div>
</template>