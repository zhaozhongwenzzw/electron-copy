import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 扩展 electronAPI 类型
const api = {
  windowApi: {
    minimize: (): void => ipcRenderer.send('window-minimize'),
    close: (): void => ipcRenderer.send('window-close'),
    onFocusSearch: (callback: () => void): void => {
      ipcRenderer.on('focus-search-input', callback)
    },
    getClipboardHistory: (): Promise<Array<{ text: string; timestamp: number }>> =>
      ipcRenderer.invoke('get-clipboard-history'),
    onWindowShow: (callback: () => void): void => {
      ipcRenderer.on('window-show', callback)
    },
    onRefreshData: (callback: () => void): void => {
      ipcRenderer.on('refresh-clipboard-data', callback)
    },
    deleteClipboardItem: (index: number): void => ipcRenderer.send('delete-clipboard-item', index),
    clearClipboardHistory: (): void => ipcRenderer.send('clear-clipboard-history'),
    markUserCopy: (): void => ipcRenderer.send('mark-user-copy'),
    getConfig: (): Promise<any> => ipcRenderer.invoke('get-config'),
    updateConfig: (config: any): Promise<void> => ipcRenderer.invoke('update-config', config)
  }
}

// 合并 API
const exposedApi = {
  ...electronAPI,
  ...api
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', exposedApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = exposedApi
}
