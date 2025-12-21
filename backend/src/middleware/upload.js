const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Root uploads directory
const rootUploadDir = path.join(__dirname, '../../uploads');

// Ensure root folder exists
if (!fs.existsSync(rootUploadDir)) {
  fs.mkdirSync(rootUploadDir, { recursive: true });
}

// Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let subfolder = 'others';

    if (req.baseUrl.includes('reports')) subfolder = 'before';
    else if (req.baseUrl.includes('progress')) subfolder = 'progress';
    else if (req.baseUrl.includes('completion')) subfolder = 'after';
    else if (file.mimetype.startsWith('image/')) subfolder = 'images';
    else if (file.mimetype.startsWith('video/')) subfolder = 'videos';
    else if (file.mimetype.startsWith('application/')) subfolder = 'documents';

    const targetDir = path.join(rootUploadDir, subfolder);

    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    cb(null, targetDir); // MUST be absolute path
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9.-]/g, '-');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${base}-${unique}${ext}`);
  }
});

// Allowed file types
const allowedTypes = [
  'image/jpeg','image/png','image/jpg','image/gif','image/webp','image/svg+xml',
  'video/mp4','video/mpeg','video/quicktime','video/x-msvideo','video/x-matroska',
  'application/pdf','application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const fileFilter = (req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ---------- MIDDLEWARES ----------
const uploadSingle = (field) => (req, res, next) =>
  upload.single(field)(req, res, handleError(res, next));

const uploadMultiple = (field, max = 10) => (req, res, next) =>
  upload.array(field, max)(req, res, handleError(res, next));

const uploadFields = (fields) => (req, res, next) =>
  upload.fields(fields)(req, res, handleError(res, next));

const uploadAny = () => (req, res, next) =>
  upload.any()(req, res, handleError(res, next));

function handleError(res, next) {
  return (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  };
}

// ---------- HELPERS ----------
const getFileUrl = (req, filePath) => {
  if (!filePath) return null;

  // Convert absolute path → relative path
  const relative = filePath.replace(rootUploadDir, '').replace(/\\/g, '/');

  return `${req.protocol}://${req.get('host')}/uploads${relative}`;
};

const deleteFile = (filePath) => {
  try {
    const abs = filePath.includes(rootUploadDir)
      ? filePath
      : path.join(rootUploadDir, filePath.replace(/^uploads[\\/]/, ''));

    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
      return true;
    }
  } catch (err) {
    console.error('Delete file error:', err);
  }
  return false;
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadAny,
  getFileUrl,
  deleteFile
};
