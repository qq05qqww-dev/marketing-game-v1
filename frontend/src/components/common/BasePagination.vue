<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  },
  total: {
    type: Number,
    default: 0
  },
  showTotal: {
    type: Boolean,
    default: true
  },
  showPageSize: {
    type: Boolean,
    default: true
  },
  pageSizeOptions: {
    type: Array,
    default: () => [10, 20, 50, 100]
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:page', 'update:pageSize', 'change'])

const totalPages = computed(() => {
  if (!props.pageSize || props.pageSize <= 0) return 1

  const pages = Math.ceil(props.total / props.pageSize)

  return pages > 0 ? pages : 1
})

const startItem = computed(() => {
  if (props.total <= 0) return 0

  return (props.page - 1) * props.pageSize + 1
})

const endItem = computed(() => {
  if (props.total <= 0) return 0

  const result = props.page * props.pageSize

  return result > props.total ? props.total : result
})

const canPrev = computed(() => props.page > 1 && !props.disabled)
const canNext = computed(() => props.page < totalPages.value && !props.disabled)

const pageNumbers = computed(() => {
  const pages = []
  const maxVisible = 5

  let start = Math.max(1, props.page - 2)
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i += 1) {
    pages.push(i)
  }

  return pages
})

const changePage = (nextPage) => {
  if (props.disabled) return
  if (nextPage < 1) return
  if (nextPage > totalPages.value) return
  if (nextPage === props.page) return

  emit('update:page', nextPage)
  emit('change', {
    page: nextPage,
    pageSize: props.pageSize
  })
}

const changePageSize = (event) => {
  if (props.disabled) return

  const nextPageSize = Number(event.target.value)

  emit('update:pageSize', nextPageSize)
  emit('update:page', 1)
  emit('change', {
    page: 1,
    pageSize: nextPageSize
  })
}
</script>

<template>
  <div class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <p
        v-if="showTotal"
        class="text-sm text-slate-500"
      >
        共
        <span class="font-semibold text-slate-700">{{ total }}</span>
        筆資料，
        顯示
        <span class="font-semibold text-slate-700">{{ startItem }}</span>
        -
        <span class="font-semibold text-slate-700">{{ endItem }}</span>
        筆
      </p>

      <label
        v-if="showPageSize"
        class="flex items-center gap-2 text-sm text-slate-500"
      >
        每頁

        <select
          :value="pageSize"
          :disabled="disabled"
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          @change="changePageSize"
        >
          <option
            v-for="option in pageSizeOptions"
            :key="option"
            :value="option"
          >
            {{ option }}
          </option>
        </select>

        筆
      </label>
    </div>

    <div class="flex items-center justify-end gap-2">
      <button
        type="button"
        class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:hover:border-slate-200"
        :disabled="!canPrev"
        @click="changePage(page - 1)"
      >
        上一頁
      </button>

      <button
        v-for="item in pageNumbers"
        :key="item"
        type="button"
        class="hidden h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition sm:inline-flex sm:items-center sm:justify-center"
        :class="item === page
          ? 'bg-blue-600 text-white shadow-sm'
          : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
        "
        :disabled="disabled"
        @click="changePage(item)"
      >
        {{ item }}
      </button>

      <span class="px-2 text-sm font-semibold text-slate-500 sm:hidden">
        {{ page }} / {{ totalPages }}
      </span>

      <button
        type="button"
        class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:hover:border-slate-200"
        :disabled="!canNext"
        @click="changePage(page + 1)"
      >
        下一頁
      </button>
    </div>
  </div>
</template>