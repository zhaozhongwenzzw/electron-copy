import { BrowserWindow, globalShortcut, app, ipcMain } from 'electron'
import { WindowManager, WindowOptions } from './WindowManager'
import { join } from 'path'
import { clipboardManager } from './ClipboardManager'
import { configManager } from './ConfigManager'

export class SearchWindowManager extends WindowManager {
  private searchWindow: BrowserWindow | null = null

  constructor() {
    super()
    this.initShortcut()
    this.setupIPC()
    clipboardManager
  }

  private initShortcut(): void {
    // 等待应用就绪后再注册快捷键
    if (app.isReady()) {
      this.registerShortcut()
    } else {
      app.whenReady().then(() => {
        this.registerShortcut()
      })
    }

    // 当应用退出时注销快捷键
    app.on('will-quit', () => {
      globalShortcut.unregisterAll()
    })
  }

  private registerShortcut(): void {
    const config = configManager.getConfig()
    globalShortcut.register(config.shortcut, () => {
      if (this.searchWindow?.isVisible()) {
        this.searchWindow.hide()
      } else {
        this.showSearchWindow()
      }
    })
  }

  private setupIPC(): void {
    // 添加聚焦事件处理
    ipcMain.on('focus-search', () => {
      if (this.searchWindow) {
        this.searchWindow.webContents.send('focus-search-input')
      }
    })
  }

  createSearchWindow(): BrowserWindow {
    const defaultSearchOptions: WindowOptions = {
      width: 400,
      height: 500,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: true,
      skipTaskbar: false,
      minWidth: 400,
      minHeight: 500,
      titleBarStyle: 'hidden',
      hasShadow: false,
      icon: join(__dirname, '../../build/icon.png'),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: true,
        devTools: process.env.NODE_ENV === 'development'
      }
    }

    this.searchWindow = this.createWindow('/search', defaultSearchOptions)
    this.searchWindow.hide()
    // 关闭时只隐藏窗口
    this.searchWindow.on('close', event => {
      if (this.searchWindow && !this.searchWindow.isDestroyed()) {
        event.preventDefault()
        this.searchWindow.hide()
      }
    })

    return this.searchWindow
  }

  showSearchWindow(): void {
    if (this.searchWindow?.isDestroyed()) {
      this.searchWindow = null
    }

    if (!this.searchWindow) {
      this.createSearchWindow()
    } else {
      this.searchWindow.show()
      this.searchWindow.center()
      this.searchWindow.focus()
      // 发送窗口显示事件
      this.searchWindow.webContents.send('window-show')
      // 延迟发送聚焦事件
      setTimeout(() => {
        if (this.searchWindow) {
          this.searchWindow.webContents.send('focus-search-input')
        }
      }, 100)
    }
  }

  destroy(): void {
    if (this.searchWindow && !this.searchWindow.isDestroyed()) {
      this.searchWindow.destroy()
    }
    this.searchWindow = null

    // 清理所有由这个管理器创建的窗口
    this.windows.clear()
  }

  // 添加重新注册快��键的方法
  reregisterShortcut(): void {
    globalShortcut.unregisterAll()
    this.registerShortcut()
  }
}
export const searchWindowManager = new SearchWindowManager()
