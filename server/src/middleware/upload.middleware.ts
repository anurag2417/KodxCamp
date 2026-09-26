import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { ApiError } from '../utils/ApiError.js';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
const RECORDINGS_DIR = path.join(UPLOAD_ROOT, 'recordings');
const MEDIA_DIR = path.join(UPLOAD_ROOT, 'media');

// Ensure directories exist at boot
for (const dir of [UPLOAD_ROOT, RECORDINGS_DIR, MEDIA_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/* ─── Recordings ──────────────────────────────────────────────────
   Class recordings. Video only, 500 MB cap, deterministic filename
   prefix (`rec_`) so a directory listing is easy to read.
   ────────────────────────────────────────────────────────────────── */

const recordingsStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RECORDINGS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    const stamp = Date.now();
    const rand = Math.round(Math.random() * 1e6);
    cb(null, `rec_${stamp}_${rand}${ext}`);
  },
});

const RECORDING_EXTS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.mkv']);

export const uploadRecording = multer({
  storage: recordingsStorage,
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
   General-purpose assets. Any MIME type the browser will upload.
   Filename prefix `med_` distinguishes them in a directory listing.
   The size cap matches the recordings cap — 500 MB is enough for a
   large image, a small video, or a PDF, and files larger than that
   are a storage problem the platform shouldn't absorb silently.
   ────────────────────────────────────────────────────────────────── */

const mediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MEDIA_DIR),
  filename: (_req, file, cb) => {
    // Preserve the original extension so the browser can infer the
    // MIME type from the URL. The `med_` prefix keeps a directory
    // listing readable.
    const ext = path.extname(file.originalname).toLowerCase();
    const stamp = Date.now();
    const rand = Math.round(Math.random() * 1e6);
    cb(null, `med_${stamp}_${rand}${ext}`);
  },
});

export const uploadMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  // No fileFilter — the media library categorizes by MIME type and
  // accepts anything. An unexpected file is stored under `kind:
  // 'other'`, which is a valid bucket.
}).single('file');

export const MEDIA_PUBLIC_PATH = '/uploads/media';
export const MEDIA_DIR_PATH = MEDIA_DIR;