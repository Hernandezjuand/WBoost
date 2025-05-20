const getBaseUrl = () => {
  // In production, use the relative URL
  if (import.meta.env.PROD) {
    return '';
  }
  // In development, use the local server
  return 'http://localhost:3001';
};

export default getBaseUrl; 