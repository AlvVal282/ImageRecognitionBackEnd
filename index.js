const express = require('express');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();

const port = process.env.PORT || 5000;

const upload = multer({ dest: 'uploads/' });

const AZURE_ENDPOINT = process.env.AZURE_CV_ENDPOINT;
const AZURE_KEY = process.env.AZURE_CV_KEY;

app.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;

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

    fs.unlinkSync(imagePath);

    res.json(response.data);
  } catch (error) {
    console.error('Error analyzing image:', error.message);
    res.status(500).json({ error: 'Failed to analyze image.' });
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to the Image Recognition Backend');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
