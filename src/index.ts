import "dotenv/config"
import process from "node:process"
import http from "node:http"
import path from "node:path";
import fs from 'node:fs'

const PORT = Number(process.env.PORT) || 3000
const PUBLIC_DIR = path.join(process.cwd(), "./src/static");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".json": "application/json",
}

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

const server = http.createServer(async (req, res) => {
  const safePathname = parseSafePath(req.url!, req.headers.host || 'localhost' || '127.0.0.1')
  if (!safePathname) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
    return res.end('400: Bad Request')
  }

  const targetPath = safePathname === '/' ? 'index.html' : safePathname
  const requestedPath = path.join(PUBLIC_DIR, targetPath)

  if (!requestedPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
    return res.end('403: Доступ запрещен')
  }

  const finalFilePath = await resolveStaticFile(requestedPath)
  if (!finalFilePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    return res.end('404: Файл не найден')
  }

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
      res.end('500: Внутренняя ошибка сервера')
    }
  })
})

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Порт ${PORT} уже занят другим приложением!`)
  } else {
    console.error("❌ Ошибка при запуске сервера:", error.message)
  }
  process.exit(1)
})

server.listen(PORT, () => {
  console.log(`🚀 Сервер успешно запущен на порту ${PORT}`)
})