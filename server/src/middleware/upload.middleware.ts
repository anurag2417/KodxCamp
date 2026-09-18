import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { ApiError } from '../utils/ApiError.js';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
const RECORDINGS_DIR = path.join(UPLOAD_ROOT, 'recordings');

// Ensure directories exist at boot
for (const dir of [UPLOAD_ROOT, RECORDINGS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RECORDINGS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    const stamp = Date.now();
    const rand = Math.round(Math.random() * 1e6);
    cb(null, `rec_${stamp}_${rand}${ext}`);
  },
});

const ALLOWED = new Set(['.mp4', '.webm', '.mov', '.m4v', '.mkv']);

export const uploadRecording = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) {
      return cb(new ApiError(400, `Unsupported file type: ${ext}`));
    }
    cb(null, true);
  },
}).single('recording');

export const RECORDINGS_PUBLIC_PATH = '/uploads/recordings';
export const RECORDINGS_DIR_PATH = RECORDINGS_DIR;