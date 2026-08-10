import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  type ImageProps,
  type ImageURISource,
} from "react-native";
import { resolveImageUrl } from "../api";

const RETRIES_PER_URL = 3;
const IMAGE_ATTEMPT_TIMEOUT_MS = 12_000;
const IMAGE_PREFETCH_TIMEOUT_MS = 8_000;

export function remoteImageCandidates(source: string) {
  const resolved = resolveImageUrl(source.trim());
  const candidates = [resolved];

  try {
    const url = new URL(resolved);
    if (url.hostname === "thapl-public.storage.yandexcloud.net") {
      url.hostname = "storage.yandexcloud.net";
      url.pathname = `/thapl-public${url.pathname}`;
      candidates.push(url.toString());
    } else if (
      url.hostname === "storage.yandexcloud.net"
      && url.pathname.startsWith("/thapl-public/")
    ) {
      url.hostname = "thapl-public.storage.yandexcloud.net";
      url.pathname = url.pathname.slice("/thapl-public".length);
      candidates.push(url.toString());
    }
  } catch {
    // React Native will report malformed URLs through onError below.
  }

  return [...new Set(candidates)];
}

function prefetchCandidate(uri: string) {
  return new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), IMAGE_PREFETCH_TIMEOUT_MS);
    Image.prefetch(uri).then(
      (loaded) => {
        clearTimeout(timer);
        resolve(loaded);
      },
      () => {
        clearTimeout(timer);
        resolve(false);
      },
    );
  });
}

export async function prefetchRemoteImage(source: string) {
  for (const candidate of remoteImageCandidates(source)) {
    if (await prefetchCandidate(candidate)) return true;
  }
  return false;
}

function retrySource(uri: string, retry: number): ImageURISource {
  if (!retry) return { uri };
  return {
    uri: `${uri}${uri.includes("?") ? "&" : "?"}nakta_image_retry=${retry}`,
  };
}

type Props = Omit<ImageProps, "source" | "onError" | "onLoad"> & {
  source: string;
  onFinalError?: () => void;
  onLoaded?: () => void;
  priority?: "normal" | "high";
};

export function RemoteImage({
  source,
  onFinalError,
  onLoaded,
  priority: _priority = "normal",
  ...props
}: Props) {
  const candidates = useMemo(() => remoteImageCandidates(source), [source]);
  const [attempt, setAttempt] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptFinished = useRef(false);
  const totalAttempts = Math.max(1, candidates.length * RETRIES_PER_URL);
  const candidate = candidates[attempt % candidates.length] ?? resolveImageUrl(source);
  const retry = Math.floor(attempt / candidates.length);

  useEffect(() => {
    setAttempt(0);
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [source]);

  const failAttempt = (error: string) => {
    if (attemptFinished.current) return;
    attemptFinished.current = true;
    if (retryTimer.current) clearTimeout(retryTimer.current);
    if (attempt + 1 < totalAttempts) {
      const delay = Math.min(2_500, 300 * (2 ** retry));
      retryTimer.current = setTimeout(() => {
        setAttempt((current) => current + 1);
      }, delay);
    } else {
      console.warn("[image] remote image failed after retries", {
        candidates,
        error,
        source,
      });
      onFinalError?.();
    }
  };

  return (
    <Image
      {...props}
      fadeDuration={props.fadeDuration ?? 120}
      key={`${candidate}:${retry}`}
      onError={(event) => {
        failAttempt(event?.nativeEvent?.error ?? "Unknown native image error");
      }}
      onLoad={() => {
        if (attemptFinished.current) return;
        attemptFinished.current = true;
        if (retryTimer.current) clearTimeout(retryTimer.current);
        onLoaded?.();
      }}
      onLoadStart={() => {
        attemptFinished.current = false;
        if (retryTimer.current) clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => {
          failAttempt("Image request timed out");
        }, IMAGE_ATTEMPT_TIMEOUT_MS);
        props.onLoadStart?.();
      }}
      progressiveRenderingEnabled={props.progressiveRenderingEnabled ?? true}
      // Android otherwise decodes every 1152×1152 catalog thumbnail at full
      // size. Decode to the rendered size and let Fresco manage request
      // concurrency. A JavaScript-wide semaphore used here previously let a
      // stalled promotion block catalog and related-product images forever.
      resizeMethod={props.resizeMethod ?? "resize"}
      source={retrySource(candidate, retry)}
    />
  );
}
