const express = require('express');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors({
    origin: 'http://localhost:8081',
    methods: ['GET', 'POST'],       
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

const port = process.env.PORT || 5000;

const AZURE_ENDPOINT = process.env.AZURE_CV_ENDPOINT;
const AZURE_KEY = process.env.AZURE_CV_KEY;

if (!AZURE_ENDPOINT || !AZURE_KEY) {
  console.error('Azure endpoint or key is missing. Please check your .env file.');
  process.exit(1);
}

app.use(cors({ origin: 'http://localhost:8081' })); // Adjust as needed for your frontend origin

const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/bmp', 'image/tiff'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

app.post('/analyze', upload.single('image'), async (req, res) => {
  let imagePath;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded.' });
    }
    imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const response = await axios.post(
      `${AZURE_ENDPOINT}vision/v3.2/analyze?visualFeatures=Description,Tags`,
      imageBuffer,
      {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': AZURE_KEY,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error analyzing image:', error.message);
    if (error.response) {
      console.error('Azure Response:', error.response.data);
    }
    res.status(500).json({
      error: 'Failed to analyze image.',
      details: error.message,
    });
  } finally {
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to the Image Recognition Backend');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
