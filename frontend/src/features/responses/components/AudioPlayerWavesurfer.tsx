import { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WaveSurfer from 'wavesurfer.js';

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface AudioPlayerWavesurferProps {
  src: string;
}

export function AudioPlayerWavesurfer({ src }: AudioPlayerWavesurferProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'hsl(215, 16%, 47%)',
      progressColor: 'hsl(207, 72%, 25%)',
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 48,
      normalize: true,
      interact: true,
      dragToSeek: true,
      autoplay: false,
      mediaControls: false,
      url: src,
    });

    ws.on('ready', () => {
      setDuration(ws.getDuration());
      setReady(true);
    });
    ws.on('timeupdate', (time) => setCurrentTime(time));
    ws.on('play', () => setPlaying(true));
    ws.on('pause', () => setPlaying(false));
    ws.on('finish', () => {
      setPlaying(false);
      setCurrentTime(0);
    });

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
    };
  }, [src]);

  const toggle = useCallback(() => {
    wavesurferRef.current?.playPause();
  }, []);

  return (
    <div className="p-3 bg-muted/30 rounded-md border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full" onClick={toggle}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </Button>

        <span className="text-xs text-muted-foreground tabular-nums w-10 shrink-0">
          {formatTime(currentTime)}
        </span>

        <div className="flex-1" />

        <span className="text-xs text-muted-foreground tabular-nums w-10 shrink-0 text-right">
          {ready ? formatTime(duration) : '--:--'}
        </span>
      </div>

      <div ref={containerRef} className="w-full" />
    </div>
  );
}
