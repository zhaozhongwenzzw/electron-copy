import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { searchWindowManager } from './SearchWindow'
import { clipboardManager } from './ClipboardManager'
import { configManager } from './ConfigManager'
import { getTrayManager } from './TrayManager'

// 添加内存管理
function setupMemoryManagement(): void {
  // 定期进行垃圾回收
  const gcInterval = setInterval(() => {
    if (global.gc) {
      global.gc()
    }
  }, 300000) // 5分钟执行一次

  // 清理定时器
  app.on('before-quit', () => {
    clearInterval(gcInterval)
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  searchWindowManager.createSearchWindow()
  clipboardManager
  getTrayManager()
  ipcMain.on('window-minimize', event => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      win.minimize()
    }
  })

  ipcMain.on('window-close', event => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      win.hide()
    }
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      searchWindowManager.createSearchWindow()
    }
  })

  // 监听内存使用
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

  // 设置 IPC 处理
  ipcMain.handle('get-config', () => {
    return configManager.getConfig()
  })

  ipcMain.handle('update-config', (_, newConfig) => {
    configManager.updateConfig(newConfig)
  })

  setupMemoryManagement()
})

app.on('window-all-closed', () => {
  clipboardManager.stop()
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  BrowserWindow.getAllWindows().forEach(window => {
    window.destroy()
  })

  searchWindowManager.destroy()

  clipboardManager.stop()

  globalShortcut.unregisterAll()
})
