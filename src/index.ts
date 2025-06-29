#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { YouTubeService } from './youtube-service.js';

const TOOLS: Tool[] = [
  {
    name: 'get_video_info',
    description: 'Get information about a YouTube video including title, duration, and available formats',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'YouTube video URL or ID',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'download_video',
    description: 'Download a YouTube video in specified quality',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'YouTube video URL or ID',
        },
        quality: {
          type: 'string',
          description: 'Video quality (default: highest)',
          default: 'highest',
        },
        outputPath: {
          type: 'string',
          description: 'Output directory path (default: /Users/fmackso/dev/CLAUDE/YOUTUBE)',
          default: '/Users/fmackso/dev/CLAUDE/YOUTUBE',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'download_video_slice',
    description: 'Download a specific time slice of a YouTube video',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'YouTube video URL or ID',
        },
        startTime: {
          type: 'number',
          description: 'Start time in seconds',
        },
        endTime: {
          type: 'number',
          description: 'End time in seconds',
        },
        outputPath: {
          type: 'string',
          description: 'Output directory path (default: /Users/fmackso/dev/CLAUDE/YOUTUBE)',
          default: '/Users/fmackso/dev/CLAUDE/YOUTUBE',
        },
      },
      required: ['url', 'startTime', 'endTime'],
    },
  },
  {
    name: 'download_audio',
    description: 'Download audio from a YouTube video',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'YouTube video URL or ID',
        },
        format: {
          type: 'string',
          description: 'Audio format (default: mp3)',
          default: 'mp3',
        },
        outputPath: {
          type: 'string',
          description: 'Output directory path (default: /Users/fmackso/dev/CLAUDE/YOUTUBE)',
          default: '/Users/fmackso/dev/CLAUDE/YOUTUBE',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'download_audio_slice',
    description: 'Download a specific time slice of audio from a YouTube video',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'YouTube video URL or ID',
        },
        startTime: {
          type: 'number',
          description: 'Start time in seconds',
        },
        endTime: {
          type: 'number',
          description: 'End time in seconds',
        },
        format: {
          type: 'string',
          description: 'Audio format (default: mp3)',
          default: 'mp3',
        },
        outputPath: {
          type: 'string',
          description: 'Output directory path (default: /Users/fmackso/dev/CLAUDE/YOUTUBE)',
          default: '/Users/fmackso/dev/CLAUDE/YOUTUBE',
        },
      },
      required: ['url', 'startTime', 'endTime'],
    },
  },
  {
    name: 'get_transcript',
    description: 'Get transcript of a YouTube video in specified language',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'YouTube video URL or ID',
        },
        language: {
          type: 'string',
          description: 'Language code (default: en)',
          default: 'en',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'get_available_transcript_languages',
    description: 'Get list of available transcript languages for a YouTube video',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'YouTube video URL or ID',
        },
      },
      required: ['url'],
    },
  },
];

class YouTubeServer {
  private youtubeService: YouTubeService;
  private server: Server;

