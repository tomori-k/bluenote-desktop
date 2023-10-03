<script setup lang="ts">
type Props = {
  modelValue: string | undefined
}
type Emits = {
  (e: 'create-clicked'): void
  (e: 'update:modelValue', v: string | undefined): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="editor-layout">
    <textarea
      type="text"
      placeholder="メモを入力"
      class="note-input"
      :value="props.modelValue"
      @input="(e: any) => emit('update:modelValue', e.target.value)"
    />
    <button
      type="button"
      class="create-button"
      @click="() => emit('create-clicked')"
    >
      追加
    </button>
  </div>
</template>

<style scoped>
.editor-layout {
  display: grid;
  grid-template-columns: 1fr auto;
}

.note-input {
  grid-column: 1/2;
}

.create-button {
  grid-column: 2/3;
}
</style>
