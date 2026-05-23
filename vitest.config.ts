import { defineConfig as Silian_defineConfig } from "vitest/config"
import Silian_path from "path"

export default Silian_defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "@": Silian_path.resolve(__dirname, "./"),
    },
  },
})
