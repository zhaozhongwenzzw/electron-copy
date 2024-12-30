<template>
    <div class="settings-container">
        <Message ref="messageRef" />
        <div class="title-bar">
            <div class="drag-area">
                <button class="back-button" @click="router.back()">
                    <span>←</span>
                </button>
                <span class="title">设置</span>
            </div>
            <div class="window-controls">
                <button class="control-button minimize" @click="minimizeWindow">─</button>
                <button class="control-button close" @click="closeWindow">×</button>
            </div>
        </div>
        <div class="settings-content">
            <div class="settings-section">
                <div class="section-header">
                    <h3>基本设置</h3>
                    <div class="section-actions">
                        <button class="text-button" @click="resetSettings">
                            恢复默认
                        </button>
                        <button class="primary-button" @click="handleSave">
                            保存设置
                        </button>
                    </div>
                </div>
                <div class="setting-item">
                    <span>最大记录数</span>
                    <input type="number" v-model="maxItems" min="10" max="100" step="10" />
                </div>
                <div class="setting-item">
                    <span>快捷键</span>
                    <div class="shortcut-input">
                        <input type="text" :value="displayShortcut" :class="{ recording: isRecording }" readonly
                            @click="startRecording" @blur="stopRecording" @keydown.stop.prevent="handleKeyDown"
                            placeholder="点击设置快捷键" />
                        <button class="reset-button" @click="resetShortcut" title="重置为默认">↺</button>
                    </div>
                </div>
                <div class="setting-item">
                    <span>开机自启</span>
                    <label class="switch">
                        <input type="checkbox" v-model="autoStart" />
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="setting-item">
                    <span>主题设置</span>
                    <div class="theme-selector">
                        <button v-for="t in themes" :key="t.value"
                            :class="['theme-button', { active: theme === t.value }]"
                            @click="setTheme(t.value as ThemeType)">
                            {{ t.label }}
                        </button>
                    </div>
                </div>
            </div>
            <div class="settings-section">
                <div class="section-header">
                    <h3>数据管理</h3>
                </div>
                <div class="danger-zone">
                    <div class="zone-content">
                        <div class="zone-info">
                            <h4>清空历史记录</h4>
                            <p>此操作将永久删除所有剪贴板历史记录</p>
                        </div>
                        <button class="danger-button" @click="clearHistory">
                            清空记录
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSetting, ThemeType } from '@renderer/hooks/setting'
import Message from '@renderer/components/Message.vue'

const router = useRouter()
const { maxItems, shortcut, autoStart, theme, loadConfig, saveConfig } = useSetting()
const messageRef = ref<InstanceType<typeof Message> | null>(null)
const isRecording = ref(false)
const pressedKeys = ref<string[]>([])

const displayShortcut = computed(() => {
    if (isRecording.value) {
        return pressedKeys.value.length ? pressedKeys.value.join('+') : '请按下快捷键...'
    }
    return shortcut.value
})

const startRecording = (): void => {
    isRecording.value = true
    pressedKeys.value = []
}

const stopRecording = (): void => {
    isRecording.value = false
    if (pressedKeys.value.length) {
        shortcut.value = pressedKeys.value.join('+')
    }
}

const handleKeyDown = (e: KeyboardEvent): void => {
    if (!isRecording.value) return

    pressedKeys.value = []

    // 添加修饰键
    if (e.ctrlKey) pressedKeys.value.push('CommandOrControl')
    if (e.shiftKey) pressedKeys.value.push('Shift')
    if (e.altKey) pressedKeys.value.push('Alt')
    if (e.metaKey) pressedKeys.value.push('CommandOrControl')

    // 添加主键
    const key = e.key.toUpperCase()
    if (!['CONTROL', 'SHIFT', 'ALT', 'META'].includes(key)) {
        pressedKeys.value.push(key)
    }

    // 如果按下了 Escape，取消录制
    if (e.key === 'Escape') {
        isRecording.value = false
        pressedKeys.value = shortcut.value.split('+')
        return
    }

    // 如果组合键完整，自动停止录制
    if (pressedKeys.value.length >= 2) {
        setTimeout(() => {
            stopRecording()
        }, 500)
    }
}

const resetShortcut = (): void => {
    shortcut.value = 'CommandOrControl+Shift+I'
    messageRef.value?.show('已重置为默认快捷键')
}

// 主题相关
const themes = [
    { label: '浅色', value: 'light' },
    { label: '深色', value: 'dark' },
    { label: '跟随系统', value: 'system' }
]

const setTheme = (value: ThemeType): void => {
    theme.value = value
}

// 修改保存配置函数
const handleSave = async (): Promise<void> => {
    const success = await saveConfig()
    if (success) {
        messageRef.value?.show('设置已保存')
    } else {
        messageRef.value?.show('保存失败', 'error')
    }
}

// 清空历史记录
const clearHistory = async (): Promise<void> => {
    if (confirm('确定要清空所有历史记录吗？')) {
        await window.electron.windowApi.clearClipboardHistory()
        messageRef.value?.show('历史记录已清空')
    }
}

