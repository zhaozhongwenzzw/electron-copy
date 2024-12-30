import { ref } from 'vue'

export type ThemeType = 'light' | 'dark' | 'system'

export interface SettingConfig {
  maxItems: number
  shortcut: string
  autoStart: boolean
  theme: ThemeType
}

export function useSetting() {
  const maxItems = ref(30)
  const shortcut = ref('CommandOrControl+Shift+I')
  const autoStart = ref(false)
  const theme = ref<ThemeType>('system')

  // 加载配置
  const loadConfig = async (): Promise<void> => {
    try {
      const config = await window.electron.windowApi.getConfig()
      maxItems.value = config.maxItems
      shortcut.value = config.shortcut
      autoStart.value = config.autoStart
      theme.value = config.theme || 'system'
    } catch (error) {
      console.error('Failed to load config:', error)
    }
  }

  // 保存配置
  const saveConfig = async (): Promise<boolean> => {
    try {
      await window.electron.windowApi.updateConfig({
        maxItems: maxItems.value,
        shortcut: shortcut.value,
        autoStart: autoStart.value,
        theme: theme.value
      })
      return true
    } catch (error) {
      console.error('Failed to save config:', error)
      return false
    }
  }

  // 恢复默认配置
  return {
    maxItems,
    shortcut,
    autoStart,
    theme,
    loadConfig,
    saveConfig
  }
}
