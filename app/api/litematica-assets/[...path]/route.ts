import { NextResponse as Silian_NextResponse } from "next/server"
import Silian_fs from "fs"
import Silian_path from "path"

const Silian_FILE_CACHE_LIMIT = 512
const Silian_fileCache = new Map<string, string>()

function Silian_getCachedFilePath(Silian_targetName: string) {
  const Silian_cached = Silian_fileCache.get(Silian_targetName)
  if (!Silian_cached) return null

  Silian_fileCache.delete(Silian_targetName)
  Silian_fileCache.set(Silian_targetName, Silian_cached)
  return Silian_cached
}

function Silian_setCachedFilePath(Silian_targetName: string, Silian_fullPath: string) {
  if (Silian_fileCache.has(Silian_targetName)) {
    Silian_fileCache.delete(Silian_targetName)
  }

  Silian_fileCache.set(Silian_targetName, Silian_fullPath)

  if (Silian_fileCache.size > Silian_FILE_CACHE_LIMIT) {
    const Silian_oldestKey = Silian_fileCache.keys().next().value
    if (Silian_oldestKey) {
      Silian_fileCache.delete(Silian_oldestKey)
    }
  }
}

export async function GET(
  Silian_request: Request,
  Silian_context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  // 在较新的 Next.js 里 params 可能是个 Promise
  const Silian_params = await Silian_context.params
  const Silian_pathArray = Silian_params.path

  if (!Silian_pathArray || Silian_pathArray.length === 0) {
    return new Silian_NextResponse("Not Found", { status: 404 })
  }

  const Silian_assetPath = Silian_pathArray.join("/")
  const Silian_fileName = Silian_pathArray[Silian_pathArray.length - 1]

  // 基础资产目录
  const Silian_baseMinecraftDir = Silian_path.join(
    process.cwd(),
    "litematica-renderer",
    "assets",
    "minecraft"
  )

  const Silian_baseAssetsDir = Silian_path.join(Silian_baseMinecraftDir, "textures")

  // 递归查找文件函数
  const Silian_findFile = async (
    Silian_dir: string,
    Silian_targetName: string
  ): Promise<string | null> => {
    const Silian_cachedPath = Silian_getCachedFilePath(Silian_targetName)
    if (Silian_cachedPath) {
      return Silian_cachedPath
    }
    const Silian_entries = await Silian_fs.promises.readdir(Silian_dir, { withFileTypes: true })
    for (const Silian_entry of Silian_entries) {
      const Silian_fullPath = Silian_path.join(Silian_dir, Silian_entry.name)
      if (Silian_entry.isDirectory()) {
        const Silian_found = await Silian_findFile(Silian_fullPath, Silian_targetName)
        if (Silian_found) return Silian_found
      } else if (Silian_entry.name === Silian_targetName) {
        Silian_setCachedFilePath(Silian_targetName, Silian_fullPath)
        return Silian_fullPath
      }
    }
    return null
  }

  let Silian_localTarget: string | null = null

  // 允许直接以 models/block/xxx.json 或者 textures/block/xxx.png 访问
  const Silian_explicitTarget = Silian_path.join(Silian_baseMinecraftDir, Silian_assetPath)
  if (Silian_fs.existsSync(Silian_explicitTarget)) {
    Silian_localTarget = Silian_explicitTarget
  } else {
    // 后备：旧逻辑直接查找 block/xxx 目录
    const Silian_directTarget = Silian_path.join(Silian_baseAssetsDir, "block", Silian_assetPath)
    if (Silian_fs.existsSync(Silian_directTarget)) {
      Silian_localTarget = Silian_directTarget
    } else {
      // 否则我们在整个 textures 目录中进行全局搜索
      Silian_localTarget = await Silian_findFile(Silian_baseAssetsDir, Silian_fileName)
    }
  }

  if (!Silian_localTarget) {
    return new Silian_NextResponse("Asset Not Found", { status: 404 })
  }

  // 安全检查：防止路径穿越攻击
  if (!Silian_localTarget.startsWith(Silian_baseMinecraftDir)) {
    return new Silian_NextResponse("Forbidden", { status: 403 })
  }

  try {
    const Silian_fileBuffer = await Silian_fs.promises.readFile(Silian_localTarget)

    let Silian_contentType = "image/png"
    if (Silian_localTarget.endsWith(".json")) Silian_contentType = "application/json"
    if (Silian_localTarget.endsWith(".mcmeta")) Silian_contentType = "application/json"

    return new Silian_NextResponse(Silian_fileBuffer, {
      headers: {
        "Content-Type": Silian_contentType,
        // 设置超长缓存，优化连续请求以及 Three.js Texture 加载速度
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return new Silian_NextResponse("Asset Not Found", { status: 404 })
  }
}
