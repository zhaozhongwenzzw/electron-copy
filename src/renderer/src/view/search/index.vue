<template>
    <div class="search-window" :class="{ 'dark-theme': theme === 'dark' }">
        <Message ref="messageRef" />
        <div class="title-bar">
            <div class="drag-area">
                <span class="title">历史剪贴板</span>
                <div class="drag-space"></div>
            </div>
            <div class="window-controls">
                <button class="control-button theme-toggle" @click="toggleTheme"
                    :title="theme === 'dark' ? '切换亮色' : '切换暗色'">
                    <span>{{ theme ? '🌞' : '🌙' }}</span>
                </button>
                <button class="control-button settings" @click="openSettings" title="设置">
                    <span>⚙️</span>
                </button>
                <button class="control-button minimize" @click="minimizeWindow">─</button>
                <button class="control-button close" @click="closeWindow">×</button>
            </div>
        </div>
        <div class="content-container">
            <div class="search-header">
                <div class="search-box">
                    <div class="search-icon">🔍</div>
                    <input ref="searchInputRef" v-model="searchText" type="text" placeholder="搜索或选择内容..."
                        class="search-input" @input="handleSearch" @keydown.down.prevent="navigateDown"
                        @keydown.up.prevent="navigateUp" @keydown.enter="selectCurrent" @keydown.esc="closeWindow" />
                    <div class="search-actions" v-if="searchText">
                        <button class="action-btn copy" @click="copyText">
                            <span>复制</span>
                        </button>
                        <button class="action-btn clear" @click="clearSearch">
                            <span>✕</span>
                        </button>
                    </div>
                </div>
                <div class="category-bar">
                    <div class="category-tabs">
                        <button class="category-tab active" title="显示所有记录">
                            <span class="tab-icon">📋</span>
                            <span class="tab-text">全部</span>
                            <span class="tab-count">{{ options.length }}</span>
                        </button>
                        <button class="category-tab" title="仅显示常用类型">
                            <span class="tab-icon">⭐</span>
                            <span class="tab-text">常用</span>
                            <span class="tab-count">{{ commonCount }}</span>
                        </button>
                    </div>
                </div>
                <div v-show="filteredOptions.length" class="select-container">
                    <div class="select-wrapper">
                        <div v-for="(option, index) in visibleOptions" :key="option.text + option.timestamp"
                            class="select-option" :class="{ 'active': isOptionActive(index) }"
                            @click="handleOptionClick(option, index)">
                            <div class="option-content">
                                <span class="option-text">{{ option.text }}</span>
                                <span class="option-desc">{{ option.description }}</span>
                            </div>
                            <div class="option-actions">
                                <button class="copy-btn" @click.stop="copyOptionText(option)">复制</button>
                                <button class="delete-btn" @click.stop="deleteOption(index)">✕</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="!filteredOptions.length" class="empty-state">
                    <div class="empty-animation">
                        <div class="circle"></div>
                        <div class="clipboard-icon">📋</div>
                    </div>
                    <h3 class="empty-title">暂无复制记录</h3>
                    <p class="empty-desc">复制一些内容就会在这里显示哦~</p>
                </div>
            </div>
            <div class="results-container">
                <div v-show="filteredOptions.length" class="select-container">
                    <div class="select-wrapper">
                        <!-- ... 选项列表内容 ... -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import Message from '@renderer/components/Message.vue'
import { useRouter } from 'vue-router'
import { useSetting } from '@renderer/hooks/setting'

const { theme, loadConfig, saveConfig } = useSetting()
interface Option {
    text: string
    description: string
    timestamp?: number
    virtualIndex?: number
}

const searchText = ref('')
const selectedIndex = ref(0)
const options = ref<Option[]>([])

const VISIBLE_ITEMS = 20
const BUFFER_ITEMS = 10

// 计算可见选项
const visibleOptions = computed(() => {
    const start = Math.max(selectedIndex.value - BUFFER_ITEMS, 0)
    const end = Math.min(start + VISIBLE_ITEMS, filteredOptions.value.length)
    return filteredOptions.value.slice(start, end).map((option, index) => ({
        ...option,
        virtualIndex: start + index // 添加虚拟索引
    }))
})

// 判断选项是否被选中
const isOptionActive = (index: number): boolean => {
    const virtualIndex = Math.max(selectedIndex.value - BUFFER_ITEMS, 0) + index
    return virtualIndex === selectedIndex.value
}

