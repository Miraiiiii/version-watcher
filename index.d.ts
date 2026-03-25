import type { App } from 'vue'

export interface VersionWatcherOptions {
  endpoint?: string
  interval?: number
  disabled?: boolean
  isListenJSError?: boolean
  content?: string
  dangerouslyUseHTMLString?: boolean
  refreshSameOrigin?: boolean
  polling?: boolean
  checkNowThrottleTime?: number
  tabHeartbeatInterval?: number
  tabInactiveTTL?: number
  customStyle?: Record<string, string | number>
}

export interface VersionWatcherEvent extends VersionWatcherOptions {
  newVersion: string
  currentVersion?: string
  onVersionSync?: () => void
}

export interface VersionWatcherInstanceApi {
  getMode(): 'shared-worker' | 'worker' | 'fallback'
  getTabCount(): number
  getTabIds(): string[]
  checkNow(): void
  destroy(): void
}

export interface VersionWatcherPlugin {
  install(app: App, options?: VersionWatcherOptions): VersionWatcherInstanceApi
}

declare const VersionWatcher: VersionWatcherPlugin
export declare class VersionWatcherInstance implements VersionWatcherInstanceApi {
  constructor(options?: VersionWatcherOptions)
  getMode(): 'shared-worker' | 'worker' | 'fallback'
  getTabCount(): number
  getTabIds(): string[]
  checkNow(): void
  destroy(): void
}

export { VersionWatcher }
export default VersionWatcher
