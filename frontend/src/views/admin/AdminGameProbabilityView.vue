<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBadge from '../../components/common/BaseBadge.vue'
import BaseEmptyState from '../../components/common/BaseEmptyState.vue'
import BaseSearchInput from '../../components/common/BaseSearchInput.vue'
import BaseModal from '../../components/common/BaseModal.vue'
import { useAdminGameSettings } from '../../composables/useAdminGameSettings'

const route = useRoute()
const router = useRouter()

const {
  getRawGameSettingById,
  getGameSettingById,
  updateGamePrize
} = useAdminGameSettings()

const keyword = ref('')
const showWeightModal = ref(false)
const editingPrizeId = ref(null)
const savedMessage = ref('')

const weightForm = reactive({
  name: '',
  icon: '',
  weight: 1,
  quantity: 1
})

const gameId = computed(() => {
  return String(route.params.gameId || '')
})

const game = computed(() => {
  return getRawGameSettingById(gameId.value) || getGameSettingById(gameId.value)
})

const isTemplateGame = computed(() => {
  return Boolean(game.value?.templateId)
})

const templateGame = computed(() => {
  if (!game.value?.templateId) return null

  return getRawGameSettingById(game.value.templateId)
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

const maxWeight = computed(() => {
  if (!prizes.value.length) return 0

  return Math.max(...prizes.value.map((prize) => Number(prize.weight || 0)))
})

const highestWeightPrize = computed(() => {
  return prizes.value.find((prize) => Number(prize.weight || 0) === maxWeight.value) || null
})

const probabilityModeTextMap = {
  weight: '權重機率',
  percent: '百分比機率',
  fixed: '固定結果'
}

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
      title: '總權重',
      value: totalWeight.value,
      description: '所有獎項權重加總',
      icon: '⚖️',
      colorClass: 'from-amber-500 to-orange-400'
    },
    {
      title: '獎項數量',
      value: prizes.value.length,
      description: '目前此遊戲設定的獎項總數',
      icon: '🎁',
      colorClass: 'from-blue-500 to-cyan-400'
    },
    {
      title: '最高權重',
      value: highestWeightPrize.value?.name || '-',
      description: highestWeightPrize.value ? `權重 ${highestWeightPrize.value.weight}` : '尚無資料',
      icon: '📈',
      colorClass: 'from-emerald-500 to-teal-400'
    },
    {
      title: '總庫存',
      value: totalQuantity.value,
      description: '所有獎項可發放數量加總',
      icon: '📦',
      colorClass: 'from-purple-500 to-pink-400'
    }
  ]
})

const getProbabilityPercent = (prize) => {
  if (totalWeight.value <= 0) return '0.00'

  return ((Number(prize.weight || 0) / totalWeight.value) * 100).toFixed(2)
}

const getProbabilityWidth = (prize) => {
  const percent = Number(getProbabilityPercent(prize))

  if (percent < 1 && percent > 0) return 1

  return percent
}

const getWeightLevel = (prize) => {
  const percent = Number(getProbabilityPercent(prize))

  if (percent >= 40) return '高'
  if (percent >= 15) return '中'
  if (percent > 0) return '低'

  return '無'
}

const getWeightLevelType = (prize) => {
  const percent = Number(getProbabilityPercent(prize))

  if (percent >= 40) return 'danger'
  if (percent >= 15) return 'warning'
  if (percent > 0) return 'success'

  return 'default'
}

const openWeightModal = (prize) => {
  editingPrizeId.value = prize.id
  weightForm.name = prize.name || ''
  weightForm.icon = prize.icon || '🎁'
  weightForm.weight = Number(prize.weight || 0)
  weightForm.quantity = Number(prize.quantity || 0)
  showWeightModal.value = true
}

const closeWeightModal = () => {
  showWeightModal.value = false
  editingPrizeId.value = null
  weightForm.name = ''
  weightForm.icon = ''
  weightForm.weight = 1
  weightForm.quantity = 1
}

