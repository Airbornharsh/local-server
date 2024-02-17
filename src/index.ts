import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import multer from 'multer'

dotenv.config()

const app = express()
const port = process.env.PORT || 4004
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/files', express.static(path.join(__dirname, '/../', 'files')))

app.get('/', async (req, res) => {
  return res.redirect('/api/files')
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
      return `<li><a href="/api/${url}/${file}" style="
      padding: 10px;
      margin: 10px;
      border: 1px solid #000;
      border-radius: 5px;
      text-decoration: none;
      color: #000;

      ">${file} ${isDir ? '(View)' : ''}</a></li>`
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
    <form id="uploadForm" enctype="multipart/form-data">
      <label for="fileInput">Select a file:</label>
      <input type="file" id="fileInput" name="fileInput" accept=".jpg, .jpeg, .png" required>
      <br>
      <button type="button" onclick="uploadFile()">Upload</button>
    </form>
      <ul style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        list-style-type: none;
        padding: 0;">${htmlFiles}</ul>
        <script>
        function uploadFile() {
          const fileInput = document.getElementById('fileInput');
          const file = fileInput.files[0];
    
          if (file) {
            const formData = new FormData();
            formData.append('fileInput', file);
    
            // You can add additional form fields if needed
            // formData.append('fieldName', 'fieldValue');
    
            // Perform the AJAX request using fetch or XMLHttpRequest
            // For simplicity, this example uses fetch
            const url = window.location.pathname.split('/api/')[1];
            fetch('/upload/'+ url, {
              method: 'POST',
              body: formData
            })
            .then(response => {
              if (response.ok) {
                return response.text();
              }
              throw new Error('File upload failed');
            })
            .then(responseText => {
              console.log(responseText);
              window.location.reload();
            })
            .catch(error => {
              console.error('Error:', error.message);
            });
          } else {
            alert('Please select a file before uploading.');
          }
        }
      </script>
    </body>
    </html>
  `
    res.setHeader('Content-Type', 'text/html')
    return res.status(200).send(html)
  }

  const file = fs.readFileSync(path.join(__dirname, '/../', url))
  res.status(200).send(file)
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(req.url)
    const filePath = req.url.split('/upload/files/')[1]
      ? req.url.split('/upload/files/')[1]
      : ''
    const filePaths = filePath ? filePath.split('/') : []
    if (!fs.existsSync('files')) {
      fs.mkdirSync('files')
    }
    let temp = 'files/'
    filePaths.forEach((folder) => {
      if (folder) {
        if (!fs.existsSync(temp + folder)) {
          fs.mkdirSync(temp + folder)
        }
        temp += folder + '/'
      }
    })
    const destinationFolder = 'files/' + filePath
    cb(null, destinationFolder)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  },
})

export const upload = multer({ storage: storage })

app.post('/upload/*', upload.single('fileInput'), (req, res) => {
  return res.status(200).send('File uploaded successfully')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
