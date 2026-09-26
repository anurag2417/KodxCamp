import { isCloudinaryConfigured } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { localStorageProvider } from './local.provider.js';
import { cloudinaryStorageProvider } from './cloudinary.provider.js';
import type { StorageProvider } from './types.js';

export type {
  StorageProvider,
  StoredFile,
  RecordingUploadInput,
} from './types.js';

/**
 * Active storage provider.
 *
 * Resolved once, on first import. Cloudinary is used when it's fully
 * configured (see `isCloudinaryConfigured`); the local-disk provider
 * is the fallback.
 *
 * The choice is made once per process — if you change an env var,
 * restart the server. This matches the rest of the app's policy (see
 * `aiProviderRegistry`).
 */
const activeProvider: StorageProvider = isCloudinaryConfigured()
  ? cloudinaryStorageProvider
  : localStorageProvider;

logger.info('Storage provider selected', {
  provider: activeProvider.name,
  cloudinaryConfigured: isCloudinaryConfigured(),
});

/**
 * Public façade. This is the ONLY module that consumers should
 * import. Every method delegates to the active provider.
 *
 * The façade exists (rather than re-exporting `activeProvider`
 * directly) for two reasons:
 *
 *   1. It hides the provider's `name` and any future provider-only
 *      methods from the public API surface.
 *
 *   2. It's the place to add cross-cutting concerns later (retries,
 *      metrics, per-call logging) without changing the interface.
 *
 * Naming note: the façade keeps the original `storageService` name
 * so existing imports of `../services/storage.service.js` continue
 * to resolve. See `storage.service.ts`, which re-exports this file.
 */
export const storageService = {
  /**
   * The active provider's name. Useful for diagnostics and health
   * checks. Not part of the interface — it's a passthrough.
   */
  get providerName(): string {
    return activeProvider.name;
  },

  saveRecording(input: Parameters<StorageProvider['saveRecording']>[0]) {
    return activeProvider.saveRecording(input);
  },

  saveMedia(input: Parameters<StorageProvider['saveMedia']>[0]) {
    return activeProvider.saveMedia(input);
  },

  /**
   * @deprecated Use `deleteByUrl`.
   *
   * The original name was recording-specific (`deleteRecording`).
   * Kept as an alias so existing call sites in `media.service.ts`
   * continue to work through Batch 2.4. Remove once the media
   * service is updated to call `deleteByUrl`.
   */
  deleteRecording(url: string) {
    return activeProvider.deleteByUrl(url);
  },

  deleteByUrl(url: string) {
    return activeProvider.deleteByUrl(url);
  },

  toAbsoluteUrl(storedUrl: string) {
    return activeProvider.toAbsoluteUrl(storedUrl);
  },
};