// 封装滚动处理函数
const scrollToSelected = (): void => {
    nextTick(() => {
        const element = document.querySelector('.select-option.active')
        const container = document.querySelector('.select-container')

        if (element && container) {
            const elementRect = element.getBoundingClientRect()
            const containerRect = container.getBoundingClientRect()

            const isElementBelow = elementRect.bottom > containerRect.bottom
            const isElementAbove = elementRect.top < containerRect.top

            if (isElementBelow || isElementAbove) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: isElementBelow ? 'end' : 'start'
                })
            }
        }
    })
}

// 更新选项列表
const updateClipboardHistory = (items: Array<{ text: string; timestamp: number }>): void => {
    // 用 requestAnimationFrame 优化渲染性能
    requestAnimationFrame(() => {
        options.value = items.map(item => ({
            text: new Date(item.timestamp).toLocaleTimeString(),
            description: item.text
        }))
    })
}

const filteredOptions = computed(() => {
    if (!searchText.value) return options.value
    const query = searchText.value.toLowerCase()
    return options.value.filter(option =>
        option.text.toLowerCase().includes(query) ||
        option.description.toLowerCase().includes(query)
    )
})

const handleSearch = (): void => {
    selectedIndex.value = 0
}

const navigateDown = (): void => {
    if (selectedIndex.value < filteredOptions.value.length - 1) {
        selectedIndex.value++
        scrollToSelected()
    }
}

const navigateUp = (): void => {
    if (selectedIndex.value > 0) {
        selectedIndex.value--
        scrollToSelected()
    }
}

const selectCurrent = (): void => {
    if (filteredOptions.value[selectedIndex.value]) {
        selectOption(filteredOptions.value[selectedIndex.value])
    }
}

const copyText = async (): Promise<void> => {
    try {
        window.electron.windowApi.markUserCopy()
        await navigator.clipboard.writeText(searchText.value)
        messageRef.value?.show('复制成功')
    } catch (err) {
        messageRef.value?.show('复制失败', 'error')
    }
}

const copyOptionText = async (option: Option): Promise<void> => {
    try {
        window.electron.windowApi.markUserCopy()
        await navigator.clipboard.writeText(option.description)
        messageRef.value?.show('复制成功')
    } catch (err) {
        messageRef.value?.show('复制失败', 'error')
    }
}

const selectOption = (option: Option): void => {
    searchText.value = option.description
}

const clearSearch = (): void => {
    searchText.value = ''
}

const deleteOption = (index: number): void => {
    const virtualIndex = Math.max(selectedIndex.value - BUFFER_ITEMS, 0) + index
    options.value.splice(virtualIndex, 1)
    messageRef.value?.show('删除成功')
    window.electron.windowApi.deleteClipboardItem(virtualIndex)

    // 调整选中索引
    if (selectedIndex.value >= options.value.length) {
        selectedIndex.value = Math.max(0, options.value.length - 1)
    }
}

const minimizeWindow = (): void => {
    window.electron.windowApi.minimize()
}

const closeWindow = (): void => {
    window.electron.windowApi.close()
}

const messageRef = ref<InstanceType<typeof Message> | null>(null)

const searchInputRef = ref<HTMLInputElement | null>(null)

const focusSearchInput = (): void => {
    nextTick(() => {
        searchInputRef.value?.focus()
    })
}

const loadClipboardHistory = async (): Promise<void> => {
    console.log('加载剪贴板内容')
    const items = await window.electron.windowApi.getClipboardHistory()
    updateClipboardHistory(items)
}

const router = useRouter()

const openSettings = (): void => {
    router.push('/settings')
}

// 计算常用类型的数量
const commonCount = computed(() => {
    return options.value.filter(option =>
        /^[a-zA-Z0-9\s,.!?]+$/.test(option.description) || // 纯文本和数字
        /^https?:\/\//.test(option.description) || // 网址
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(option.description) // 邮箱
    ).length
})

// 处理选项点击
const handleOptionClick = (option: Option, index: number): void => {
    // 更新选中索引
    const virtualIndex = Math.max(selectedIndex.value - BUFFER_ITEMS, 0) + index
    selectedIndex.value = virtualIndex

    // 复制文本
    copyOptionText(option)
}


const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    saveConfig()
}

onMounted(() => {
    loadConfig()
    loadClipboardHistory()
    // 监听窗口显示事件
    window.electron.windowApi.onWindowShow(loadClipboardHistory)

    // 监听数据改变
    window.electron.windowApi.onRefreshData(loadClipboardHistory)

    // 聚焦搜索框
    focusSearchInput()
})
</script>

