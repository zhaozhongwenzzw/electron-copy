import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
export interface WindowOptions {
  route?: string
  // 窗口尺寸和位置
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  x?: number
  y?: number
  center?: boolean

  // 窗口行为
  show?: boolean
  autoHideMenuBar?: boolean
  frame?: boolean
  resizable?: boolean
  movable?: boolean
  minimizable?: boolean
  maximizable?: boolean
  closable?: boolean
  focusable?: boolean
  alwaysOnTop?: boolean
  fullscreen?: boolean
  skipTaskbar?: boolean
  kiosk?: boolean
  transparent?: boolean
  hasShadow?: boolean

  // 窗口外观
  title?: string
  icon?: string
  backgroundColor?: string
  opacity?: number
  darkTheme?: boolean
  vibrancy?:
    | 'appearance-based'
    | 'titlebar'
    | 'selection'
    | 'menu'
    | 'popover'
    | 'sidebar'
    | 'header'
    | 'sheet'
    | 'window'
    | 'hud'
    | 'fullscreen-ui'
    | 'tooltip'
    | 'content'
    | 'under-window'
    | 'under-page'
  visualEffectState?: 'active' | 'inactive' | 'followWindow'
  roundedCorners?: boolean

  // 网页功能
  webPreferences?: {
    nodeIntegration?: boolean
    contextIsolation?: boolean
    webSecurity?: boolean
    sandbox?: boolean
    preload?: string
    devTools?: boolean
    javascript?: boolean
    webgl?: boolean
    plugins?: boolean
    experimentalFeatures?: boolean
    scrollBounce?: boolean
    enableRemoteModule?: boolean
    spellcheck?: boolean
    webviewTag?: boolean
    backgroundThrottling?: boolean
  }

  // 父子窗口
  parent?: BrowserWindow
  modal?: boolean
  titleBarStyle?: 'default' | 'hidden' | 'hiddenInset' | 'customButtonsOnHover'
  trafficLightPosition?: { x: number; y: number }
}

export class WindowManager {
  protected windows: Map<string, BrowserWindow> = new Map()

  createWindow(route: string, options: WindowOptions = {}): BrowserWindow {
    const defaultOptions: WindowOptions = {
      width: 900,
      height: 670,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      }
    }

    const finalOptions = {
      ...defaultOptions,
      ...options
    }

    const window = new BrowserWindow(finalOptions)

    window.on('ready-to-show', () => {
      window.show()
    })

    window.webContents.setWindowOpenHandler(details => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    const baseUrl =
      is.dev && process.env['ELECTRON_RENDERER_URL']
        ? process.env['ELECTRON_RENDERER_URL']
        : `file://${join(__dirname, '../renderer/index.html')}`

    window.loadURL(`${baseUrl}#${route}`)
    this.windows.set(route, window)

    return window
  }

  getWindow(route: string): BrowserWindow | undefined {
    return this.windows.get(route)
  }

  closeWindow(route: string): void {
    const window = this.windows.get(route)
    if (window) {
      window.close()
      this.windows.delete(route)
    }
  }
}

export const windowManager = new WindowManager()
