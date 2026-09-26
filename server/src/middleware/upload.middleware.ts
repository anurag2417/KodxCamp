import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { ApiError } from '../utils/ApiError.js';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
const RECORDINGS_DIR = path.join(UPLOAD_ROOT, 'recordings');
const MEDIA_DIR = path.join(UPLOAD_ROOT, 'media');

// Ensure directories exist at boot. Even with memory storage for
// recordings, the media library still writes to disk until Batch 2.4.
for (const dir of [UPLOAD_ROOT, RECORDINGS_DIR, MEDIA_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/* ─── Recordings ──────────────────────────────────────────────────
   Class recordings. Video only, 500 MB cap.

   Memory storage as of Batch 2.3.

   Rationale: the storage layer is provider-agnostic. When Cloudinary
   is configured, the buffer is streamed directly to Cloudinary —
   nothing is written to the ephemeral Render disk. When the local
   provider is active (dev), the buffer is written by the local
   provider, which generates the filename itself.

   The disk-storage bridge (filename + path) was removed from
   `RecordingUploadInput` in this batch.
   ────────────────────────────────────────────────────────────────── */

const RECORDING_EXTS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.mkv']);

export const uploadRecording = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!RECORDING_EXTS.has(ext)) {
      return cb(new ApiError(400, `Unsupported file type: ${ext}`));
    }
    cb(null, true);
  },
}).single('recording');

export const RECORDINGS_PUBLIC_PATH = '/uploads/recordings';
export const RECORDINGS_DIR_PATH = RECORDINGS_DIR;

/* ─── Media library ───────────────────────────────────────────────
   General-purpose assets. Still disk storage in this batch;
   Batch 2.4 switches it to memory storage and routes uploads
   through the storage façade.
   ────────────────────────────────────────────────────────────────── */

const mediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MEDIA_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const stamp = Date.now();
    const rand = Math.round(Math.random() * 1e6);
    cb(null, `med_${stamp}_${rand}${ext}`);
  },
});

export const uploadMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
}).single('file');

export const MEDIA_PUBLIC_PATH = '/uploads/media';
export const MEDIA_DIR_PATH = MEDIA_DIR;