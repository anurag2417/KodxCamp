import { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  File,
  Loader2,
  Check,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import {
  mediaApi,
  type ApiMediaAsset,
  type MediaKind,
} from '@/features/media/api';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { useToast } from '@/shared/hooks/useToast';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Restrict the visible/selectable assets to a single kind. */
  kindFilter?: MediaKind;
  /**
   * Called when the user picks an asset. The asset's URL is the
   * typical payload — a caller that stores a URL string (thumbnail,
   * hero video) uses `asset.url`.
   */
  onPick: (asset: ApiMediaAsset) => void;
  /**
   * Optional additional scoping. When true, `scope=all` is used and
   * the caller sees every asset in the system (admin only).
   */
  allOwners?: boolean;
}

/**
 * `LucideIcon` is lucide-react's canonical icon type. Its `size`
 * prop is `string | number` rather than `number`, so a hand-rolled
 * `ComponentType<{ size?: number }>` rejects every lucide icon. This
 * type is what every other icon map in the codebase uses.
 */
const KIND_ICON: Record<MediaKind, LucideIcon> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  pdf: FileText,
  other: File,
};

export const MediaLibrary: React.FC<Props> = ({
  open,
  onClose,
  kindFilter,
  onPick,
  allOwners = false,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<ApiMediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const reload = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const page = await mediaApi.list({
        scope: allOwners ? 'all' : 'mine',
        kind: kindFilter,
        limit: 60,
      });
      setAssets(page.assets);
    } catch {
      toast.error('Could not load media library');
    } finally {
      setLoading(false);
    }
  }, [open, allOwners, kindFilter, toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const asset = await mediaApi.upload(file);
      setAssets((prev) => [asset, ...prev]);
      toast.success(`Uploaded ${asset.originalName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset? This cannot be undone.')) return;
    try {
      await mediaApi.remove(id);
      setAssets((prev) => prev.filter((a) => a._id !== id));
      toast.success('Asset deleted');
    } catch {
      toast.error('Could not delete asset');
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-secondary">
            Media library
          </h2>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload size={14} /> Upload
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1.5 text-text-muted transition-colors hover:bg-surface-secondary"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading && assets.length === 0 && (
            <div className="flex justify-center py-12">
              <Spinner className="h-6 w-6" />
            </div>
          )}

          {!loading && assets.length === 0 && (
            <div className="grid place-items-center py-12 text-center">
              <ImageIcon size={32} className="text-text-muted" />
              <p className="mt-3 text-sm text-text-muted">
                No assets yet. Upload one to get started.
              </p>
            </div>
          )}

          {assets.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {assets.map((asset) => {
                const Icon = KIND_ICON[asset.kind];
                return (
                  <div
                    key={asset._id}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-secondary"
                  >
                    {asset.kind === 'image' ? (
                      <img
                        src={asset.url}
                        alt={asset.originalName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center">
                        <Icon size={32} className="text-text-muted" />
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          onPick(asset);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                      >
                        <Check size={12} /> Use this
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(asset._id)}
                        className="rounded p-1 text-white/80 transition-colors hover:bg-[var(--color-error)]/40 hover:text-white"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Name bar */}
                    <div className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-2 py-1 text-[10px] text-white">
                      {asset.originalName}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};