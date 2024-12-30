<template>
    <Transition name="fade">
        <div v-if="visible" class="message" :class="type">
            {{ content }}
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const content = ref('')
const type = ref('success')

const show = (text: string, messageType = 'success'): void => {
    content.value = text
    type.value = messageType
    visible.value = true
    setTimeout(() => {
        visible.value = false
    }, 2000)
}

defineExpose({ show })
</script>

<style scoped>
.message {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 1000;
    transition: all 0.3s;
    backdrop-filter: blur(10px);
}

.success {
    background: rgba(59, 179, 70, 0.9);
    color: white;
}

.error {
    background: rgba(255, 59, 48, 0.9);
    color: white;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translate(-50%, -20px);
}
</style>