import ytdl from '@distube/ytdl-core';
// @ts-ignore
import { getSubtitles } from 'youtube-captions-scraper';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import { VideoInfo, DownloadOptions, TranscriptOptions, SliceOptions } from './types.js';

export class YouTubeService {
  private validateOutputPath(outputPath: string): void {
    if (!outputPath || outputPath.trim() === '') {
      throw new Error('Output path cannot be empty');
    }
    
    // Check for invalid characters (basic validation)
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(outputPath)) {
      throw new Error('Output path contains invalid characters: < > : " | ? *');
    }
  }
  async getVideoInfo(url: string): Promise<VideoInfo> {
    try {
      const info = await ytdl.getInfo(url);
      const videoDetails = info.videoDetails;
      
      return {
        url,
        title: videoDetails.title,
        duration: parseInt(videoDetails.lengthSeconds),
        formats: info.formats.map(format => ({
          itag: format.itag,
          quality: format.qualityLabel || format.quality || 'unknown',
          container: format.container || 'unknown',
          hasVideo: format.hasVideo,
          hasAudio: format.hasAudio
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get video info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadVideo(options: DownloadOptions): Promise<string> {
    const { url, quality = 'highest', outputPath = process.env.YOUTUBE_DOWNLOAD_PATH || '/Users/fmackso/dev/CLAUDE/YOUTUBE' } = options;
    
    try {
      this.validateOutputPath(outputPath);
      await fs.mkdir(outputPath, { recursive: true });
      
      const info = await ytdl.getInfo(url);
      const title = this.sanitizeFilename(info.videoDetails.title);
      const filename = `${title}.mp4`;
      const filepath = path.join(outputPath, filename);

      return new Promise((resolve, reject) => {
        try {
          // Use specific quality filter for better compatibility
          let streamOptions: any = {};
          
          if (quality === 'highest') {
            streamOptions = { quality: 'highest', filter: 'videoandaudio' };
          } else {
            // For specific qualities, try to find format with both video and audio
            streamOptions = { 
              quality: quality,
              filter: (format: any) => format.hasVideo && format.hasAudio && format.qualityLabel?.includes(quality)
            };
          }

          const stream = ytdl(url, streamOptions);
          const writeStream = createWriteStream(filepath);
          
          stream.on('error', (error: Error) => {
            writeStream.destroy();
            reject(new Error(`Stream error: ${error.message}`));
          });

          writeStream.on('error', (error: Error) => {
            reject(new Error(`Write error: ${error.message}`));
          });

          writeStream.on('finish', () => {
            resolve(filepath);
          });

          stream.pipe(writeStream);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      throw new Error(`Failed to download video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadAudio(options: DownloadOptions): Promise<string> {
    const { url, outputPath = process.env.YOUTUBE_DOWNLOAD_PATH || '/Users/fmackso/dev/CLAUDE/YOUTUBE', format = 'mp3' } = options;
    
    try {
      this.validateOutputPath(outputPath);
      await fs.mkdir(outputPath, { recursive: true });
      
      const info = await ytdl.getInfo(url);
      const title = this.sanitizeFilename(info.videoDetails.title);
      const filename = `${title}.${format}`;
      const filepath = path.join(outputPath, filename);

      return new Promise((resolve, reject) => {
        try {
          const stream = ytdl(url, { 
            quality: 'highestaudio',
            filter: 'audioonly'
          });

          ffmpeg(stream)
            .audioBitrate(128)
            .save(filepath)
            .on('end', () => resolve(filepath))
            .on('error', (error: Error) => reject(new Error(`FFmpeg error: ${error.message}`)))
            .on('stderr', (stderrLine: string) => {
              console.error('FFmpeg stderr:', stderrLine);
            });
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      throw new Error(`Failed to download audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadVideoSlice(options: SliceOptions): Promise<string> {
    const { url, startTime, endTime, outputPath = process.env.YOUTUBE_DOWNLOAD_PATH || '/Users/fmackso/dev/CLAUDE/YOUTUBE' } = options;
    
    try {
      this.validateOutputPath(outputPath);
      await fs.mkdir(outputPath, { recursive: true });
      
      const info = await ytdl.getInfo(url);
      const title = this.sanitizeFilename(info.videoDetails.title);
      const filename = `${title}_slice_${startTime}-${endTime}.mp4`;
      const filepath = path.join(outputPath, filename);

      return new Promise((resolve, reject) => {
        try {
          const stream = ytdl(url, { 
            quality: 'highest',
            filter: 'videoandaudio'
          });

          ffmpeg(stream)
            .seekInput(startTime)
            .duration(endTime - startTime)
            .save(filepath)
            .on('end', () => resolve(filepath))
            .on('error', (error: Error) => reject(new Error(`FFmpeg error: ${error.message}`)))
            .on('stderr', (stderrLine: string) => {
              console.error('FFmpeg stderr:', stderrLine);
            });
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      throw new Error(`Failed to download video slice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadAudioSlice(options: SliceOptions): Promise<string> {
    const { url, startTime, endTime, outputPath = process.env.YOUTUBE_DOWNLOAD_PATH || '/Users/fmackso/dev/CLAUDE/YOUTUBE', format = 'mp3' } = options;
    
    try {
      this.validateOutputPath(outputPath);
      await fs.mkdir(outputPath, { recursive: true });
      
      const info = await ytdl.getInfo(url);
      const title = this.sanitizeFilename(info.videoDetails.title);
      const filename = `${title}_audio_slice_${startTime}-${endTime}.${format}`;
      const filepath = path.join(outputPath, filename);

      return new Promise((resolve, reject) => {
        try {
          const stream = ytdl(url, { 
            quality: 'highestaudio',
            filter: 'audioonly'
          });

          ffmpeg(stream)
            .seekInput(startTime)
            .duration(endTime - startTime)
            .audioBitrate(128)
            .save(filepath)
            .on('end', () => resolve(filepath))
            .on('error', (error: Error) => reject(new Error(`FFmpeg error: ${error.message}`)))
            .on('stderr', (stderrLine: string) => {
              console.error('FFmpeg stderr:', stderrLine);
            });
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      throw new Error(`Failed to download audio slice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTranscript(options: TranscriptOptions): Promise<string> {
    const { url, language = 'en' } = options;
    
    try {
      const videoId = this.extractVideoId(url);
      const transcript = await getSubtitles({ 
        videoID: videoId, 
        lang: language 
      });

      if (!transcript || transcript.length === 0) {
        throw new Error('No transcript found for this video in the specified language');
      }

      return transcript.map((item: any) => item.text).join(' ');
    } catch (error) {
      throw new Error(`Failed to get transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAvailableTranscriptLanguages(url: string): Promise<string[]> {
    try {
      const videoId = this.extractVideoId(url);
      
      // Try to get available languages by attempting common ones
      const commonLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'];
      const availableLanguages: string[] = [];
      
      for (const lang of commonLanguages) {
        try {
          await getSubtitles({ videoID: videoId, lang });
          availableLanguages.push(lang);
        } catch {
          // Language not available, continue
        }
      }
      
      return availableLanguages.length > 0 ? availableLanguages : ['en'];
    } catch (error) {
      return ['en']; // Default fallback
    }
  }

  private extractVideoId(url: string): string {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^[a-zA-Z0-9_-]{11}$/ // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    throw new Error('Invalid YouTube URL or video ID');
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
  }
}