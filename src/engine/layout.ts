// Layout helpers: reserve a right-side debug panel
export const DEBUG_PANEL_W = 260; // px

let debugPanelEnabled = false;

export function setDebugPanelEnabled(enabled: boolean): void {
  debugPanelEnabled = enabled;
}

export function isDebugPanelEnabled(): boolean {
  return debugPanelEnabled;
}

export function gameWidth(): number {
  const reserved = debugPanelEnabled ? DEBUG_PANEL_W : 0;
  return Math.max(0, window.innerWidth - reserved);
}

export function gameHeight(): number {
  return window.innerHeight;
}
