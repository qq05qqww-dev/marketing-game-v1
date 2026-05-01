<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBadge from '../../components/common/BaseBadge.vue'
import BaseEmptyState from '../../components/common/BaseEmptyState.vue'
import BaseSearchInput from '../../components/common/BaseSearchInput.vue'
import { getGameSettingById } from '../../constants/gameSettings'

const route = useRoute()
const router = useRouter()

const keyword = ref('')

const gameId = computed(() => {
  return String(route.params.gameId || '')
})

const game = computed(() => {
  return getGameSettingById(gameId.value)
})

const prizes = computed(() => {
  return game.value?.prizes || []
})

const filteredPrizes = computed(() => {
  return prizes.value.filter((prize) => {
    const searchText = [
      prize.name,
      prize.description,
      prize.type,
      String(prize.weight),
      String(prize.quantity)
    ].join(' ')

    return !keyword.value || searchText.includes(keyword.value)
  })
})

const totalWeight = computed(() => {
  return prizes.value.reduce((sum, prize) => {
    return sum + Number(prize.weight || 0)
  }, 0)
})

const totalQuantity = computed(() => {
  return prizes.value.reduce((sum, prize) => {
    return sum + Number(prize.quantity || 0)
  }, 0)
})

const prizeCount = computed(() => {
  return prizes.value.length
})

const typeTextMap = {
  success: '成功',
  primary: '主要',
  warning: '警告',
  info: '資訊',
  danger: '危險',
  purple: '紫色',
  default: '預設'
}

const statCards = computed(() => {
  return [
    {
      title: '獎項數量',
      value: prizeCount.value,
      description: '目前此遊戲設定的獎項總數',
      icon: '🎁',
      colorClass: 'from-blue-500 to-cyan-400'
    },
    {
      title: '總權重',
      value: totalWeight.value,
      description: '所有獎項權重加總',
      icon: '⚖️',
      colorClass: 'from-amber-500 to-orange-400'
    },
    {
      title: '總庫存',
      value: totalQuantity.value,
      description: '所有獎項可發放數量加總',
      icon: '📦',
      colorClass: 'from-emerald-500 to-teal-400'
    }
  ]
})

const getProbabilityPercent = (prize) => {
  if (totalWeight.value <= 0) return 0

  return ((Number(prize.weight || 0) / totalWeight.value) * 100).toFixed(2)
}

const goBack = () => {
  router.push('/admin/game-settings')
}

const goProbabilitySettings = () => {
  router.push(`/admin/game-settings/${gameId.value}/probability`)
}

const previewGame = () => {
  if (!game.value?.route) return

  router.push(game.value.route)
}
</script>

<template>
  <div class="space-y-8">
    <section
      v-if="game"
      class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            class="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-200"
            @click="goBack"
          >
            ← 返回遊戲設定
          </button>

          <div class="mt-5 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-600">
            Admin Game Prizes
          </div>

          <h1 class="mt-4 flex items-center gap-3 text-3xl font-black text-slate-900">
            <span>{{ game.icon }}</span>
            <span>{{ game.name }}｜獎項設定</span>
          </h1>

          <p class="mt-2 text-sm leading-6 text-slate-500">
            查看此遊戲的獎項名稱、說明、圖示、權重、庫存與預估中獎機率。
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            @click="previewGame"
          >
            預覽前台
          </button>

          <button
            type="button"
            class="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-600 transition hover:bg-amber-100"
            @click="goProbabilitySettings"
          >
            機率設定
          </button>

          <button
            type="button"
            class="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
          >
            新增獎項
          </button>
        </div>
      </div>
    </section>

    <BaseEmptyState
      v-else
      icon="🎮"
      title="找不到遊戲設定"
      description="請確認網址中的 gameId 是否正確。"
    />

    <template v-if="game">
      <section class="grid gap-4 md:grid-cols-3">
        <article
          v-for="card in statCards"
          :key="card.title"
          class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div
            class="bg-gradient-to-br p-5 text-white"
            :class="card.colorClass"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-bold text-white/80">
                  {{ card.title }}
                </p>

                <p class="mt-3 text-4xl font-black">
                  {{ card.value }}
                </p>
              </div>

              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-3xl">
                {{ card.icon }}
              </div>
            </div>

            <p class="mt-4 text-sm font-semibold text-white/80">
              {{ card.description }}
            </p>
          </div>
        </article>
      </section>

      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <BaseSearchInput
            v-model="keyword"
            placeholder="搜尋獎項名稱、說明、權重或庫存"
          />

          <div class="flex flex-wrap gap-2">
            <BaseBadge
              :text="`遊戲 ID：${game.id}`"
              type="default"
            />

            <BaseBadge
              :text="`機率模式：${game.probabilityMode}`"
              type="warning"
            />
          </div>
        </div>
      </section>

      <section
        v-if="filteredPrizes.length"
        class="rounded-3xl border border-slate-200 bg-white shadow-sm"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[960px] text-left">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50 text-sm text-slate-500">
                <th class="px-5 py-4 font-black">
                  獎項
                </th>
                <th class="px-5 py-4 font-black">
                  類型
                </th>
                <th class="px-5 py-4 font-black">
                  權重
                </th>
                <th class="px-5 py-4 font-black">
                  預估機率
                </th>
                <th class="px-5 py-4 font-black">
                  庫存
                </th>
                <th class="px-5 py-4 text-right font-black">
                  操作
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="prize in filteredPrizes"
                :key="prize.id"
                class="border-b border-slate-100 transition hover:bg-slate-50"
              >
                <td class="px-5 py-4">
                  <div class="flex items-center gap-4">
                    <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                      {{ prize.icon }}
                    </div>

                    <div class="min-w-0">
                      <div class="font-black text-slate-800">
                        {{ prize.name }}
                      </div>

                      <div class="mt-1 text-sm text-slate-400">
                        {{ prize.description }}
                      </div>
                    </div>
                  </div>
                </td>

                <td class="px-5 py-4">
                  <BaseBadge
                    :text="typeTextMap[prize.type] || prize.type"
                    :type="prize.type || 'default'"
                  />
                </td>

                <td class="px-5 py-4">
                  <div class="text-lg font-black text-slate-800">
                    {{ prize.weight }}
                  </div>
                </td>

                <td class="px-5 py-4">
                  <div class="space-y-2">
                    <div class="text-sm font-black text-slate-700">
                      {{ getProbabilityPercent(prize) }}%
                    </div>

                    <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full bg-blue-600"
                        :style="{ width: `${getProbabilityPercent(prize)}%` }"
                      />
                    </div>
                  </div>
                </td>

                <td class="px-5 py-4">
                  <div class="font-black text-slate-800">
                    {{ prize.quantity }}
                  </div>

                  <div
                    v-if="Number(prize.quantity) >= 9999"
                    class="mt-1 text-xs font-bold text-slate-400"
                  >
                    視為無上限
                  </div>
                </td>

                <td class="px-5 py-4">
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100"
                    >
                      編輯
                    </button>

                    <button
                      type="button"
                      class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-600 transition hover:bg-rose-100"
                    >
                      停用
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <BaseEmptyState
        v-else
        icon="🎁"
        title="找不到符合的獎項"
        description="請調整搜尋關鍵字。"
      />
    </template>
  </div>
</template>