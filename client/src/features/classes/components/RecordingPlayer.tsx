import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import type { ApiChapter } from '@/features/classes/api';
import { cn } from '@/shared/lib/utils';

interface Props {
  classSlug: string;
  src: string;
  chapters?: ApiChapter[];
  initialSeconds?: number;
  onProgress?: (watched: number, duration: number) => void;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const SPEED_KEY = 'kodxcamp-player-speed';

export const RecordingPlayer: React.FC<Props> = ({
  src,
  chapters = [],
  initialSeconds = 0,
  onProgress,
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const onProgressRef = useRef(onProgress);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(() => {
    const s = Number(localStorage.getItem(SPEED_KEY));
    return SPEEDS.includes(s) ? s : 1;
  });
  const [current, setCurrent] = useState(initialSeconds);
  const [duration, setDuration] = useState(0);

  // Keep the ref in sync so the interval closure sees the latest callback
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  // Restore playback rate when speed changes
  useEffect(() => {
    if (ref.current) ref.current.playbackRate = speed;
    localStorage.setItem(SPEED_KEY, String(speed));
  }, [speed]);

  // Interval - never depends on onProgress (that was the bug)
  useEffect(() => {
    const id = window.setInterval(() => {
      const v = ref.current;
      if (!v || !v.duration || v.paused) return;
      onProgressRef.current?.(Math.floor(v.currentTime), Math.floor(v.duration));
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  // Save final progress on unmount
  useEffect(() => {
    const video = ref.current;
    return () => {
      if (!video) return;
      if (video.duration > 0) {
        onProgressRef.current?.(
          Math.floor(video.currentTime),
          Math.floor(video.duration)
        );
      }
    };
  }, []);

  const handleLoadedMetadata = () => {
    const v = ref.current;
    if (!v) return;
    setDuration(v.duration || 0);
    if (initialSeconds > 0 && initialSeconds < (v.duration || Infinity)) {
      v.currentTime = initialSeconds;
    }
    v.playbackRate = speed;
  };

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
      // Save on pause
      if (v.duration > 0) {
        onProgressRef.current?.(Math.floor(v.currentTime), Math.floor(v.duration));
      }
    }
  };

  const jumpTo = (sec: number) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = sec;
    setCurrent(sec);
  };

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full flex-col bg-[var(--color-code-bg)]">
      <div className="relative flex-1 bg-black">
        <video
          ref={ref}
          src={src}
          className="h-full w-full"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={(e) =>
            setCurrent((e.target as HTMLVideoElement).currentTime)
          }
          onEnded={() => {
            setPlaying(false);
            const v = ref.current;
            if (v && v.duration > 0) {
              onProgressRef.current?.(
                Math.floor(v.duration),
                Math.floor(v.duration)
              );
            }
          }}
        />
      </div>

      <div className="border-t border-[var(--color-code-border)] bg-[var(--color-code-surface)] p-4">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={toggle}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </Button>

          <div className="text-xs text-[var(--color-code-text)]">
            {fmt(current)} / {fmt(duration)}
          </div>

          <button
            onClick={cycleSpeed}
            className="ml-auto rounded-md bg-[var(--color-surface-tertiary)] px-3 py-1 text-xs font-medium text-[var(--color-success)] hover:bg-[var(--color-border)]"
          >
            {speed}×
          </button>

          <Button size="sm" variant="ghost" onClick={() => jumpTo(0)} title="Restart">
            <RotateCcw size={14} />
          </Button>
        </div>

        {chapters.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {chapters.map((c) => (
              <button
                key={c.startSec}
                onClick={() => jumpTo(c.startSec)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs transition-colors',
                  current >= c.startSec
                    ? 'bg-[var(--color-primary-700)] text-[var(--color-success)]'
                    : 'bg-[var(--color-surface-tertiary)] text-[var(--color-code-muted)] hover:bg-[var(--color-border)]'
                )}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
