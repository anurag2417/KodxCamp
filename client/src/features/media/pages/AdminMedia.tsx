import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Upload, Trash2, Loader2 } from 'lucide-react';
import { mediaApi, type ApiMediaAsset, type MediaKind } from '@/features/media/api';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { useToast } from '@/shared/hooks/useToast';
import { cn } from '@/shared/lib/utils';

const KIND_FILTERS: { value: MediaKind | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audio' },
  { value: 'pdf', label: 'PDFs' },
  { value: 'other', label: 'Other' },
];

export const AdminMedia: React.FC = () => {
  const toast = useToast();
  const [assets, setAssets] = useState<ApiMediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<MediaKind | 'all'>('all');
  const [scope, setScope] = useState<'mine' | 'all'>('all');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const page = await mediaApi.list({
        scope,
        kind: filter === 'all' ? undefined : filter,
        limit: 100,
      });
      setAssets(page.assets);
    } catch {
      toast.error('Could not load media library');
    } finally {
      setLoading(false);
    }
  }, [scope, filter, toast]);

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
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await mediaApi.remove(id);
      setAssets((prev) => prev.filter((a) => a._id !== id));
      toast.success('Asset deleted');
    } catch {
      toast.error('Could not delete asset');
    }
  };

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Media library
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Upload and manage reusable assets.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={reload} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <label>
            <input
              type="file"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
                e.target.value = '';
              }}
            />
            <Button as-child disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload size={14} /> Upload
                </>
              )}
            </Button>
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {KIND_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              filter === f.value
                ? 'bg-brand-500 text-white'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-2 h-5 w-px bg-border" />
        {(['all', 'mine'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              scope === s
                ? 'bg-surface-tertiary text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            {s === 'all' ? 'All owners' : 'Mine'}
          </button>
        ))}
      </div>

      {loading && assets.length === 0 ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : assets.length === 0 ? (
        <Card className="p-8 text-center text-sm text-text-muted">
          No assets{filter !== 'all' ? ` of type "${filter}"` : ''}.
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {assets.map((asset) => (
            <Card key={asset._id} className="overflow-hidden p-0">
              <div className="aspect-square bg-surface-secondary">
                {asset.kind === 'image' ? (
                  <img
                    src={asset.url}
                    alt={asset.originalName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-2xl text-text-muted">
                    {asset.kind === 'video'
                      ? '🎬'
                      : asset.kind === 'audio'
                        ? '🎵'
                        : asset.kind === 'pdf'
                          ? '📄'
                          : '📎'}
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-medium text-text-primary">
                  {asset.originalName}
                </p>
                <p className="mt-0.5 text-[10px] text-text-muted">
                  {formatBytes(asset.sizeBytes)} · {asset.kind}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-brand-500 hover:underline"
                  >
                    Open
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      void handleDelete(asset._id, asset.originalName)
                    }
                    className="rounded p-1 text-text-muted transition-colors hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}