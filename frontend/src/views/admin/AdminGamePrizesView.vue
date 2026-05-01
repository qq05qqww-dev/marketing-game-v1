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
  updateGamePrize,
  addGamePrize,
  deleteGamePrize
} = useAdminGameSettings()

const keyword = ref('')
const showPrizeModal = ref(false)
const editingPrizeId = ref(null)
const savedMessage = ref('')

const prizeForm = reactive({
  name: '',
  description: '',
  icon: '',
  type: 'primary',
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

const prizeCount = computed(() => {
  return prizes.value.length
})

const isEditing = computed(() => {
  return editingPrizeId.value !== null
})

const typeOptions = [
  {
    label: '成功',
    value: 'success'
  },
  {
    label: '主要',
    value: 'primary'
  },
  {
    label: '警告',
    value: 'warning'
  },
  {
    label: '資訊',
    value: 'info'
  },
  {
    label: '危險',
    value: 'danger'
  },
  {
    label: '紫色',
    value: 'purple'
  },
  {
    label: '預設',
    value: 'default'
  }
]

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
  if (totalWeight.value <= 0) return '0.00'

  return ((Number(prize.weight || 0) / totalWeight.value) * 100).toFixed(2)
}

const resetPrizeForm = () => {
  editingPrizeId.value = null
  prizeForm.name = ''
  prizeForm.description = ''
  prizeForm.icon = '🎁'
  prizeForm.type = 'primary'
  prizeForm.weight = 1
  prizeForm.quantity = 1
}

const openAddPrizeModal = () => {
  resetPrizeForm()
  showPrizeModal.value = true
}

const openEditPrizeModal = (prize) => {
  editingPrizeId.value = prize.id
  prizeForm.name = prize.name || ''
  prizeForm.description = prize.description || ''
  prizeForm.icon = prize.icon || '🎁'
  prizeForm.type = prize.type || 'primary'
  prizeForm.weight = Number(prize.weight || 1)
  prizeForm.quantity = Number(prize.quantity || 1)

  showPrizeModal.value = true
}

const closePrizeModal = () => {
  showPrizeModal.value = false
  resetPrizeForm()
}

const savePrize = () => {
  if (!game.value) return

  if (!prizeForm.name.trim()) {
    window.alert('請輸入獎項名稱')
    return
  }

  if (!prizeForm.icon.trim()) {
    window.alert('請輸入獎項圖示')
    return
  }

  if (Number(prizeForm.weight) < 0) {
    window.alert('權重不能小於 0')
    return
  }

  if (Number(prizeForm.quantity) < 0) {
    window.alert('庫存不能小於 0')
    return
  }

  if (isEditing.value) {
    const updatedPrize = updateGamePrize(gameId.value, editingPrizeId.value, {
      name: prizeForm.name,
      description: prizeForm.description,
      icon: prizeForm.icon,
      type: prizeForm.type,
      weight: prizeForm.weight,
      quantity: prizeForm.quantity
    })

    if (!updatedPrize) {
      window.alert('儲存失敗，找不到獎項')
      return
    }

    savedMessage.value = isTemplateGame.value
      ? '自訂模板遊戲獎項已更新，不會影響原始模板。'
      : '獎項已更新，前台獎項列表也會同步變更。'
  } else {
    const newPrize = addGamePrize(gameId.value, {
      name: prizeForm.name,
      description: prizeForm.description,
      icon: prizeForm.icon,
      type: prizeForm.type,
      weight: prizeForm.weight,
      quantity: prizeForm.quantity
    })

    if (!newPrize) {
      window.alert('新增失敗，找不到遊戲')
      return
    }

    savedMessage.value = isTemplateGame.value
      ? '自訂模板遊戲獎項已新增，不會影響原始模板。'
      : '新獎項已新增，前台獎項列表也會同步變更。'
  }

  closePrizeModal()

  setTimeout(() => {
    savedMessage.value = ''
  }, 2500)
}

const removePrize = (prize) => {
  const confirmed = window.confirm(`確定要刪除「${prize.name}」嗎？`)

  if (!confirmed) return

  const success = deleteGamePrize(gameId.value, prize.id)

  if (!success) {
    window.alert('刪除失敗')
    return
  }

  savedMessage.value = isTemplateGame.value
    ? '自訂模板遊戲獎項已刪除，不會影響原始模板。'
    : '獎項已刪除，前台獎項列表也會同步變更。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 2500)
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

          <div class="mt-5 flex flex-wrap gap-2">
            <div class="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-600">
              Admin Game Prizes
            </div>

            <BaseBadge
              v-if="isTemplateGame"
              text="模板遊戲"
              type="info"
            />
          </div>

          <h1 class="mt-4 flex items-center gap-3 text-3xl font-black text-slate-900">
            <span>{{ game.icon }}</span>
            <span>{{ game.name }}｜獎項設定</span>
          </h1>

          <p class="mt-2 text-sm leading-6 text-slate-500">
            編輯此遊戲的獎項名稱、說明、圖示、權重、庫存與預估中獎機率。
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
            class="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-600 transition hover:bg-amber-100"
            @click="goProbabilitySettings"
          >
            機率設定
          </button>

          <button
            type="button"
            class="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
            @click="openAddPrizeModal"
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
      <section
        v-if="isTemplateGame"
        class="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm"
      >
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-lg font-black text-blue-900">
              模板遊戲獎項設定
            </h2>

            <p class="mt-1 text-sm leading-6 text-blue-700">
              你目前正在編輯「{{ game.name }}」的自訂獎項資料，不會影響原始模板「{{ templateGame?.name || game.templateId }}」。
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
                      @click="openEditPrizeModal(prize)"
                    >
                      編輯
                    </button>

                    <button
                      type="button"
                      class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-600 transition hover:bg-rose-100"
                      @click="removePrize(prize)"
                    >
                      刪除
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
        description="請調整搜尋關鍵字，或新增一個獎項。"
      />
    </template>

    <BaseModal
      v-model="showPrizeModal"
      :title="isEditing ? '編輯獎項' : '新增獎項'"
      :description="isTemplateGame ? '這會修改自訂模板遊戲的獎項，不會影響原始模板。' : '新增或修改後會同步出現在前台獎項列表。'"
      size="md"
      :close-on-backdrop="false"
      @close="closePrizeModal"
    >
      <div class="grid gap-5">
        <div
          v-if="isTemplateGame"
          class="rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800"
        >
          目前編輯的是自訂遊戲 ID：{{ gameId }}。原始模板 {{ game.templateId }} 不會被修改。
        </div>

        <div class="grid gap-5 md:grid-cols-[120px_1fr]">
          <div class="rounded-3xl bg-slate-50 p-5 text-center">
            <div class="text-5xl">
              {{ prizeForm.icon || '🎁' }}
            </div>

            <p class="mt-3 text-xs font-black text-slate-400">
              獎項圖示
            </p>
          </div>

          <div class="grid gap-4">
            <div>
              <label class="mb-2 block text-sm font-black text-slate-700">
                獎項名稱
              </label>

              <input
                v-model="prizeForm.name"
                type="text"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="例如：頭獎"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-black text-slate-700">
                圖示
              </label>

              <input
                v-model="prizeForm.icon"
                type="text"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="例如：🏆"
              />
            </div>
          </div>
        </div>

        <div>
          <label class="mb-2 block text-sm font-black text-slate-700">
            獎項說明
          </label>

          <textarea
            v-model="prizeForm.description"
            rows="3"
            class="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            placeholder="請輸入獎項說明"
          />
        </div>

        <div class="grid gap-5 md:grid-cols-3">
          <div>
            <label class="mb-2 block text-sm font-black text-slate-700">
              類型
            </label>

            <select
              v-model="prizeForm.type"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option
                v-for="option in typeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="mb-2 block text-sm font-black text-slate-700">
              權重
            </label>

            <input
              v-model.number="prizeForm.weight"
              type="number"
              min="0"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-black text-slate-700">
              庫存
            </label>

            <input
              v-model.number="prizeForm.quantity"
              type="number"
              min="0"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div class="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          權重越高，中獎機率越高。預估機率會根據目前所有獎項權重自動計算。
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
          @click.stop="closePrizeModal"
        >
          取消
        </button>

        <button
          type="button"
          class="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          @click.stop="savePrize"
        >
          儲存獎項
        </button>
      </template>
    </BaseModal>
  </div>
</template>