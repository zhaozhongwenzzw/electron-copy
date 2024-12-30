import { ipcMain, BrowserWindow, app, clipboard } from 'electron'
import clipboardListener from 'clipboard-event'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { configManager } from './ConfigManager'

interface ClipboardItem {
  text: string
  timestamp: number
}

class ClipboardManager {
  private items: ClipboardItem[] = []
  private readonly filePath: string
  private isUserCopy = false
  private saveTimeout: NodeJS.Timeout | null = null

  constructor() {
    // 设置存储路径
    const userDataPath = app.getPath('userData')
    const storagePath = join(userDataPath, 'storage')
    if (!existsSync(storagePath)) {
      mkdirSync(storagePath)
    }
    this.filePath = join(storagePath, 'clipboard-history.json')

    // 加载已保存的数据
    this.loadFromFile()
    // 开始监听剪贴板
    this.setupListener()
    // 设置 IPC 通信
    this.setupIPC()
  }

  private loadFromFile(): void {
    try {
      if (existsSync(this.filePath)) {
        const data = readFileSync(this.filePath, 'utf-8')
        this.items = JSON.parse(data)
      }
    } catch (error) {
      console.error('Failed to load clipboard history:', error)
      this.items = []
    }
  }

  private saveToFile(): void {
    try {
      writeFileSync(this.filePath, JSON.stringify(this.items, null, 2))
    } catch (error) {
      console.error('Failed to save clipboard history:', error)
    }
  }

  private setupListener(): void {
    // 启动监听器
    clipboardListener.startListening()
    // 监听复制事件
    clipboardListener.on('change', () => {
      if (this.isUserCopy) {
        this.isUserCopy = false
        return
      }
      const text = clipboard.readText().trim()
      if (text) {
        this.addItem(text)
      }
    })
  }

  private addItem(text: string): void {
    if (!text || text.length > 1000000) return // 限制单条文本大小

    // 检查是否已存在相同文本
    const existingIndex = this.items.findIndex(item => item.text === text)
    if (existingIndex !== -1) {
      this.items.splice(existingIndex, 1)
    }

    this.items.unshift({
      text,
      timestamp: Date.now()
    })

    // 从配置获取最大记录数
    const config = configManager.getConfig()
    if (this.items.length > config.maxItems) {
      this.items.pop()
    }

    // 使用防抖保存文件，避免频繁写入
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    this.saveTimeout = setTimeout(() => {
      this.saveToFile()
    }, 1000)

    this.broadcastUpdate()
  }

  private broadcastUpdate(): void {
    // 只发送必要的数据
    const simplifiedItems = this.items.map(({ text, timestamp }) => ({
      text: text.slice(0, 1000), // 限制预览文本长度
      timestamp
    }))

    BrowserWindow.getAllWindows().forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('refresh-clipboard-data', simplifiedItems)
      }
    })
  }

  private setupIPC(): void {
    // 获取剪贴板历史
    ipcMain.handle('get-clipboard-history', () => {
      return this.items
    })

    // 清空历史
    ipcMain.on('clear-clipboard-history', () => {
      this.items = []
      this.saveToFile()
      this.broadcastUpdate()
    })

    // 删除指定项
    ipcMain.on('delete-clipboard-item', (_, index: number) => {
      if (index >= 0 && index < this.items.length) {
        this.items.splice(index, 1)
        this.saveToFile()
        this.broadcastUpdate()
      }
    })

    //清空
    ipcMain.on('clear-clipboard-history', () => {
      this.items = []
      this.saveToFile()
      this.broadcastUpdate()
    })

    // 添加用户复制标记处理
    ipcMain.on('mark-user-copy', () => {
      this.isUserCopy = true
    })
  }

  stop(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    clipboardListener.stopListening()
    this.saveToFile()
    ipcMain.removeHandler('get-clipboard-history')
    ipcMain.removeAllListeners('clear-clipboard-history')
    ipcMain.removeAllListeners('delete-clipboard-item')
    ipcMain.removeAllListeners('mark-user-copy')
  }

  // 添加公共方法获取数据
  getItems(): ClipboardItem[] {
    return this.items
  }
}

export const clipboardManager = new ClipboardManager()
