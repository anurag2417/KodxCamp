import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { classesApi, type ApiChapter } from '../../lib/classes.api';
import { cn } from '../../lib/utils';

interface Props {
  classSlug: string;
  src: string;
  chapters?: ApiChapter[];
  initialSeconds?: number;
  onProgress?: (watched: number, duration: number) => void;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export const RecordingPlayer: React.FC<Props> = ({
  classSlug,
  src,
  chapters = [],
  initialSeconds = 0,
  onProgress,
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [current, setCurrent] = useState(initialSeconds);
  const [duration, setDuration] = useState(0);

  // Restore position on metadata load
  const handleLoadedMetadata = () => {
    const v = ref.current;
    if (!v) return;
    setDuration(v.duration || 0);
    if (initialSeconds > 0 && initialSeconds < (v.duration || Infinity)) {
      v.currentTime = initialSeconds;
    }
  };

  // Report watch progress every 5 seconds
  useEffect(() => {
    const id = window.setInterval(() => {
      const v = ref.current;
      if (!v || !v.duration || v.paused) return;
      onProgress?.(Math.floor(v.currentTime), Math.floor(v.duration));
    }, 5000);
    return () => window.clearInterval(id);
  }, [onProgress]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const jumpTo = (sec: number) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = sec;
    setCurrent(sec);
  };

  const changeSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(next);
    if (ref.current) ref.current.playbackRate = next;
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full flex-col bg-[#06191D]">
      <div className="relative flex-1 bg-black">
        <video
          ref={ref}
          src={src}
          className="h-full w-full"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={(e) => setCurrent((e.target as HTMLVideoElement).currentTime)}
          onEnded={() => setPlaying(false)}
        />
      </div>

      <div className="border-t border-[#1B4844] bg-[#092328] p-4">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={toggle}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </Button>

          <div className="text-xs text-[#C7D8D1]">
            {fmt(current)} / {fmt(duration)}
          </div>

          <button
            onClick={changeSpeed}
            className="ml-auto rounded-md bg-[#0D3032] px-3 py-1 text-xs font-medium text-[#8BBB92] hover:bg-[#12544F]"
          >
            {speed}×
          </button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => jumpTo(0)}
            title="Restart"
          >
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
                    ? 'bg-[#12544F] text-[#8BBB92]'
                    : 'bg-[#0D3032] text-[#88A39A] hover:bg-[#12544F]'
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