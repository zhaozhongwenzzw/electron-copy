import { Tray, Menu, nativeImage, app } from 'electron'
import { searchWindowManager } from './SearchWindow'
// 导入图标
import icon from '../../build/icon.png?asset'

class TrayManager {
  private tray: Tray | null = null

  constructor() {
    if (app.isReady()) {
      this.createTray()
    } else {
      app.whenReady().then(() => {
        this.createTray()
      })
    }
  }

  private createTray(): void {
    try {
      // 使用 nativeImage 创建图标
      const trayIcon = nativeImage.createFromPath(icon)
      console.log('Icon loaded:', !trayIcon.isEmpty())

      // 调整图标大小
      const resizedIcon = trayIcon.resize({ width: 16, height: 16 })
      this.tray = new Tray(resizedIcon)

      // 设置托盘菜单
      const contextMenu = Menu.buildFromTemplate([
        {
          label: '显示',
          click: () => {
            searchWindowManager.showSearchWindow()
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          click: () => {
            searchWindowManager.destroy()
            app.quit()
          }
        }
      ])

      this.tray.setToolTip('历史剪贴板')
      this.tray.setContextMenu(contextMenu)

      // 点击托盘图标显示主窗口
      this.tray.on('click', () => {
        searchWindowManager.showSearchWindow()
      })
    } catch (error) {
      console.error('Error creating tray:', error)
    }
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }
}
// 延迟创建实例
let trayManagerInstance: TrayManager | null = null

export const getTrayManager = (): TrayManager => {
  if (!trayManagerInstance) {
    trayManagerInstance = new TrayManager()
  }
  return trayManagerInstance
}