<style scoped>
/* 基础变量 - 亮色主题 */
.search-window {
    --primary-color: #2563eb;
    --secondary-color: #7c3aed;
    --bg-color: rgba(255, 255, 255, 0.95);
    --title-bar-bg: rgba(255, 255, 255, 0.85);
    --title-text-color: rgba(255, 255, 255, 0.95);
    --text-color: #374151;
    --text-secondary: #6b7280;
    --border-color: rgba(0, 0, 0, 0.06);
    --hover-bg: rgba(37, 99, 235, 0.08);
    --active-bg: rgba(37, 99, 235, 0.12);
    --shadow-color: rgba(0, 0, 0, 0.08);
    --title-btn-color: #d0d0d0;
    --title-btn-hover: #f5f5f5;
    --search-bg: rgba(255, 255, 255, 0.8);
    --search-text: #374151;
    --search-placeholder: #9ca3af;
    --search-border: rgba(0, 0, 0, 0.08);
    --search-focus-shadow: rgba(37, 99, 235, 0.2);
}

/* 暗色主题变量 */
.search-window.dark-theme {
    --primary-color: #60a5fa;
    --secondary-color: #a78bfa;
    --bg-color: rgba(17, 24, 39, 0.95);
    --title-bar-bg: rgba(15, 23, 42, 0.85);
    --title-text-color: rgba(255, 255, 255, 0.95);
    --text-color: #f3f4f6;
    --text-secondary: #9ca3af;
    --border-color: rgba(255, 255, 255, 0.08);
    --hover-bg: rgba(96, 165, 250, 0.15);
    --active-bg: rgba(96, 165, 250, 0.2);
    --shadow-color: rgba(0, 0, 0, 0.25);
    --title-btn-color: #d1d5db;
    --title-btn-hover: #f3f4f6;
    --search-bg: rgba(30, 41, 59, 0.8);
    --search-text: #e5e7eb;
    --search-placeholder: #9ca3af;
    --search-border: rgba(255, 255, 255, 0.1);
    --search-focus-shadow: rgba(96, 165, 250, 0.3);
}

.search-window {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-color);
    backdrop-filter: blur(10px);
    overflow: hidden;
    transition: all 0.3s ease;
}

.content-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.search-header {
    padding: 10px;
    background: var(--bg-color);
    backdrop-filter: blur(10px);
    z-index: 100;
}

.results-container {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
}


.search-box {
    margin: 0 auto;
    position: relative;
    display: flex;
    align-items: center;
    background: var(--search-bg);
    border-radius: 8px;
    backdrop-filter: blur(10px);
    border: 1px solid var(--search-border);
    transition: all 0.3s ease;
    margin-bottom: 8px;
}

.search-box:focus-within {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--search-focus-shadow);
}

.select-container {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 100vw;
    background: var(--bg-color);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 4px 20px var(--shadow-color);
    max-height: calc(100vh - 180px);
    overflow-y: auto;
    transition: all 0.3s ease;
    box-sizing: border-box;
}

.select-wrapper {
    overscroll-behavior: contain;
    scroll-snap-type: y proximity;
}

.select-container:hover::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
}

/* 默认隐藏滚动条 */
.select-container::-webkit-scrollbar {
    width: 4px;
}

.select-container::-webkit-scrollbar-track {
    background: transparent;
}

.select-container::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 4px;
    transition: background-color 0.3s ease;
}

.select-option {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 1px solid var(--border-color);
    min-width: 0;
}

.select-option:last-child {
    border-bottom: none;
}

.select-option:hover,
.select-option.active {
    background: var(--hover-bg);
}

.copy-btn {
    padding: 4px 12px;
    border: 1px solid var(--primary-color);
    border-radius: 4px;
    background: transparent;
    color: var(--primary-color);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
    flex-shrink: 0;
    white-space: nowrap;
}

.copy-btn:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.search-input {
    flex: 1;
    padding: 16px 0;
    font-size: 16px;
    border: none;
    outline: none;
    background: transparent;
    color: var(--search-text);
}

.search-input::placeholder {
    color: var(--search-placeholder);
}

.search-icon {
    padding: 0 15px;
    font-size: 20px;
    color: rgba(0, 0, 0, 0.6);
}

.action-btn {
    border: none;
    background: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
    font-size: 12px;
}

.action-btn.copy {
    color: var(--primary-color);
}

.action-btn.clear {
    color: rgba(0, 0, 0, 0.4);
}

.action-btn:hover {
    background: var(--hover-bg);
}

.option-text {
    font-size: 14px;
    color: var(--text-color);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.option-desc {
    font-size: 13px;
    color: var(--text-secondary);
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.option-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-right: 12px;
    min-width: 0;
    overflow: hidden;
}

.option-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    opacity: 0;
    transition: opacity 0.2s;
    flex-shrink: 0;
}

