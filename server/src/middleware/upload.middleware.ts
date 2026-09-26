import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { ApiError } from '../utils/ApiError.js';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

// The uploads directory still exists because `storage.service` writes
// to it in dev when Cloudinary isn't configured. With Cloudinary
// active in production, nothing is written here.
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

/* ─── Size caps ────────────────────────────────────────────────────
   Memory storage holds the whole file in a Buffer. On Render's free
   tier (512 MB RAM), a 500 MB upload would immediately OOM the
   process. Two mitigations:

     1. Both storages are memory-based, so we can't rely on multer
        spilling to disk.

     2. The recordings cap is 50 MB. A class recording of a 60-minute
        session at typical web-video bitrates (1–2 Mbps) is ~7–15 MB,
        so 50 MB is generous. If a session is longer, instructors
        should split it into multiple recordings.

   The media library cap is 50 MB too. Images, PDFs, and short videos
   fit comfortably; anything bigger should be hosted elsewhere and
   linked.

   Both caps can be raised once the service runs on a paid tier.
   ────────────────────────────────────────────────────────────────── */

const RECORDING_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const MEDIA_MAX_BYTES = 50 * 1024 * 1024; // 50 MB

/* ─── Recordings ──────────────────────────────────────────────────
   Class recordings. Video only. Memory storage as of Batch 2.3.
   ────────────────────────────────────────────────────────────────── */

const RECORDING_EXTS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.mkv']);

export const uploadRecording = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: RECORDING_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!RECORDING_EXTS.has(ext)) {
      return cb(new ApiError(400, `Unsupported file type: ${ext}`));
    }
    cb(null, true);
  },
}).single('recording');

/* ─── Media library ───────────────────────────────────────────────
   General-purpose assets. Memory storage as of Batch 2.4. Any MIME
   type is accepted; the media service categorizes on the server.
   ────────────────────────────────────────────────────────────────── */

export const uploadMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MEDIA_MAX_BYTES },
}).single('file');