// Supabase Storage utility for file uploads
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Upload a file to Supabase Storage
 * @param {Buffer|File} file - File buffer or File object
 * @param {string} bucket - Bucket name ('products' or 'backgrounds')
 * @param {string} fileName - File name with extension
 * @param {string} contentType - MIME type (e.g., 'image/jpeg')
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadToSupabase(file, bucket, fileName, contentType) {
  try {
    // Convert file to buffer if it's a File object
    let fileBuffer;
    if (file instanceof File || file.buffer) {
      fileBuffer = file.buffer || Buffer.from(await file.arrayBuffer());
    } else if (Buffer.isBuffer(file)) {
      fileBuffer = file;
    } else {
      throw new Error('Invalid file type');
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: contentType,
        upsert: true // Overwrite if exists
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    // Return path in format "bucket/filename" for easy identification
    const storagePath = `${bucket}/${data.path}`;

    return {
      url: urlData.publicUrl,
      path: storagePath
    };
  } catch (error) {
    console.error('Error uploading to Supabase Storage:', error);
    throw error;
  }
}

/**
 * Delete a file from Supabase Storage
 * @param {string} bucket - Bucket name
 * @param {string} filePath - File path in storage
 * @returns {Promise<boolean>}
 */
export async function deleteFromSupabase(bucket, filePath) {
  try {
    // Extract just the filename if path includes bucket name
    let pathToDelete = filePath;
    if (filePath.includes('/')) {
      // If path is "products/filename.jpg", extract "filename.jpg"
      const parts = filePath.split('/');
      if (parts.length > 1 && (parts[0] === 'products' || parts[0] === 'backgrounds')) {
        pathToDelete = parts.slice(1).join('/');
      }
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([pathToDelete]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting from Supabase Storage:', error);
    throw error;
  }
}

/**
 * Get public URL for a file in Supabase Storage
 * @param {string} bucket - Bucket name
 * @param {string} filePath - File path in storage
 * @returns {string} Public URL
 */
export function getSupabasePublicUrl(bucket, filePath) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export default supabase;

