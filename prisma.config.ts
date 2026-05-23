import "dotenv/config"
import { defineConfig as Silian_defineConfig, env as Silian_env } from "prisma/config"

export default Silian_defineConfig({
  schema: "schema.prisma",
  datasource: {
    url: Silian_env("DATABASE_URL"),
  },
})
