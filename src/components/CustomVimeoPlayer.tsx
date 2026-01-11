import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";
import {
  Play,
  Pause,
  Maximize,
  Volume2,
  SkipForward,
} from "lucide-react";

interface Props {
  vimeoId: string;
  onEnded?: () => void;
  startTime?: number;
}

export default function CustomVimeoPlayer({
  vimeoId,
  onEnded,
  startTime = 0,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<Player | null>(null);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!iframeRef.current) return;

    const player = new Player(iframeRef.current);
    playerRef.current = player;

    player.setCurrentTime(startTime);

    player.on("play", () => setPlaying(true));
    player.on("pause", () => setPlaying(false));

    player.on("timeupdate", (e) => {
      setProgress(e.seconds);
      setDuration(e.duration);
      // 🔥 энд Supabase руу progress save хийж болно
    });

    player.on("ended", () => {
      onEnded?.();
    });

    // ⌨️ Keyboard shortcuts
    const handleKey = (e: KeyboardEvent) => {
      if (!playerRef.current) return;

      if (e.code === "Space") {
        e.preventDefault();
        playing ? player.pause() : player.play();
      }

      if (e.code === "ArrowRight") {
        player.getCurrentTime().then((t) => player.setCurrentTime(t + 5));
      }

      if (e.code === "ArrowLeft") {
        player.getCurrentTime().then((t) => player.setCurrentTime(t - 5));
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
      player.destroy();
    };
  }, [vimeoId]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    playing ? playerRef.current.pause() : playerRef.current.play();
  };

  const changeSpeed = async () => {
    if (!playerRef.current) return;
    const next = speed === 1 ? 1.25 : speed === 1.25 ? 1.5 : 1;
    await playerRef.current.setPlaybackRate(next);
    setSpeed(next);
  };

  const fullscreen = () => {
    iframeRef.current?.requestFullscreen();
  };

  return (
    <div className="relative bg-black rounded-xl overflow-hidden">
      {/* 🎥 VIMEO IFRAME */}
      <iframe
        ref={iframeRef}
        src={`https://player.vimeo.com/video/${vimeoId}?background=0&title=0&byline=0&portrait=0`}
        className="w-full aspect-video"
        allow="autoplay; fullscreen"
      />

      {/* 🎛 CUSTOM CONTROLS */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center gap-4 text-white">
          <button onClick={togglePlay}>
            {playing ? <Pause /> : <Play />}
          </button>

          <div className="flex-1">
            <div className="h-1 bg-gray-600 rounded">
              <div
                className="h-1 bg-red-500 rounded"
                style={{ width: `${(progress / duration) * 100}%` }}
              />
            </div>
          </div>

          <button onClick={changeSpeed}>{speed}x</button>
          <button onClick={fullscreen}>
            <Maximize />
          </button>
        </div>
      </div>
    </div>
  );
}