.select-option:hover .option-actions,
.select-option.active .option-actions {
    opacity: 1;
}

.copy-btn,
.delete-btn {
    padding: 4px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
    flex-shrink: 0;
    white-space: nowrap;
}

.copy-btn {
    border: 1px solid var(--primary-color);
    background: transparent;
    color: var(--primary-color);
}

.copy-btn:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.delete-btn {
    border: 1px solid rgba(255, 59, 48, 0.5);
    background: transparent;
    color: #ff3b30;
    padding: 4px 8px;
}

.delete-btn:hover {
    background: #ff3b30;
    color: white;
    border-color: #ff3b30;
}

.title-bar {
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--title-bar-bg);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border-color);
    position: relative;
    overflow: hidden;
}

/* 渐变背景 */
.title-bar::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg,
            var(--primary-color),
            var(--secondary-color) 30%,
            var(--secondary-color) 70%,
            var(--primary-color));
    z-index: 0;
}

/* 底部效果 */
.title-bar::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
            transparent,
            var(--primary-color),
            var(--secondary-color),
            transparent);
}

.drag-area {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 0 12px;
    -webkit-app-region: drag;
}

.drag-space {
    flex: 1;
    height: 100%;
    -webkit-app-region: drag;
}

.window-controls {
    display: flex;
    gap: 1px;
    -webkit-app-region: no-drag;
}

.title {
    font-size: 13px;
    color: var(--title-text-color);
    font-weight: 500;
    position: relative;
    padding: 4px 0;
}

/* 标题下划线动画 */
.title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    transform: scaleX(0);
    transition: transform 0.3s ease;
    transform-origin: left;
}

.title-bar:hover .title::after {
    transform: scaleX(1);
}

.control-button {
    width: 46px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--title-btn-color);
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

/* 按钮悬浮效果 */
.control-button::before {
    content: '';
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
}

.control-button:hover::before {
    transform: translateX(100%);
}

.control-button.minimize {
    font-size: 16px;
    color: var(--title-btn-color);
}

.control-button.minimize:hover {
    color: var(--title-btn-hover);
}

.control-button.close {
    font-size: 18px;
    color: var(--title-btn-color);
}

.control-button.close:hover {
    background: linear-gradient(120deg, #ff3b30, #ff2d55);
    color: white;
}

.control-button.settings {
    font-size: 16px;
    opacity: 0.7;
    color: var(--title-btn-color);
}

.control-button.settings:hover {
    opacity: 1;
    color: var(--title-btn-hover);
}

.control-button.settings span {
    display: inline-block;
    transition: transform 0.3s ease;
}

.control-button.settings:hover span {
    transform: rotate(90deg);
}

/* 标题栏入场动画 */
@keyframes slideInDown {
    from {
        transform: translateY(-100%);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.title-bar {
    animation: slideInDown 0.3s ease-out;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    text-align: center;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    margin: 20px auto;
}

.empty-animation {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 20px;
}

.circle {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 2px solid transparent;
    border-radius: 50%;
    animation: rotateGradient 3s linear infinite;
}

.circle::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    padding: 2px;
    background: linear-gradient(45deg,
            transparent 40%,
            var(--primary-color),
            var(--secondary-color),
            transparent 60%);
    -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
    mask-composite: exclude;
    animation: spinGradient 4s linear infinite;
}

.circle::after {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    padding: 2px;
    background: linear-gradient(-45deg,
            transparent 40%,
            var(--secondary-color),
            var(--primary-color),
            transparent 60%);
    -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
    mask-composite: exclude;
    animation: spinGradient 4s linear infinite reverse;
}

.clipboard-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 36px;
    filter: drop-shadow(0 0 8px var(--primary-color));
    animation: pulseIcon 2s ease-in-out infinite;
    z-index: 1;
}

.empty-title {
    font-size: 18px;
    font-weight: 500;
    margin: 0 0 8px;
    background: linear-gradient(135deg,
            var(--primary-color),
            var(--secondary-color),
            var(--primary-color));
    background-size: 200% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradientFlow 3s linear infinite;
}

.empty-desc {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
    opacity: 0;
    animation: fadeInDelay 0.5s ease-out forwards 0.3s;
}

@keyframes rotateGradient {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

@keyframes spinGradient {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

@keyframes pulseIcon {

    0%,
    100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 0.9;
    }

    50% {
        transform: translate(-50%, -50%) scale(1.1);
        opacity: 1;
    }
}

@keyframes gradientFlow {
    0% {
        background-position: 0% 50%;
    }

    100% {
        background-position: 200% 50%;
    }
}

@keyframes fadeInDelay {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 0.8;
        transform: translateY(0);
    }
}

/* 整体淡入效果 */
.empty-state {
    padding: 40px 20px;
    text-align: center;
    animation: fadeInUp 0.5s ease-out;
    background: radial-gradient(circle at center,
            var(--bg-color),
            transparent);
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.control-button.settings {
    position: relative;
    font-size: 16px;
    line-height: 32px;
    opacity: 0.7;
    transition: opacity 0.3s ease;
}

.control-button.settings::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: transparent;
    transition: background-color 0.3s ease;
}

.control-button.settings:hover {
    opacity: 1;
}

.control-button.settings:hover::before {
    background: rgba(0, 106, 255, 0.1);
}

.control-button.settings>span {
    position: relative;
    z-index: 1;
    display: inline-block;
    transition: transform 0.3s ease;
}

.control-button.settings:hover>span {
    transform: rotate(30deg);
}

.category-bar {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-color);
    backdrop-filter: blur(10px);
}

