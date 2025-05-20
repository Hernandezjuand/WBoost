import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });

// Enable CORS for the frontend
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

app.post('/api/rendercv', async (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'No LaTeX content provided' });
  }

  try {
    // Call LaTeX.Online API
    const response = await axios.post('https://latex.ytotech.com/builds/sync', {
      resources: [{
        path: 'main.tex',
        content: content
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Get the PDF URL from the response
    const pdfUrl = response.data.pdfUrl;
    
    // Download the PDF
    const pdfResponse = await axios.get(pdfUrl, {
      responseType: 'arraybuffer'
    });

    // Send the PDF to the client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
    res.send(Buffer.from(pdfResponse.data));
  } catch (error) {
    console.error('Error processing LaTeX:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// The "catchall" handler: for any request that doesn't match one above, send back the index.html file.
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 