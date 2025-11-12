// Helper to get full image URL
// Handles Supabase Storage URLs, local development, and relative paths

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL (Supabase or external), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a Supabase Storage path (products/xxx or backgrounds/xxx)
  if (imagePath.startsWith('products/') || imagePath.startsWith('backgrounds/')) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      const bucket = imagePath.split('/')[0];
      const filePath = imagePath.substring(bucket.length + 1);
      return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
    }
  }
  
  // For local development with local file server
  if (import.meta.env.DEV) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${apiUrl.replace('/api', '')}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
  }
  
  // Production: assume relative path or Supabase URL
  // If it starts with /uploads, it's a local path that should be handled by backend
  if (imagePath.startsWith('/uploads')) {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    return `${apiUrl.replace('/api', '')}${imagePath}`;
  }
  
  return imagePath;
};

export default getImageUrl;

