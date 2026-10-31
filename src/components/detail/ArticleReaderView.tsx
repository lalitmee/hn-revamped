'use client';

import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { ReaderArticle } from '@/types/hn';
import { GlassDropdown } from '@/components/ui/GlassDropdown';

interface ArticleReaderViewProps {
  url?: string;
  storyTitle: string;
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2] as const;

const KOKORO_VOICES = [
  { id: 'kokoro:af_heart', label: 'Kokoro · Heart (local)' },
  { id: 'kokoro:af_bella', label: 'Kokoro · Bella (local)' },
  { id: 'kokoro:af_nova', label: 'Kokoro · Nova (local)' },
  { id: 'kokoro:am_michael', label: 'Kokoro · Michael (local)' },
];

export interface SpokenSegment {
  index: number;
  text: string;
}

/**
 * Annotates top-level readable blocks with `data-tts-idx` and extracts
 * clean, code-aware spoken segments (skipping <pre> code blocks and raw URLs)
 * so Chromium TTS never chokes on 15s limits or reads syntax aloud.
 */
export function prepareReaderSpeechSegments(
  rawHtml: string,
  title: string
): { annotatedHtml: string; segments: SpokenSegment[] } {
  if (!rawHtml) {
    return { annotatedHtml: '', segments: [] };
  }

  const segments: SpokenSegment[] = [];
  if (title.trim()) {
    segments.push({ index: 0, text: title.trim() });
  }

  if (typeof DOMParser === 'undefined') {
    return { annotatedHtml: rawHtml, segments };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');
    const blockElements = doc.body.querySelectorAll(
      'h1, h2, h3, h4, p, li, blockquote'
    );

    blockElements.forEach((el) => {
      // Skip elements nested inside <pre> or another already-selected block (e.g. <p> inside <blockquote>)
      if (el.closest('pre')) return;
      const parentBlock = el.parentElement?.closest('p, li, blockquote');
      if (parentBlock) return;

      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('pre, script, style').forEach((n) => n.remove());

      // Clean out raw long URLs so TTS doesn't spell out https://...
      const spokenText = (clone.textContent || '')
        .replace(/https?:\/\/\S+/gi, 'link')
        .replace(/\s+/g, ' ')
        .trim();

      if (spokenText.length < 3) return;

      const segIdx = segments.length;
      el.setAttribute('data-tts-idx', String(segIdx));
      segments.push({ index: segIdx, text: spokenText });
    });

    return {
      annotatedHtml: doc.body.innerHTML,
      segments,
    };
  } catch {
    return { annotatedHtml: rawHtml, segments };
  }
}

