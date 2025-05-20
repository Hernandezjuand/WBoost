import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    // Handle CORS preflight request
    res.status(200).end();
    return;
  }
  
  if (req.method === 'POST' && req.url.includes('/rendercv')) {
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

      // Set headers for PDF response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
      
      // Send the PDF data
      res.status(200).send(Buffer.from(pdfResponse.data));
    } catch (error) {
      console.error('Error processing LaTeX:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  } else {
    // Not found for any other routes
    res.status(404).json({ error: 'Not Found' });
  }
} 