const saveWeight = () => {
  if (!game.value) return

  if (editingPrizeId.value === null) {
    window.alert('找不到要編輯的獎項')
    return
  }

  if (Number(weightForm.weight) < 0) {
    window.alert('權重不能小於 0')
    return
  }

  if (Number(weightForm.quantity) < 0) {
    window.alert('庫存不能小於 0')
    return
  }

  const updatedPrize = updateGamePrize(gameId.value, editingPrizeId.value, {
    weight: weightForm.weight,
    quantity: weightForm.quantity
  })

  if (!updatedPrize) {
    window.alert('儲存失敗，找不到獎項')
    return
  }

  savedMessage.value = isTemplateGame.value
    ? '自訂模板遊戲權重與庫存已更新，不會影響原始模板。'
    : '權重與庫存已更新，前台抽獎機率會同步變更。'

  closeWeightModal()

  setTimeout(() => {
    savedMessage.value = ''
  }, 2500)
}

const goBack = () => {
  router.push('/admin/game-settings')
}

const goPrizeSettings = () => {
  router.push(`/admin/game-settings/${gameId.value}/prizes`)
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

          <div class="mt-5 flex flex-wrap gap-2">
            <div class="inline-flex rounded-full bg-amber-50 px-4 py-2 text-sm font-black text-amber-600">
              Admin Game Probability
            </div>

            <BaseBadge
              v-if="isTemplateGame"
              text="模板遊戲"
              type="info"
            />
          </div>

          <h1 class="mt-4 flex items-center gap-3 text-3xl font-black text-slate-900">
            <span>{{ game.icon }}</span>
            <span>{{ game.name }}｜機率設定</span>
          </h1>

          <p class="mt-2 text-sm leading-6 text-slate-500">
            查看與編輯此遊戲每個獎項的權重、預估中獎機率、庫存與機率分布。
          </p>

          <div class="mt-3 flex flex-wrap gap-2">
            <BaseBadge
              :text="`自訂遊戲 ID：${gameId}`"
              type="default"
            />

            <BaseBadge
              v-if="isTemplateGame"
              :text="`套用模板：${game.templateId}`"
              type="info"
            />
          </div>
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
            class="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-600 transition hover:bg-blue-100"
            @click="goPrizeSettings"
          >
            獎項設定
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
      <section
        v-if="isTemplateGame"
        class="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm"
      >
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-lg font-black text-blue-900">
              模板遊戲機率設定
            </h2>

            <p class="mt-1 text-sm leading-6 text-blue-700">
              你目前正在編輯「{{ game.name }}」的自訂權重資料，不會影響原始模板「{{ templateGame?.name || game.templateId }}」。
            </p>
          </div>

          <BaseBadge
            text="安全編輯自訂 gameId"
            type="success"
          />
        </div>
      </section>

      <section
        v-if="savedMessage"
        class="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-black text-emerald-700"
      >
        {{ savedMessage }}
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              <div class="min-w-0">
                <p class="text-sm font-bold text-white/80">
                  {{ card.title }}
                </p>

                <p class="mt-3 truncate text-3xl font-black">
                  {{ card.value }}
                </p>
              </div>

              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl">
                {{ card.icon }}
              </div>
            </div>

            <p class="mt-4 truncate text-sm font-semibold text-white/80">
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
              :text="`機率模式：${probabilityModeTextMap[game.probabilityMode] || game.probabilityMode}`"
              type="warning"
            />
          </div>
        </div>
      </section>

      <section class="rounded-3xl border border-amber-200 bg-amber-50 p-5">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-lg font-black text-amber-800">
              權重機率說明
            </h2>

            <p class="mt-1 text-sm leading-6 text-amber-700">
              權重越高，中獎機率越高。預估機率 = 單一獎項權重 ÷ 全部獎項總權重。
            </p>
          </div>

          <BaseBadge
            :text="`總權重 ${totalWeight}`"
            type="warning"
          />
        </div>
      </section>

      <section
        v-if="filteredPrizes.length"
        class="grid gap-5"
      >
        <article
          v-for="prize in filteredPrizes"
          :key="prize.id"
          class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div class="grid gap-0 xl:grid-cols-[1fr_360px]">
            <div class="p-6">
              <div class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div class="flex min-w-0 items-start gap-4">
                  <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-slate-100 text-4xl">
                    {{ prize.icon }}
                  </div>

                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <h2 class="text-xl font-black text-slate-900">
                        {{ prize.name }}
                      </h2>

                      <BaseBadge
                        :text="typeTextMap[prize.type] || prize.type"
                        :type="prize.type || 'default'"
                      />

                      <BaseBadge
                        :text="`權重等級：${getWeightLevel(prize)}`"
                        :type="getWeightLevelType(prize)"
                      />
                    </div>

                    <p class="mt-2 text-sm leading-6 text-slate-500">
                      {{ prize.description }}
                    </p>
                  </div>
                </div>

                <div class="text-left md:text-right">
                  <div class="text-3xl font-black text-slate-900">
                    {{ getProbabilityPercent(prize) }}%
                  </div>

                  <p class="mt-1 text-xs font-bold text-slate-400">
                    預估中獎機率
                  </p>
                </div>
              </div>

              <div class="mt-6">
                <div class="mb-2 flex items-center justify-between text-xs font-black text-slate-400">
                  <span>機率分布</span>
                  <span>{{ prize.weight }} / {{ totalWeight }}</span>
                </div>

                <div class="h-4 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full bg-amber-500 transition-all"
                    :style="{ width: `${getProbabilityWidth(prize)}%` }"
                  />
                </div>
              </div>
            </div>

            <div class="border-t border-slate-100 bg-slate-50 p-6 xl:border-l xl:border-t-0">
              <div class="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                <div class="rounded-2xl bg-white p-4">
                  <p class="text-xs font-black text-slate-400">
                    權重
                  </p>

                  <p class="mt-2 text-2xl font-black text-slate-800">
                    {{ prize.weight }}
                  </p>
                </div>

                <div class="rounded-2xl bg-white p-4">
                  <p class="text-xs font-black text-slate-400">
                    庫存
                  </p>

                  <p class="mt-2 text-2xl font-black text-slate-800">
                    {{ prize.quantity }}
                  </p>

                  <p
                    v-if="Number(prize.quantity) >= 9999"
                    class="mt-1 text-xs font-bold text-slate-400"
                  >
                    視為無上限
                  </p>
                </div>

                <div class="rounded-2xl bg-white p-4">
                  <p class="text-xs font-black text-slate-400">
                    獎項 ID
                  </p>

                  <p class="mt-2 text-2xl font-black text-slate-800">
                    {{ prize.id }}
                  </p>
                </div>
              </div>

              <div class="mt-5 grid gap-3">
                <button
                  type="button"
                  class="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-600"
                  @click="openWeightModal(prize)"
                >
                  編輯權重 / 庫存
                </button>

                <button
                  type="button"
                  class="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-600 transition hover:bg-blue-100"
                  @click="goPrizeSettings"
                >
                  回獎項設定
                </button>
              </div>
            </div>
          </div>
        </article>
      </section>

      <BaseEmptyState
        v-else
        icon="⚖️"
        title="找不到符合的機率設定"
        description="請調整搜尋關鍵字。"
      />
    </template>

    <BaseModal
      v-model="showWeightModal"
      title="編輯權重與庫存"
      :description="isTemplateGame ? '這會修改自訂模板遊戲的權重，不會影響原始模板。' : '修改後會同步影響前台抽獎機率。'"
      size="sm"
      :close-on-backdrop="false"
      @close="closeWeightModal"
    >
      <div class="space-y-5">
        <div
          v-if="isTemplateGame"
          class="rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800"
        >
          目前編輯的是自訂遊戲 ID：{{ gameId }}。原始模板 {{ game.templateId }} 不會被修改。
        </div>

        <div class="rounded-3xl bg-slate-50 p-5 text-center">
          <div class="text-5xl">
            {{ weightForm.icon || '🎁' }}
          </div>

          <h2 class="mt-3 text-xl font-black text-slate-900">
            {{ weightForm.name || '獎項' }}
          </h2>
        </div>

        <div>
          <label class="mb-2 block text-sm font-black text-slate-700">
            權重
          </label>

          <input
            v-model.number="weightForm.weight"
            type="number"
            min="0"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
          />

          <p class="mt-2 text-xs leading-5 text-slate-400">
            權重越高，抽中的機率越高。設定 0 代表幾乎不會被抽中。
          </p>
        </div>

        <div>
          <label class="mb-2 block text-sm font-black text-slate-700">
            庫存
          </label>

          <input
            v-model.number="weightForm.quantity"
            type="number"
            min="0"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
          />

          <p class="mt-2 text-xs leading-5 text-slate-400">
            9999 可以視為測試階段的無上限庫存。
          </p>
        </div>

        <div class="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          儲存後，前台遊戲會立即使用新的權重進行抽獎。
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
          @click.stop="closeWeightModal"
        >
          取消
        </button>

        <button
          type="button"
          class="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600"
          @click.stop="saveWeight"
        >
          儲存權重
        </button>
      </template>
    </BaseModal>
  </div>
</template>