// 恢复默认设置
const resetSettings = async (): Promise<void> => {
    if (confirm('确定要恢复默认设置吗？')) {
        maxItems.value = 30
        shortcut.value = 'CommandOrControl+Shift+I'
        autoStart.value = false
        theme.value = 'system'
        await saveConfig()
        messageRef.value?.show('已恢复默认设置')
    }
}

onMounted(() => {
    loadConfig()
})

const minimizeWindow = (): void => {
    window.electron.windowApi.minimize()
}

const closeWindow = (): void => {
    window.electron.windowApi.close()
}

</script>

<style scoped>
.settings-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
}

.title-bar {
    height: 32px;
    -webkit-app-region: drag;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.drag-area {
    flex: 1;
    padding: 0 12px;
    display: flex;
    align-items: center;
}

.title {
    font-size: 13px;
    color: #666;
}

.window-controls {
    display: flex;
    -webkit-app-region: no-drag;
    gap: 1px;
}

.control-button {
    width: 46px;
    height: 32px;
    border: none;
    background: transparent;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 16px;
}

.control-button.minimize {
    font-size: 14px;
    line-height: 32px;
}

.control-button.close {
    font-size: 18px;
    line-height: 32px;
}

.control-button:hover {
    background: rgba(0, 0, 0, 0.1);
}

.control-button.close:hover {
    background: #e81123;
    color: white;
}

.back-button {
    border: none;
    background: none;
    font-size: 18px;
    color: #666;
    cursor: pointer;
    padding: 4px 8px;
    margin-right: 8px;
    border-radius: 6px;
    transition: all 0.2s;
    -webkit-app-region: no-drag;
}

.back-button:hover {
    background: rgba(0, 0, 0, 0.1);
}

.settings-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

.settings-section {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.settings-section h3 {
    margin: 0 0 16px;
    color: #333;
    font-size: 16px;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.setting-item:last-child {
    border-bottom: none;
}

.setting-item span {
    color: #666;
}

.setting-item input[type="number"],
.setting-item input[type="text"] {
    width: 120px;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 6px;
    outline: none;
    transition: all 0.3s;
}

.setting-item input:focus {
    border-color: #4a9eff;
    box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
}

.switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 24px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}

input:checked+.slider {
    background-color: #4a9eff;
}

input:checked+.slider:before {
    transform: translateX(20px);
}

.button-group {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.save-button {
    background: #4a9eff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
}

.save-button:hover {
    background: #3d8be6;
}

.danger-button {
    background: #ff3b30;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
}

.danger-button:hover {
    background: #ff2d20;
}

.shortcut-input {
    display: flex;
    gap: 8px;
    align-items: center;
}

.shortcut-input input {
    width: fit-content !important;
    text-align: center;
}

.shortcut-input input::placeholder {
    color: #888;
    font-style: italic;
    opacity: 0.7;
}

.shortcut-input input.recording {
    color: #888;
    opacity: 0.7;
    background: #f0f9ff;
    border-color: #4a9eff;
    box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
}

.reset-button {
    width: 28px;
    height: 28px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: transparent;
    color: #666;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
}

.reset-button:hover {
    border-color: #4a9eff;
    color: #4a9eff;
    background: rgba(74, 158, 255, 0.1);
}

/* 主题选择器样式 */
.theme-selector {
    display: flex;
    gap: 8px;
}

.theme-button {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: white;
    color: #666;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 13px;
}

.theme-button:hover {
    border-color: #4a9eff;
    color: #4a9eff;
    background: rgba(74, 158, 255, 0.1);
}

.theme-button.active {
    background: #4a9eff;
    color: white;
    border-color: #4a9eff;
}

.warning-button {
    background: #ff9500;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
}

.warning-button:hover {
    background: #ff8500;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.section-actions {
    display: flex;
    gap: 8px;
}

.text-button {
    padding: 6px 12px;
    border: none;
    background: transparent;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;
    border-radius: 6px;
}

.text-button:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #333;
}

.primary-button {
    padding: 6px 12px;
    border: none;
    background: #4a9eff;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;
    border-radius: 6px;
}

.primary-button:hover {
    background: #3d8be6;
}

.danger-zone {
    margin-top: 16px;
    padding: 16px;
    border: 1px solid #ffcdd2;
    border-radius: 8px;
    background: #fff5f5;
}

.zone-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
}

.zone-info {
    flex: 1;
    min-width: 0;
}

.zone-info h4 {
    margin: 0 0 4px;
    color: #333;
    font-size: 14px;
}

.zone-info p {
    margin: 0;
    color: #666;
    font-size: 13px;
}

.danger-button {
    flex-shrink: 0;
    padding: 8px 16px;
    border: none;
    background: #ff3b30;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;
    border-radius: 6px;
    white-space: nowrap;
}

.danger-button:hover {
    background: #ff2d20;
}
</style>