  constructor() {
    this.youtubeService = new YouTubeService();
    this.server = new Server(
      {
        name: 'mcp-youtube',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) =>
      this.handleToolCall(request.params.name, request.params.arguments ?? {})
    );
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.stop();
      process.exit(0);
    });
  }

  private async handleToolCall(name: string, args: any): Promise<{ content: Array<{ type: string; text: string; metadata?: any }> }> {
    try {
      switch (name) {
        case 'get_video_info': {
          const { url } = args;
          if (!url || typeof url !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'URL parameter is required and must be a string');
          }
          
          const info = await this.youtubeService.getVideoInfo(url);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(info, null, 2),
                metadata: {
                  tool: 'get_video_info',
                  timestamp: new Date().toISOString(),
                },
              },
            ],
          };
        }

        case 'download_video': {
          const { url, quality = 'highest', outputPath = './downloads' } = args;
          if (!url || typeof url !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'URL parameter is required and must be a string');
          }

          const filepath = await this.youtubeService.downloadVideo({
            url,
            quality,
            outputPath,
          });
          return {
            content: [
              {
                type: 'text',
                text: `Video downloaded successfully to: ${filepath}`,
                metadata: {
                  tool: 'download_video',
                  filepath,
                  timestamp: new Date().toISOString(),
                },
              },
            ],
          };
        }

        case 'download_video_slice': {
          const { url, startTime, endTime, outputPath = './downloads' } = args;
          if (!url || typeof url !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'URL parameter is required and must be a string');
          }
          if (typeof startTime !== 'number' || typeof endTime !== 'number') {
            throw new McpError(ErrorCode.InvalidParams, 'startTime and endTime must be numbers');
          }

          const filepath = await this.youtubeService.downloadVideoSlice({
            url,
            startTime,
            endTime,
            outputPath,
          });
          return {
            content: [
              {
                type: 'text',
                text: `Video slice downloaded successfully to: ${filepath}`,
                metadata: {
                  tool: 'download_video_slice',
                  filepath,
                  startTime,
                  endTime,
                  timestamp: new Date().toISOString(),
                },
              },
            ],
          };
        }

        case 'download_audio': {
          const { url, format = 'mp3', outputPath = './downloads' } = args;
          if (!url || typeof url !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'URL parameter is required and must be a string');
          }

          const filepath = await this.youtubeService.downloadAudio({
            url,
            format,
            outputPath,
          });
          return {
            content: [
              {
                type: 'text',
                text: `Audio downloaded successfully to: ${filepath}`,
                metadata: {
                  tool: 'download_audio',
                  filepath,
                  format,
                  timestamp: new Date().toISOString(),
                },
              },
            ],
          };
        }

        case 'download_audio_slice': {
          const { url, startTime, endTime, format = 'mp3', outputPath = './downloads' } = args;
          if (!url || typeof url !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'URL parameter is required and must be a string');
          }
          if (typeof startTime !== 'number' || typeof endTime !== 'number') {
            throw new McpError(ErrorCode.InvalidParams, 'startTime and endTime must be numbers');
          }

          const filepath = await this.youtubeService.downloadAudioSlice({
            url,
            startTime,
            endTime,
            format,
            outputPath,
          });
          return {
            content: [
              {
                type: 'text',
                text: `Audio slice downloaded successfully to: ${filepath}`,
                metadata: {
                  tool: 'download_audio_slice',
                  filepath,
                  format,
                  startTime,
                  endTime,
                  timestamp: new Date().toISOString(),
                },
              },
            ],
          };
        }

        case 'get_transcript': {
          const { url, language = 'en' } = args;
          if (!url || typeof url !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'URL parameter is required and must be a string');
          }

          const transcript = await this.youtubeService.getTranscript({
            url,
            language,
          });
          return {
            content: [
              {
                type: 'text',
                text: transcript,
                metadata: {
                  tool: 'get_transcript',
                  language,
                  charCount: transcript.length,
                  timestamp: new Date().toISOString(),
                },
              },
            ],
          };
        }

        case 'get_available_transcript_languages': {
          const { url } = args;
          if (!url || typeof url !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'URL parameter is required and must be a string');
          }

          const languages = await this.youtubeService.getAvailableTranscriptLanguages(url);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(languages, null, 2),
                metadata: {
                  tool: 'get_available_transcript_languages',
                  availableLanguages: languages.length,
                  timestamp: new Date().toISOString(),
                },
              },
            ],
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error) {
      console.error(`Tool execution failed for ${name}:`, error);
      
      if (error instanceof McpError) {
        throw error;
      }
      
      throw new McpError(
        ErrorCode.InternalError,
        `Error executing tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  async stop(): Promise<void> {
    try {
      await this.server.close();
    } catch (error) {
      console.error('Error while stopping server:', error);
    }
  }
}

async function main() {
  const server = new YouTubeServer();
  
  try {
    await server.start();
    console.error('MCP YouTube server running on stdio');
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal server error:', error);
  process.exit(1);
});