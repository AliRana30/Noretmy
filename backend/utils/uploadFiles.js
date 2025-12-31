// const cloudinary = require('../config/cloudinaryConfig');
// const { Readable } = require('stream');
// const multer = require('multer');

// // Multer configuration to store files in memory
// const storage = multer.memoryStorage();
// const upload = multer({ storage }).array('files', 5); // Supports multiple file uploads

// /**
//  * Upload a single file to Cloudinary
//  * @param {Object} file - The file object from multer
//  * @returns {Promise<Object>} - The uploaded file response from Cloudinary
//  */
// const uploadToCloudinary = async (file) => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       {
//         folder: 'uploads', // Cloudinary folder
//         resource_type: 'auto' // Automatically detects the file type
//       },
//       (error, result) => {
//         if (error) {
//           console.error('Cloudinary Upload Error:', error);
//           reject(error);
//         } else {
//           resolve(result);
//         }
//       }
//     );

//     if (file.buffer) {
//       Readable.from(file.buffer).pipe(stream);
//     } else {
//       reject(new Error('File buffer is missing.'));
//     }
//   });
// };

// /**
//  * Handles multiple file uploads
//  * @param {Object} req - Express request object with files
//  * @returns {Promise<Array>} - Array of uploaded file URLs
//  */
// const uploadFiles = async (req) => {
//   try {

//     if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
//       console.log("Error here in files ");
//       return { success: false, error: 'No files uploaded' };
//     }

//     // Upload all files to Cloudinary
//     const uploadPromises = req.files.map(uploadToCloudinary);
//     const uploadResults = await Promise.all(uploadPromises);

//     // Extract file URLs from Cloudinary responses
//     const urls = uploadResults.map(result => ({
//       url: result.secure_url,
//       format: result.format,
//       originalName: result.original_filename
//     }));

//     return { success: true, urls };

//   } catch (error) {
//     console.error('File Upload Error:', error);
//     return { success: false, error: error.message };
//   }
// };

// module.exports = {
//   upload, // Middleware for handling file uploads
//   uploadFiles, // Function to upload files to Cloudinary
// };



const s3 = require('../config/s3Config');
const multer = require('multer');
const path = require('path');

// Multer configuration to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage }).array('files', 5); // Supports multiple file uploads

/**
 * Upload a single file to AWS S3
 * @param {Object} file - The file object from multer
 * @returns {Promise<Object>} - The uploaded file response from S3
 */
const uploadToS3 = async (file) => {
  const fileExtension = path.extname(file.originalname);
  const fileName = `${Date.now()}-${file.originalname}`;

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, (error, data) => {
      if (error) {
        console.error('S3 Upload Error:', error);
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Handles multiple file uploads
 * @param {Object} req - Express request object with files
 * @returns {Promise<Array>} - Array of uploaded file URLs
 */
const uploadFiles = async (req) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return { success: false, error: 'No files uploaded' };
    }

    const uploadPromises = req.files.map(uploadToS3);
    const uploadResults = await Promise.all(uploadPromises);

    const urls = uploadResults.map(result => ({
      url: result.Location,
      key: result.Key,
      originalName: result.Key.split('-').slice(1).join('-')
    }));

    return { success: true, urls };

  } catch (error) {
    console.error('File Upload Error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  upload,     // Multer middleware
  uploadFiles // Main function to handle S3 upload
};
