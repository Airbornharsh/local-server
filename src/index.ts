import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import path from 'path'
import fs from 'fs'

dotenv.config()

const app = express()
const port = process.env.PORT || 4004
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/files', express.static(path.join(__dirname, '/../', 'files')))

app.get('/', async (req, res) => {
  res.send('Hello World!')
})

app.get('/api/*', async (req, res) => {
  const url = req.url.split('/api/')[1]
  const isDir = fs.statSync(path.join(__dirname, '/../', url)).isDirectory()

  if (isDir) {
    const files = fs.readdirSync(path.join(__dirname, '/../', url))
    const htmlFiles = files.map((file) => {
      const isDir = fs
        .statSync(path.join(__dirname, '/../', url, file))
        .isDirectory()
      return `<a href="/api/${url}/${file}" style="
      padding: 10px;
      margin: 10px;
      border: 1px solid #000;
      border-radius: 5px;
      text-decoration: none;
      color: #000;
      ">${file} ${isDir ? '(View)' : ''}</a>`
    })
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HTML Response</title>
    </head>
    <body>
      <div style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;">${htmlFiles}</div>
    </body>
    </html>
  `

    res.setHeader('Content-Type', 'text/html')
    return res.status(200).send(html)
  }

  const file = fs.readFileSync(path.join(__dirname, '/../', url))
  res.status(200).send(file)
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
