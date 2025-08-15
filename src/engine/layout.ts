// Layout helpers: reserve a right-side debug panel
export const DEBUG_PANEL_W = 260; // px

let debugPanelEnabled = false;

export function setDebugPanelEnabled(enabled: boolean): void {
  debugPanelEnabled = enabled;
}

export function isDebugPanelEnabled(): boolean {
  return debugPanelEnabled;
}

// 実効ビューポート（アドレスバー等の表示非表示に追随）
function viewportSize(): { width: number; height: number } {
  const vv = window.visualViewport;
  if (vv) return { width: Math.floor(vv.width), height: Math.floor(vv.height) };
  return { width: Math.floor(window.innerWidth), height: Math.floor(window.innerHeight) };
}

export function gameWidth(): number {
  const reserved = debugPanelEnabled ? DEBUG_PANEL_W : 0;
  const { width } = viewportSize();
  return Math.max(0, width - reserved);
}

export function gameHeight(): number {
  const { height } = viewportSize();
  return height;
}
