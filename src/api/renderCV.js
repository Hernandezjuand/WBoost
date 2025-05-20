import axios from 'axios';
import getBaseUrl from './baseUrl';

export const renderLatexCV = async (content) => {
  try {
    const baseUrl = getBaseUrl();
    const endpoint = `${baseUrl}/api/rendercv`;
    
    const response = await axios.post(endpoint, 
      { content },
      { 
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error rendering CV:', error);
    throw error;
  }
};