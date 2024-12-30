declare global {
  interface Window {
    electron: {
      windowApi: {
        minimize: () => void
        close: () => void
        onFocusSearch: (callback: () => void) => void
        getClipboardHistory: () => Promise<
          Array<{
            text: string
            timestamp: number
          }>
        >
        onRefreshData: (
          callback: (
            items: Array<{
              text: string
              timestamp: number
            }>
          ) => void
        ) => void
        onWindowShow: (callback: () => void) => void
        markUserCopy: () => void
        deleteClipboardItem: (index: number) => void
        clearClipboardHistory: () => void
        getConfig: () => Promise<AppConfig>
        updateConfig: (config: AppConfig) => Promise<void>
      }
    }
  }
}

export {}
