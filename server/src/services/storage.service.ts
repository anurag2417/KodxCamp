/**
 * Compatibility shim.
 *
 * The storage layer now lives in `./storage/`. This file re-exports
 * the façade so existing imports of `../services/storage.service.js`
 * resolve without changes.
 *
 * New code should import from `../services/storage/index.js`
 * directly. This shim exists for the two call sites that predate the
 * refactor: `class.service.ts` and `media.service.ts`.
 */
export { storageService } from './storage/index.js';
export type {
  StorageProvider,
  StoredFile,
  RecordingUploadInput,
} from './storage/types.js';