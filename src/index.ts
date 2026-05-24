import "dotenv/config"
import process from "node:process"
import http from "node:http"

const PORT = Number(process.env.PORT) || 3000


const server = http.createServer((req,res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" })
  res.end("Привет! Сервер работает.")
})

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Порт ${PORT} уже занят другим приложением!`)
  } else {
    console.error("❌ Ошибка при запуске сервера:", error.message)
  }
  process.exit(1) 
})

server.listen(PORT,() => {
  console.log(`🚀 Сервер успешно запущен на порту ${PORT}`)
})