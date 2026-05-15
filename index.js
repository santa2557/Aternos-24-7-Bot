// Aternos Keep-Alive Bot
// Copyright (C) 2024 Santa
// Licensed under the Apache License, Version 2.0
// http://www.apache.org/licenses/LICENSE-2.0

const http = require('http')
const fs = require('fs')
const mineflayer = require('mineflayer')

let bot = null
let pendingLogs = []

function log(msg) {
  console.log(msg)
  pendingLogs.push(msg)
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'GET' && req.url === '/') {
    res.setHeader('Content-Type', 'text/html')
    res.end(fs.readFileSync('index.html'))

  } else if (req.method === 'POST' && req.url === '/start') {
    let body = ''
    req.on('data', d => body += d)
    req.on('end', () => {
      const { host, port, username, version } = JSON.parse(body)
      if (bot) bot.end()
      bot = mineflayer.createBot({ host, port, username, version, auth: 'offline' })

      bot.once('spawn', () => log('Bot spawned on ' + host))
      bot.on('end', () => log('Bot disconnected, reconnecting...'))
      bot.on('error', err => log('Error: ' + err.message))
      bot.on('kicked', reason => log('Kicked: ' + reason))

      setInterval(() => {
        if (bot) {
          bot.setControlState('jump', true)
          setTimeout(() => bot.setControlState('jump', false), 500)
        }
      }, 60000)

      res.end(JSON.stringify({ ok: true }))
    })

  } else if (req.method === 'POST' && req.url === '/stop') {
    if (bot) { bot.end(); bot = null }
    res.end(JSON.stringify({ ok: true }))

  } else if (req.url === '/logs') {
    res.end(JSON.stringify({ logs: pendingLogs.splice(0) }))

  } else {
    res.end('{}')
  }
})

server.listen(3000, () => console.log('Dashboard running!'))
