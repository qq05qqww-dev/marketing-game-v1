<script setup>
const props = defineProps({
  status: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'sm'
  }
})

const getStatusValue = () => {
  return String(props.status || '').toUpperCase()
}

const getDisplayLabel = () => {
  if (props.label) return props.label

  const status = getStatusValue()

  if (status === 'ACTIVE') return 'ACTIVE'
  if (status === 'DRAFT') return 'DRAFT'
  if (status === 'INACTIVE') return 'INACTIVE'
  if (status === 'ENDED') return 'ENDED'

  if (status === 'UNUSED') return '未使用'
  if (status === 'USED') return '已核銷'
  if (status === 'EXPIRED') return '已過期 / 作廢'

  if (status === 'PLAYABLE') return '可遊玩'
  if (status === 'LOGIN') return '需要登入'
  if (status === 'LIMITED') return '會員限制'
  if (status === 'LOCKED') return '不可遊玩'

  return status || '未設定'
}

const getDisplayIcon = () => {
  if (props.icon) return props.icon

  const status = getStatusValue()

  if (status === 'ACTIVE') return '🟢'
  if (status === 'DRAFT') return '⚪'
  if (status === 'INACTIVE') return '🟡'
  if (status === 'ENDED') return '🔴'

  if (status === 'UNUSED') return '🎁'
  if (status === 'USED') return '✅'
  if (status === 'EXPIRED') return '⏰'

  if (status === 'PLAYABLE') return '✅'
  if (status === 'LOGIN') return '🔐'
  if (status === 'LIMITED') return '⭐'
  if (status === 'LOCKED') return '🔒'

  return ''
}

const getBadgeClass = () => {
  const status = getStatusValue()

  if (status === 'ACTIVE' || status === 'PLAYABLE' || status === 'USED') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'DRAFT') {
    return 'border-slate-200 bg-slate-50 text-slate-700'
  }

  if (status === 'INACTIVE' || status === 'UNUSED' || status === 'LOGIN' || status === 'LIMITED') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (status === 'ENDED' || status === 'EXPIRED' || status === 'LOCKED') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700'
}

const getSizeClass = () => {
  if (props.size === 'md') {
    return 'px-4 py-2 text-sm'
  }

  if (props.size === 'lg') {
    return 'px-5 py-2.5 text-base'
  }

  return 'px-3 py-1 text-xs'
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full border font-black"
    :class="[getBadgeClass(), getSizeClass()]"
  >
    <span v-if="getDisplayIcon()">
      {{ getDisplayIcon() }}
    </span>

    <span>
      {{ getDisplayLabel() }}
    </span>
  </span>
</template>