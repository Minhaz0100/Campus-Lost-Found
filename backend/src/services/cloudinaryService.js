//cloudinaryservice for image hosting 
import { v2 as cloudinary } from 'cloudinary';

let configured = false;

const configure = () => {
  if (configured) return !!process.env.CLOUDINARY_CLOUD_NAME;

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    configured = true;
    return true;
  }

  return false;
};

export const uploadImage = async (buffer, folder = 'campus-lost-found') => {
  if (!configure()) {
    const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    return { url: base64, publicId: `local-${Date.now()}` };
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

export const uploadMultiple = async (files, folder = 'campus-lost-found') => {
  const uploads = files.map((file) => uploadImage(file.buffer, folder));
  return Promise.all(uploads);
};

export const deleteImage = async (publicId) => {
  if (!configure() || publicId.startsWith('local-')) return;
  await cloudinary.uploader.destroy(publicId);
};
