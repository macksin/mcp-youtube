export interface VideoInfo {
  url: string;
  title: string;
  duration: number;
  formats: Array<{
    itag: number;
    quality: string;
    container: string;
    hasVideo: boolean;
    hasAudio: boolean;
  }>;
}

export interface DownloadOptions {
  url: string;
  quality?: string;
  format?: string;
  outputPath?: string;
  startTime?: number;
  endTime?: number;
}

export interface TranscriptOptions {
  url: string;
  language?: string;
  autoGenerated?: boolean;
}

export interface SliceOptions extends DownloadOptions {
  startTime: number;
  endTime: number;
}