.category-tabs {
    display: flex;
    gap: 8px;
    justify-content: center;
}

.category-tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-color);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    overflow: hidden;
}

.category-tab::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(74, 158, 255, 0.1);
    transform: translateY(100%);
    transition: transform 0.3s ease;
}

.category-tab:hover::before {
    transform: translateY(0);
}

.category-tab.active::before {
    transform: translateY(0);
    background: rgba(74, 158, 255, 0.15);
}

.category-tab>* {
    position: relative;
    z-index: 1;
}

.tab-icon {
    font-size: 14px;
    transition: transform 0.3s ease;
}

.category-tab:hover .tab-icon {
    transform: scale(1.1);
}

.tab-text {
    line-height: 1;
    font-weight: 500;
    transition: color 0.2s ease;
}

.tab-count {
    background: rgba(0, 0, 0, 0.06);
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 11px;
    min-width: 20px;
    text-align: center;
    transition: all 0.3s ease;
}

.category-tab:hover .tab-count {
    background: rgba(74, 158, 255, 0.1);
    color: var(--primary-color);
}

.category-tab.active {
    color: var(--primary-color);
}

.category-tab.active .tab-count {
    background: rgba(74, 158, 255, 0.2);
    color: var(--primary-color);
}

@keyframes countChange {
    0% {
        transform: translateY(-100%);
        opacity: 0;
    }

    100% {
        transform: translateY(0);
        opacity: 1;
    }
}

.tab-count {
    animation: countChange 0.3s ease-out;
}

/* 动画效果 */
@keyframes glow {

    0%,
    100% {
        box-shadow: 0 0 5px var(--primary-color);
    }

    50% {
        box-shadow: 0 0 20px var(--primary-color);
    }
}

.search-box:focus-within {
    animation: glow 2s ease-in-out infinite;
}

/* 控制按钮样式 */
.control-button {
    color: var(--title-btn-color);
    transition: all 0.3s ease;
}

.control-button:hover {
    color: var(--title-btn-hover);
    background: var(--hover-bg);
}

.control-button.theme-toggle {
    font-size: 16px;
    opacity: 0.9;
    color: var(--title-btn-color);
}

.control-button.theme-toggle:hover {
    opacity: 1;
    color: var(--title-btn-hover);
    transform: rotate(360deg);
    background: transparent !important;
}

.control-button.theme-toggle span {
    display: inline-block;
    font-size: 18px;
    text-shadow: 0 0 8px var(--primary-color);
}

/* 设置按钮 */
.control-button.settings {
    color: var(--title-btn-color);
}

.control-button.settings:hover {
    color: var(--title-btn-hover);
}

/* 最小化按钮 */
.control-button.minimize {
    font-size: 16px;
    color: var(--title-btn-color);
}

.control-button.minimize:hover {
    color: var(--title-btn-hover);
}

/* 关闭按钮 */
.control-button.close {
    color: var(--title-btn-color);
}

.control-button.close:hover {
    background: linear-gradient(120deg, #ff3b30, #ff2d55);
    color: white;
}

/* 搜索框按钮样式 */
.search-actions {
    display: flex;
    gap: 8px;
}

.action-btn {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--search-text);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.7;
}

.action-btn:hover {
    opacity: 1;
    background: var(--hover-bg);
}

.action-btn.copy {
    color: var(--primary-color);
}

.action-btn.clear:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
}
</style>
