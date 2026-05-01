<script setup>
defineProps({
  steps: {
    type: Array,
    default: () => []
  },
  currentStep: {
    type: Number,
    default: 1
  },
  clickable: {
    type: Boolean,
    default: false
  },
  direction: {
    type: String,
    default: 'horizontal'
  }
})

defineEmits(['change'])

const getStepStatus = (stepNumber, currentStep) => {
  if (stepNumber < currentStep) return 'done'
  if (stepNumber === currentStep) return 'active'
  return 'pending'
}

const statusClassMap = {
  done: {
    circle: 'border-emerald-500 bg-emerald-500 text-white',
    title: 'text-emerald-700',
    line: 'bg-emerald-500'
  },
  active: {
    circle: 'border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100',
    title: 'text-blue-700',
    line: 'bg-slate-200'
  },
  pending: {
    circle: 'border-slate-300 bg-white text-slate-400',
    title: 'text-slate-400',
    line: 'bg-slate-200'
  }
}
</script>

<template>
  <div
    class="w-full"
    :class="direction === 'vertical' ? 'space-y-4' : ''"
  >
    <div
      class="flex"
      :class="direction === 'vertical' ? 'flex-col gap-4' : 'items-start'"
    >
      <div
        v-for="(step, index) in steps"
        :key="step.value || index"
        class="relative flex"
        :class="direction === 'vertical' ? 'items-start gap-3' : 'flex-1 flex-col items-center'"
      >
        <button
          type="button"
          class="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition"
          :class="[
            statusClassMap[getStepStatus(index + 1, currentStep)].circle,
            clickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'
          ]"
          :disabled="!clickable"
          @click="$emit('change', index + 1)"
        >
          <template v-if="getStepStatus(index + 1, currentStep) === 'done'">
            ✓
          </template>

          <template v-else>
            {{ index + 1 }}
          </template>
        </button>

        <div
          class="min-w-0"
          :class="direction === 'vertical' ? 'pb-2' : 'mt-3 text-center'"
        >
          <p
            class="text-sm font-bold"
            :class="statusClassMap[getStepStatus(index + 1, currentStep)].title"
          >
            {{ step.title }}
          </p>

          <p
            v-if="step.description"
            class="mt-1 text-xs leading-5 text-slate-400"
          >
            {{ step.description }}
          </p>
        </div>

        <div
          v-if="index < steps.length - 1"
          class="absolute"
          :class="[
            direction === 'vertical'
              ? 'left-4 top-10 h-[calc(100%+1rem)] w-0.5'
              : 'left-1/2 top-4 h-0.5 w-full',
            statusClassMap[getStepStatus(index + 1, currentStep)].line
          ]"
        />
      </div>
    </div>
  </div>
</template>