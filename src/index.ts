import "dotenv/config"
import process from "node:process"
import http from "node:http"
import { resolveUrl } from "./resolveUrl.js";

const PORT = Number(process.env.PORT) || 3000


const server = http.createServer(async (req, res) => {
  if (req.url?.startsWith('/api')) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ status: 'ok' }))
  }

  await resolveUrl(req, res)
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