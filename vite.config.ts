// Vite 設定（デフォルトで十分ですが、説明用に用意）
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5175,
    open: false,
      strictPort: true,
  },
});

