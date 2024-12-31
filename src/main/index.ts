import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { searchWindowManager } from './SearchWindow'
import { clipboardManager } from './ClipboardManager'
import { configManager } from './ConfigManager'
import { getTrayManager } from './TrayManager'

// 统一的资源清理函数
function cleanup(): void {
  // 销毁所有窗口
  BrowserWindow.getAllWindows().forEach(window => {
    if (!window.isDestroyed()) {
      window.destroy()
    }
  })

  // 清理各个管理器
  searchWindowManager.destroy()
  clipboardManager.stop()
  getTrayManager().destroy()
  globalShortcut.unregisterAll()
}

app.whenReady().then(() => {
  // 设置应用 ID
  electronApp.setAppUserModelId('com.clipboard.history')

  // 优化窗口快捷键
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    // 按顺序初始化各个管理器
    clipboardManager.start() // 先启动剪贴板监听
    searchWindowManager.createSearchWindow() // 创建主窗口
    getTrayManager() // 创建托盘
  } catch (error) {
    console.error('Failed to initialize:', error)
    app.quit()
  }

  // 窗口控制事件处理
  ipcMain.on('window-minimize', event => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win && !win.isDestroyed()) {
        win.minimize()
      }
    } catch (error) {
      console.error('Failed to minimize window:', error)
    }
  })

  ipcMain.on('window-close', event => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win && !win.isDestroyed()) {
        win.hide()
      }
    } catch (error) {
      console.error('Failed to close window:', error)
    }
  })

  // 配置相关的 IPC 处理
  ipcMain.handle('get-config', () => {
    try {
      return configManager.getConfig()
    } catch (error) {
      console.error('Failed to get config:', error)
      return null
    }
  })

  ipcMain.handle('update-config', async (_, newConfig) => {
    try {
      await configManager.updateConfig(newConfig)
      return true
    } catch (error) {
      console.error('Failed to update config:', error)
      return false
    }
  })

  // 开发环境下的内存监控
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const usage = process.memoryUsage()
      console.log('Memory usage:', {
        rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`
      })
    }, 30000)
  }
})

// 窗口管理
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    searchWindowManager.createSearchWindow()
  }
})

// 统一的退出处理
app.on('before-quit', cleanup)

// 处理未捕获的异常
process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error)
  cleanup()
  app.quit()
})
