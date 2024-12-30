import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { searchWindowManager } from './SearchWindow'

interface AppConfig {
  maxItems: number
  shortcut: string
  autoStart: boolean
  theme: 'light' | 'dark' | 'system'
}

const defaultConfig: AppConfig = {
  maxItems: 30,
  shortcut: 'CommandOrControl+Shift+I',
  autoStart: false,
  theme: 'system'
}

class ConfigManager {
  private config: AppConfig
  private readonly filePath: string

  constructor() {
    // 设置存储路径
    const userDataPath = app.getPath('userData')
    const configPath = join(userDataPath, 'config')
    if (!existsSync(configPath)) {
      mkdirSync(configPath)
    }
    this.filePath = join(configPath, 'settings.json')

    // 加载或创建配置
    this.config = this.loadConfig()
  }

  private loadConfig(): AppConfig {
    try {
      if (existsSync(this.filePath)) {
        const data = readFileSync(this.filePath, 'utf-8')
        return { ...defaultConfig, ...JSON.parse(data) }
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }
    return { ...defaultConfig }
  }

  private saveConfig(): void {
    try {
      writeFileSync(this.filePath, JSON.stringify(this.config, null, 2))
    } catch (error) {
      console.error('Failed to save config:', error)
    }
  }

  getConfig(): AppConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<AppConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.saveConfig()
    this.applyConfig()
  }

  private applyConfig(): void {
    // 应用自启动设置
    app.setLoginItemSettings({
      openAtLogin: this.config.autoStart
    })

    // 更新快捷键
    searchWindowManager.reregisterShortcut()
  }
}

export const configManager = new ConfigManager()
