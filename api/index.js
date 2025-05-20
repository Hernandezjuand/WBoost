import axios from 'axios';
import { Buffer } from 'buffer';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    // Handle CORS preflight request
    res.status(200).end();
    return;
  }
  
  if (req.method === 'POST') {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'No LaTeX content provided' });
    }

    try {
      // Log the request for debugging
      console.log('Received request for LaTeX rendering');
      
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
      console.log('PDF URL received:', pdfUrl);
      
      // Download the PDF
      const pdfResponse = await axios.get(pdfUrl, {
        responseType: 'arraybuffer'
      });

      // Set headers for PDF response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
      
      // Convert to Buffer safely
      const buffer = Buffer.from(pdfResponse.data);
      
      // Send the PDF data
      res.status(200).send(buffer);
    } catch (error) {
      console.error('Error processing LaTeX:', error);
      res.status(500).json({ 
        error: 'Failed to generate PDF', 
        details: error.message,
        stack: error.stack 
      });
    }
  } else {
    // Not found for any other routes
    res.status(404).json({ error: 'Not Found' });
  }
} 