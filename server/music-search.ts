
export type JamendoSearchResult = {
  source: "jamendo";
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  license: string | null;
  downloadUrl: string;
  streamUrl: string;
};

export type ItunesSearchResult = {
  source: "itunes";
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  previewUrl: string;
  trackViewUrl: string;
  album: string | null;
};

export type MusicSearchResponse = {
  jamendo: JamendoSearchResult[];
  itunes: ItunesSearchResult[];
};

function getJamendoClientId(): string | undefined {
  return process.env.JAMENDO_CLIENT_ID?.trim() || undefined;
}

export async function searchJamendoTracks(query: string, limit = 8): Promise<JamendoSearchResult[]> {
  const clientId = getJamendoClientId();
  if (!clientId || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    client_id: clientId,
    format: "json",
    limit: String(limit),
    namesearch: query.trim(),
    audioformat: "mp32",
  });
  const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`);
  if (!res.ok) return [];
  const json = (await res.json()) as {
    results?: Array<{
      id: string;
      name: string;
      artist_name: string;
      duration: number;
      license_ccurl?: string;
      audiodownload?: string;
      audio?: string;
    }>;
  };

  return (json.results ?? [])
    .filter((t) => t.audiodownload || t.audio)
    .map((t) => ({
      source: "jamendo" as const,
      id: String(t.id),
      title: t.name,
      artist: t.artist_name,
      durationSeconds: Math.round(Number(t.duration) || 0),
      license: t.license_ccurl ?? null,
      downloadUrl: t.audiodownload ?? t.audio ?? "",
      streamUrl: t.audio ?? t.audiodownload ?? "",
    }));
}

export async function searchItunesTracks(query: string, limit = 8): Promise<ItunesSearchResult[]> {
  if (query.trim().length < 2) return [];
  const params = new URLSearchParams({
    term: query.trim(),
    media: "music",
    entity: "song",
    limit: String(limit),
    country: "RU",
  });
  const res = await fetch(`https://itunes.apple.com/search?${params}`);
  if (!res.ok) return [];
  const json = (await res.json()) as {
    results?: Array<{
      trackId: number;
      trackName: string;
      artistName: string;
      previewUrl?: string;
      trackViewUrl?: string;
      collectionName?: string;
      trackTimeMillis?: number;
    }>;
  };

  return (json.results ?? [])
    .filter((t) => t.previewUrl)
    .map((t) => ({
      source: "itunes" as const,
      id: String(t.trackId),
      title: t.trackName,
      artist: t.artistName,
      durationSeconds: Math.round((t.trackTimeMillis ?? 0) / 1000),
      previewUrl: t.previewUrl!,
      trackViewUrl: t.trackViewUrl ?? "",
      album: t.collectionName ?? null,
    }));
}

export async function searchMusicCatalog(query: string): Promise<MusicSearchResponse> {
  const [jamendo, itunes] = await Promise.all([
    searchJamendoTracks(query),
    searchItunesTracks(query),
  ]);
  return { jamendo, itunes };
}

export async function getJamendoTrackById(trackId: string): Promise<JamendoSearchResult | null> {
  const clientId = getJamendoClientId();
  if (!clientId) return null;
  const params = new URLSearchParams({
    client_id: clientId,
    format: "json",
    id: trackId,
    audioformat: "mp32",
  });
  const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`);
  if (!res.ok) return null;
  const json = (await res.json()) as {
    results?: Array<{
      id: string;
      name: string;
      artist_name: string;
      duration: number;
      license_ccurl?: string;
      audiodownload?: string;
      audio?: string;
    }>;
  };
  const t = json.results?.[0];
  if (!t || !(t.audiodownload || t.audio)) return null;
  return {
    source: "jamendo",
    id: String(t.id),
    title: t.name,
    artist: t.artist_name,
    durationSeconds: Math.round(Number(t.duration) || 0),
    license: t.license_ccurl ?? null,
    downloadUrl: t.audiodownload ?? t.audio ?? "",
    streamUrl: t.audio ?? t.audiodownload ?? "",
  };
}

function isJamendoDownloadUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.endsWith("jamendo.com") || h.endsWith("jamendo.net");
  } catch {
    return false;
  }
}

export async function importJamendoTrackToBlob(trackId: string): Promise<{
  fileUrl: string;
  title: string;
  artist: string;
  license: string | null;
  durationSeconds: number;
  mimeType: string;
  fileSizeBytes: number;
  sourceId: string;
}> {
  const track = await getJamendoTrackById(trackId);
  if (!track) throw new Error("Трек не найден в Jamendo");
  const downloadUrl = track.downloadUrl;
  if (!isJamendoDownloadUrl(downloadUrl)) {
    throw new Error("Недопустимый URL загрузки");
  }

  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error("Не удалось скачать трек");
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > 50 * 1024 * 1024) throw new Error("Файл слишком большой");

  const mimeType = res.headers.get("content-type") || "audio/mpeg";
  let fileUrl: string;

  const { hasBlobStorage, putBlobBuffer } = await import("./media-storage");
  if (hasBlobStorage()) {
    const key = `music/jamendo-${trackId}-${Date.now()}.mp3`;
    fileUrl = await putBlobBuffer(key, buffer, mimeType);
  } else if (!process.env.VERCEL) {
    const fs = await import("fs");
    const path = await import("path");
    const { getUploadsStaticDir } = await import("./media-storage");
    const filename = `jamendo-${trackId}-${Date.now()}.mp3`;
    fs.writeFileSync(path.join(getUploadsStaticDir(), filename), buffer);
    fileUrl = `/uploads/${filename}`;
  } else {
    throw new Error("Подключите Vercel Blob для импорта музыки");
  }

  return {
    fileUrl,
    title: track.title.slice(0, 200),
    artist: track.artist.slice(0, 200),
    license: track.license,
    durationSeconds: track.durationSeconds,
    mimeType,
    fileSizeBytes: buffer.length,
    sourceId: track.id,
  };
}

export async function getItunesTrackById(trackId: string): Promise<ItunesSearchResult | null> {
  const res = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(trackId)}&country=RU`);
  if (!res.ok) return null;
  const json = (await res.json()) as {
    results?: Array<{
      trackId: number;
      trackName: string;
      artistName: string;
      previewUrl?: string;
      trackViewUrl?: string;
      collectionName?: string;
      trackTimeMillis?: number;
    }>;
  };
  const t = json.results?.[0];
  if (!t?.previewUrl) return null;
  return {
    source: "itunes",
    id: String(t.trackId),
    title: t.trackName,
    artist: t.artistName,
    durationSeconds: Math.round((t.trackTimeMillis ?? 0) / 1000),
    previewUrl: t.previewUrl,
    trackViewUrl: t.trackViewUrl ?? "",
    album: t.collectionName ?? null,
  };
}