export const ArticleReaderView: React.FC<ArticleReaderViewProps> = ({
  url,
  storyTitle,
}) => {
  const [article, setArticle] = useState<ReaderArticle | null>(null);
  const [loading, setLoading] = useState(false);

  // Audio Reader State
  const [ttsSupported, setTtsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [playbackState, setPlaybackState] = useState<
    'idle' | 'playing' | 'paused'
  >('idle');
  const [activeSegmentIdx, setActiveSegmentIdx] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [ttsNotice, setTtsNotice] = useState<string | null>(null);

  const articleBodyRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<number>(0);
  const playbackRateRef = useRef<number>(1);
  const selectedVoiceRef = useRef<string>('');
  const speechSeqRef = useRef<number>(0);
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerReadyRef = useRef(false);
  const workerErrorRef = useRef<string | null>(null);
  type GeneratedAudio = { audio: Float32Array; sampleRate: number };
  const requestsRef = useRef(
    new Map<
      number,
      {
        resolve: (result: GeneratedAudio) => void;
        reject: (error: Error) => void;
      }
    >()
  );
  const nextRequestIdRef = useRef(0);
  const prefetchedRef = useRef<{
    key: string;
    promise: Promise<GeneratedAudio>;
  } | null>(null);

  const requestAudio = useCallback(
    (
      text: string,
      voice: string,
      speed: number,
      priority: 'play' | 'prefetch'
    ) => {
      const worker = workerRef.current;
      if (!worker || workerErrorRef.current) {
        return Promise.reject(
          new Error(
            workerErrorRef.current ?? 'Local voice worker is unavailable.'
          )
        );
      }
      const id = ++nextRequestIdRef.current;
      return new Promise<GeneratedAudio>((resolve, reject) => {
        requestsRef.current.set(id, { resolve, reject });
        worker.postMessage({
          type: 'generate',
          id,
          text,
          voice,
          speed,
          priority,
        });
      });
    },
    []
  );

  // Load native voices when available; local Kokoro only needs Web Audio.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasNativeTts = 'speechSynthesis' in window;
    setTtsSupported(hasNativeTts || 'AudioContext' in window);
    if (!hasNativeTts) {
      setSelectedVoiceURI('kokoro:af_heart');
      selectedVoiceRef.current = 'kokoro:af_heart';
      return;
    }

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices() || [];
      const englishOrAll =
        available.filter((v) => v.lang.toLowerCase().startsWith('en')).length >
        0
          ? available.filter((v) => v.lang.toLowerCase().startsWith('en'))
          : available;
      setVoices(englishOrAll);
      if (englishOrAll.length > 0 && !selectedVoiceRef.current) {
        const preferred =
          englishOrAll.find((v) =>
            /natural|google|siri|premium/i.test(v.name)
          ) ||
          englishOrAll.find((v) => v.default) ||
          englishOrAll[0];
        if (preferred) {
          setSelectedVoiceURI(preferred.voiceURI);
          selectedVoiceRef.current = preferred.voiceURI;
        }
      }
    };

    updateVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.(
        'voiceschanged',
        updateVoices
      );
      window.speechSynthesis.cancel();
    };
  }, []);

  // Reader View is mounted only for the active reader tab. Prewarm the model
  // here, not on site load; the worker keeps downloads and WASM off the UI thread.
  useEffect(() => {
    if (
      typeof Worker === 'undefined' ||
      typeof window.AudioContext === 'undefined'
    )
      return;
    let worker: Worker;
    try {
      worker = new Worker(
        new URL('../../lib/kokoro-worker.ts', import.meta.url),
        {
          type: 'module',
        }
      );
    } catch {
      workerErrorRef.current = 'Could not start the local voice worker.';
      return;
    }
    workerRef.current = worker;
    worker.onmessage = (
      event: MessageEvent<{
        type: 'ready' | 'audio' | 'error';
        id: number;
        audio?: Float32Array;
        samplingRate?: number;
        message?: string;
      }>
    ) => {
      const response = event.data;
      if (response.type === 'ready') {
        workerReadyRef.current = true;
        return;
      }
      if (response.type === 'error' && response.id === 0) {
        workerErrorRef.current =
          response.message ?? 'Local voice failed to load.';
        return;
      }
      const request = requestsRef.current.get(response.id);
      if (!request) return;
      requestsRef.current.delete(response.id);
      if (response.type === 'error')
        request.reject(new Error(response.message ?? 'Local voice failed.'));
      else if (response.audio && response.samplingRate)
        request.resolve({
          audio: response.audio,
          sampleRate: response.samplingRate,
        });
    };
    worker.onerror = () => {
      workerErrorRef.current = 'The local voice worker stopped unexpectedly.';
      requestsRef.current.forEach(({ reject }) =>
        reject(new Error(workerErrorRef.current!))
      );
      requestsRef.current.clear();
    };
    worker.postMessage({ type: 'load', id: 0 });
    return () => {
      requestsRef.current.forEach(({ reject }) =>
        reject(new Error('Local voice worker closed.'))
      );
      requestsRef.current.clear();
      prefetchedRef.current = null;
      worker.terminate();
      workerRef.current = null;
      workerReadyRef.current = false;
      audioSourceRef.current?.stop();
      void audioContextRef.current?.close();
    };
  }, []);

  const stopSpeech = useCallback(() => {
    speechSeqRef.current += 1;
    prefetchedRef.current = null;
    if (speakTimerRef.current) {
      clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioSourceRef.current) {
      audioSourceRef.current.onended = null;
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setPlaybackState('idle');
    setActiveSegmentIdx(0);
    activeSegmentRef.current = 0;
  }, []);

  useEffect(() => {
    stopSpeech();
    setTtsNotice(null);
    if (!url) return;

    const cacheKey = `hn_reader_${url}`;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const cached = window.sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          setArticle(parsed);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Ignore sessionStorage read error (e.g., incognito restrictions)
    }

    let active = true;
    setLoading(true);
    fetch(`/api/reader?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setArticle(data);
          setLoading(false);
          try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
              window.sessionStorage.setItem(cacheKey, JSON.stringify(data));
            }
          } catch {
            // Ignore quota errors
          }
        }
      })
      .catch(() => {
        if (active) {
          setArticle({
            url,
            title: storyTitle,
            contentHtml: '',
            textContent: '',
            readingTimeMinutes: 1,
            fallbackType: 'blocked',
          });
          setLoading(false);
        }
      });
    return () => {
      active = false;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audioSourceRef.current) {
        audioSourceRef.current.onended = null;
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
      }
    };
  }, [url, storyTitle, stopSpeech]);

  const { annotatedHtml, segments } = useMemo(
    () => prepareReaderSpeechSegments(article?.contentHtml || '', storyTitle),
    [article?.contentHtml, storyTitle]
  );

  // Memoize the dangerouslySetInnerHTML object so React never resets DOM attributes
  // (such as data-tts-active="true") on unrelated state re-renders like speed/voice changes.
  const articleHtmlMarkup = useMemo(
    () => ({ __html: annotatedHtml }),
    [annotatedHtml]
  );

  // Highlight and smoothly scroll the currently spoken paragraph into view
  useEffect(() => {
    const container = articleBodyRef.current;
    if (!container) return;

    container.querySelectorAll('[data-tts-active="true"]').forEach((el) => {
      el.removeAttribute('data-tts-active');
    });

    if (playbackState === 'idle') return;

    // Segment 0 is the story title; if segment 0 is playing, highlight the first body paragraph (idx 1) so the tracker is always visible on the text
    const highlightIdx =
      activeSegmentIdx === 0 && segments.length > 1 ? 1 : activeSegmentIdx;
    const target = container.querySelector<HTMLElement>(
      `[data-tts-idx="${highlightIdx}"]`
    );
    if (target) {
      target.setAttribute('data-tts-active', 'true');
      if (typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [
    activeSegmentIdx,
    playbackState,
    playbackRate,
    selectedVoiceURI,
    segments.length,
  ]);

  const speakSegmentAt = useCallback(
    (index: number) => {
      if (typeof window === 'undefined') return;
      if (index < 0 || index >= segments.length) {
        setPlaybackState('idle');
        setActiveSegmentIdx(0);
        activeSegmentRef.current = 0;
        return;
      }

      const seq = ++speechSeqRef.current;
      if (speakTimerRef.current) {
        clearTimeout(speakTimerRef.current);
        speakTimerRef.current = null;
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (audioSourceRef.current) {
        audioSourceRef.current.onended = null;
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
      }

      setActiveSegmentIdx(index);
      activeSegmentRef.current = index;
      setPlaybackState('playing');
      setTtsNotice(null);

      const seg = segments[index];
      const selectedVoice = selectedVoiceRef.current;
      const kokoroVoice = selectedVoice.startsWith('kokoro:')
        ? selectedVoice.slice('kokoro:'.length)
        : null;

      if (kokoroVoice) {
        // Resume the audio context synchronously inside the click gesture, before
        // model loading/inference awaits, so browser autoplay policies allow playback.
        const AudioContextConstructor = window.AudioContext;
        if (!AudioContextConstructor) {
          setPlaybackState('idle');
          setTtsNotice(
            'Local voice playback is not supported in this browser.'
          );
          return;
        }
        const context =
          audioContextRef.current ??
          (audioContextRef.current = new AudioContextConstructor());
        void context.resume();
        setTtsNotice(
          'Loading the local voice model (first use requires a download)…'
        );

        const speed = playbackRateRef.current;
        const key = JSON.stringify([index, seg.text, kokoroVoice, speed]);
        const cached = prefetchedRef.current;
        const audioPromise =
          cached?.key === key
            ? cached.promise
            : requestAudio(seg.text, kokoroVoice, speed, 'play');
        prefetchedRef.current = null;
        setTtsNotice(
          cached?.key === key
            ? 'Preparing local speech…'
            : workerReadyRef.current
              ? 'Generating local speech…'
              : 'Loading the local voice model (first use requires a download)…'
        );
        void audioPromise
          .then(({ audio, sampleRate }) => {
            if (speechSeqRef.current !== seq) return;
            const buffer = context.createBuffer(1, audio.length, sampleRate);
            buffer.copyToChannel(new Float32Array(audio), 0);
            setTtsNotice(null);
            const source = context.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.value = playbackRateRef.current;
            source.onended = () => {
              if (speechSeqRef.current !== seq) return;
              audioSourceRef.current = null;
              const nextIdx = activeSegmentRef.current + 1;
              if (nextIdx < segments.length) speakSegmentAt(nextIdx);
              else {
                setPlaybackState('idle');
                setActiveSegmentIdx(0);
                activeSegmentRef.current = 0;
              }
            };
            audioSourceRef.current = source;
            source.connect(context.destination);
            source.start();

            // Keep only one lookahead; don't synthesize the whole article.
            const next = segments[index + 1];
            if (next) {
              const nextKey = JSON.stringify([
                index + 1,
                next.text,
                kokoroVoice,
                speed,
              ]);
              const promise = requestAudio(
                next.text,
                kokoroVoice,
                speed,
                'prefetch'
              );
              // A speculative failure must not produce an unhandled rejection.
              void promise.catch(() => {});
              prefetchedRef.current = { key: nextKey, promise };
            }
          })
          .catch((error: unknown) => {
            if (speechSeqRef.current !== seq) return;
            setPlaybackState('idle');
            setTtsNotice(
              `Could not load the local voice: ${error instanceof Error ? error.message : 'Unknown error.'}`
            );
          });
        return;
      }

      if (!('speechSynthesis' in window)) {
        setPlaybackState('idle');
        setTtsNotice('No system speech voice is available in this browser.');
        return;
      }

      // Delay speak() by 20ms after cancel() so Chromium/Linux speechSynthesis
      // does not cancel or drop the newly queued utterance when changing speed/voice.
      speakTimerRef.current = setTimeout(() => {
        if (speechSeqRef.current !== seq) return;

        const utterance = new SpeechSynthesisUtterance(seg.text);
        utterance.rate = playbackRateRef.current;

        const availableVoices = window.speechSynthesis.getVoices() || [];
        if (selectedVoice) {
          const matched = availableVoices.find(
            (v) => v.voiceURI === selectedVoice
          );
          if (matched) utterance.voice = matched;
        }

        utterance.onend = () => {
          if (speechSeqRef.current !== seq) return;
          const nextIdx = activeSegmentRef.current + 1;
          if (nextIdx < segments.length) {
            speakSegmentAt(nextIdx);
          } else {
            setPlaybackState('idle');
            setActiveSegmentIdx(0);
            activeSegmentRef.current = 0;
          }
        };

        utterance.onerror = (event) => {
          if (speechSeqRef.current !== seq) return;
          if (event.error === 'interrupted' || event.error === 'canceled')
            return;
          setPlaybackState('idle');
          setTtsNotice(
            'No speech synthesis voice responded on this system. Check your OS speech-dispatcher or browser TTS settings.'
          );
        };

        window.speechSynthesis.speak(utterance);
      }, 20);
    },
    [segments, requestAudio]
  );

  const handleTogglePlayPause = () => {
    if (!ttsSupported || segments.length === 0) return;

    const usingKokoro = selectedVoiceRef.current.startsWith('kokoro:');
    if (playbackState === 'playing') {
      if (usingKokoro) {
        void audioContextRef.current?.suspend();
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      setPlaybackState('paused');
    } else if (playbackState === 'paused') {
      if (usingKokoro) {
        void audioContextRef.current?.resume();
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
      setPlaybackState('playing');
    } else {
      speakSegmentAt(activeSegmentIdx || 0);
    }
  };

  const handleStepSegment = (delta: number) => {
    if (segments.length === 0) return;
    const nextIdx = Math.min(
      segments.length - 1,
      Math.max(0, activeSegmentRef.current + delta)
    );
    speakSegmentAt(nextIdx);
  };

  const handleCycleSpeed = () => {
    const currIdx = SPEED_OPTIONS.indexOf(
      playbackRate as (typeof SPEED_OPTIONS)[number]
    );
    const nextSpeed = SPEED_OPTIONS[(currIdx + 1) % SPEED_OPTIONS.length];
    setPlaybackRate(nextSpeed);
    playbackRateRef.current = nextSpeed;
    if (playbackState === 'playing') {
      speakSegmentAt(activeSegmentRef.current);
    }
  };

  if (!url) {
    return (
      <div
        style={{ color: 'var(--text-muted)' }}
        className="py-16 text-center flex flex-col items-center gap-2"
      >
        <span className="material-symbols-rounded text-[36px]">forum</span>
        <p>
          This is a text-only Hacker News discussion without an external URL.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 py-6">
        <div
          style={{ backgroundColor: 'var(--bg-surface-2)' }}
          className="h-8 w-2/3 rounded-xl animate-pulse"
        />
        <div
          style={{ backgroundColor: 'var(--bg-surface-1)' }}
          className="h-64 w-full rounded-2xl animate-pulse"
        />
      </div>
    );
  }

  if (article?.fallbackType === 'youtube' && article.youtubeVideoId) {
    return (
      <div className="py-4">
        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${article.youtubeVideoId}`}
            title={storyTitle}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  if (!article || article.fallbackType || !article.contentHtml) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-surface-1)',
          borderColor: 'var(--border-subtle)',
        }}
        className="p-8 rounded-2xl border text-center flex flex-col items-center gap-4 my-4"
      >
        <span
          style={{ color: 'var(--accent)' }}
          className="material-symbols-rounded text-[40px]"
        >
          open_in_new
        </span>
        <div>
          <h4 className="text-lg font-semibold mb-1">{storyTitle}</h4>
          <p
            style={{ color: 'var(--text-muted)' }}
            className="text-sm max-w-md"
          >
            This resource (
            {article?.fallbackType?.toUpperCase() || 'External Site'}) is best
            viewed directly in its original tab.
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shadow hover:brightness-110 transition"
        >
          <span>Open Original Article</span>
          <span className="material-symbols-rounded text-[18px]">
            north_east
          </span>
        </a>
      </div>
    );
  }

  const isAudioActive = playbackState !== 'idle';
  const progressPct =
    segments.length > 0
      ? Math.round(((activeSegmentIdx + 1) / segments.length) * 100)
      : 0;

  return (
    <article
      style={{
        backgroundColor: 'var(--bg-surface-1)',
        borderColor: 'var(--border-subtle)',
      }}
      className="pt-3.5 px-4 md:px-5 pb-5 rounded-2xl border my-1"
    >
      {/* Reader Metadata & Integrated Liquid Glass Audio Reader Bar */}
      <div
        style={{
          color: 'var(--text-muted)',
          borderColor: 'var(--border-subtle)',
        }}
        className="flex flex-col gap-2.5 pb-2.5 mb-3.5 border-b text-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-rounded text-[15px]">
                schedule
              </span>
              {article.readingTimeMinutes} min read
            </span>
            {article.byline && <span>• By {article.byline}</span>}
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {ttsSupported && segments.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Play / Pause / Resume Button with Filled Media Icons */}
                <button
                  type="button"
                  onClick={handleTogglePlayPause}
                  style={{
                    backgroundColor: isAudioActive
                      ? 'var(--accent)'
                      : 'var(--bg-surface-2)',
                    color: isAudioActive ? '#ffffff' : 'var(--text-primary)',
                    border: '1px solid transparent',
                  }}
                  className="h-8 px-3.5 rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold leading-none cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                >
                  <span
                    style={{
                      color: isAudioActive ? '#ffffff' : 'var(--accent)',
                    }}
                    className={`material-symbols-rounded text-[16px] leading-none ${
                      isAudioActive ? 'filled' : ''
                    }`}
                  >
                    {playbackState === 'playing'
                      ? 'pause'
                      : playbackState === 'paused'
                        ? 'play_arrow'
                        : 'headphones'}
                  </span>
                  <span className="leading-none">
                    {playbackState === 'playing'
                      ? 'Pause'
                      : playbackState === 'paused'
                        ? 'Resume'
                        : 'Listen'}
                  </span>
                </button>

                {/* Active Playback Controls: Unified Stepper Pill, Speed Pill, Custom Voice Dropdown, Red Stop Button */}
                {isAudioActive && (
                  <>
                    {/* Unified Paragraph Stepper Capsule [ |◄  2/8  ►| ] */}
                    <div className="liquid-glass h-8 px-1 rounded-full inline-flex items-center gap-0.5 leading-none">
                      <button
                        type="button"
                        title="Previous paragraph"
                        aria-label="Previous paragraph"
                        disabled={activeSegmentIdx <= 0}
                        onClick={() => handleStepSegment(-1)}
                        style={{ color: 'var(--text-primary)' }}
                        className="w-6 h-6 rounded-full inline-flex items-center justify-center leading-none hover:bg-white/10 disabled:opacity-35 active:scale-90 transition-all"
                      >
                        <span className="material-symbols-rounded filled text-[16px] leading-none">
                          skip_previous
                        </span>
                      </button>

                      <span
                        style={{ color: 'var(--text-secondary)' }}
                        className="px-1.5 inline-flex items-center justify-center text-[11.5px] font-semibold tabular-nums leading-none select-none"
                      >
                        {activeSegmentIdx + 1}/{segments.length}
                      </span>

                      <button
                        type="button"
                        title="Next paragraph"
                        aria-label="Next paragraph"
                        disabled={activeSegmentIdx >= segments.length - 1}
                        onClick={() => handleStepSegment(1)}
                        style={{ color: 'var(--text-primary)' }}
                        className="w-6 h-6 rounded-full inline-flex items-center justify-center leading-none hover:bg-white/10 disabled:opacity-35 active:scale-90 transition-all"
                      >
                        <span className="material-symbols-rounded filled text-[16px] leading-none">
                          skip_next
                        </span>
                      </button>
                    </div>

                    <button
                      type="button"
                      title="Cycle playback speed"
                      onClick={handleCycleSpeed}
                      style={{ color: 'var(--accent)' }}
                      className="liquid-glass h-8 px-3 rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-bold tabular-nums leading-none cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-rounded text-[16px] leading-none">
                        speed
                      </span>
                      <span className="leading-none">{playbackRate}×</span>
                    </button>

                    <GlassDropdown<string>
                      size="sm"
                      leadingIcon="record_voice_over"
                      ariaLabel="Select speech synthesis voice"
                      value={selectedVoiceURI}
                      options={[
                        { id: '', label: 'System default', icon: 'devices' },
                        ...voices.map((v) => ({
                          id: v.voiceURI,
                          label: v.name.replace(
                            /Microsoft |Google |Apple /g,
                            ''
                          ),
                          icon: 'graphic_eq',
                        })),
                        ...KOKORO_VOICES.map((voice) => ({
                          ...voice,
                          icon: 'graphic_eq',
                        })),
                      ]}
                      onChange={(voiceId) => {
                        setSelectedVoiceURI(voiceId);
                        selectedVoiceRef.current = voiceId;
                        if (playbackState === 'playing') {
                          speakSegmentAt(activeSegmentRef.current);
                        }
                      }}
                    />

                    <button
                      type="button"
                      title="Stop audio reader"
                      aria-label="Stop audio reader"
                      onClick={stopSpeech}
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.14)',
                        color: '#EF4444',
                        border: '1px solid transparent',
                      }}
                      className="w-8 h-8 rounded-full inline-flex items-center justify-center leading-none cursor-pointer hover:bg-red-500/25 active:scale-90 transition-all"
                    >
                      <span className="material-symbols-rounded filled text-[16px] leading-none">
                        stop
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Live Progress Bar When Audio Reader Is Active */}
        {isAudioActive && (
          <div
            style={{ backgroundColor: 'var(--bg-surface-2)' }}
            className="w-full h-1 rounded-full overflow-hidden"
          >
            <div
              style={{
                width: `${progressPct}%`,
                backgroundColor: 'var(--accent)',
                transition: 'width 260ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className="h-full rounded-full"
            />
          </div>
        )}

        {ttsNotice && (
          <div
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--accent) 12%, transparent)',
              color: 'var(--text-secondary)',
            }}
            className="px-3 py-2 rounded-xl text-[11.5px] flex items-center justify-between gap-2"
          >
            <span>{ttsNotice}</span>
            <button
              type="button"
              onClick={() => setTtsNotice(null)}
              className="material-symbols-rounded text-[14px] cursor-pointer"
            >
              close
            </button>
          </div>
        )}
      </div>

      <div
        ref={articleBodyRef}
        onClick={(e) => {
          // Allow clicking any paragraph while Audio Reader is active to jump speech directly to it
          if (!isAudioActive) return;
          const block = (e.target as HTMLElement).closest('[data-tts-idx]');
          if (block) {
            const idx = Number(block.getAttribute('data-tts-idx'));
            if (Number.isFinite(idx)) {
              speakSegmentAt(idx);
            }
          }
        }}
        className="hn-prose hn-article-body space-y-3.5"
        dangerouslySetInnerHTML={articleHtmlMarkup}
      />
    </article>
  );
};
