import path from "node:path";
import fs from 'node:fs'
import { MIME_TYPES } from "./mineType.js";
import http from 'node:http'
import { HTTP_ERRORS } from "./errors/errors.js";


const PUBLIC_DIR = path.join(process.cwd(), "./src/static");

const resolveStaticFile = async (basePath: string): Promise<string | null> => {
  const candidates = [
    basePath,
    basePath + '.html',
    path.join(basePath, 'index.html'),
  ]

  for (const candidate of candidates) {
    const stats = await fs.promises.stat(candidate).catch(() => null)
    if (stats && stats.isFile()) {
      return candidate
    }
  }

  return null
}

const parseSafePath = (url: string, host: string): string | null => {
  try {
    return decodeURIComponent(new URL(url, `http://${host}`).pathname)
  } catch {
    return null
  }
}

export const resolveUrl = async (
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> => {
  // 1. Парсим и валидируем URL
  const safePathname = parseSafePath(req.url || '', req.headers.host || 'localhost')
  if (!safePathname) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(HTTP_ERRORS[400])
    return
  }

  // 2. Определяем целевой путь (у тебя красиво настроен дефолт на /main/index.html)
  const targetPath = safePathname === '/' ? '/main/index.html' : safePathname
  const requestedPath = path.join(PUBLIC_DIR, targetPath)

  // 3. Защита от Directory Traversal
  if (!requestedPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(HTTP_ERRORS[403])
    return
  }

  // 4. Поиск существующего файла на диске через кандидатов
  const finalFilePath = await resolveStaticFile(requestedPath)
  if (!finalFilePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(HTTP_ERRORS[404])
    return
  }

  // 5. Определение MIME-типа и запуск стрима
  const ext = path.extname(finalFilePath).toLowerCase()
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'
  const stream = fs.createReadStream(finalFilePath)

  stream.on('open', () => {
    res.writeHead(200, { 'Content-Type': contentType })
    stream.pipe(res)
  })

  stream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end(HTTP_ERRORS[500])
    }
  })
}