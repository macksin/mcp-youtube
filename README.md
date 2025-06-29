# MCP YouTube Server

A Model Context Protocol (MCP) server that provides comprehensive YouTube functionality including video downloads, audio extraction, transcript retrieval, and media slicing capabilities.

## Features

- 📹 **Video Downloads** - Download YouTube videos in various qualities
- 🎵 **Audio Extraction** - Extract audio from videos in multiple formats
- ⏱️ **Media Slicing** - Download specific time segments of videos/audio
- 📝 **Transcripts** - Retrieve video transcripts in multiple languages
- ℹ️ **Video Information** - Get metadata about YouTube videos

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd mcp-youtube
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Prerequisites

- **FFmpeg** - Required for audio processing and video slicing
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt install ffmpeg`
  - Windows: Download from [FFmpeg website](https://ffmpeg.org/download.html)

## Usage

### As an MCP Server

Add this server to your MCP client configuration. For Claude Desktop, add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "youtube": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-youtube/dist/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/mcp-youtube` with the actual absolute path to your installation.

### Installation Methods

#### Method 1: Manual Installation (Recommended)
```bash
git clone <repository-url>
cd mcp-youtube
npm install
npm run build
```

#### Method 2: Using the Binary
After building, you can use the binary directly:
```bash
./dist/index.js
```

### Available Tools

#### 1. Get Video Information
```json
{
  "name": "get_video_info",
  "arguments": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID"
  }
}
```

#### 2. Download Video
```json
{
  "name": "download_video",
  "arguments": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "quality": "highest",
    "outputPath": "/Users/yourname/Downloads/youtube"
  }
}
```

#### 3. Download Video Slice
```json
{
  "name": "download_video_slice",
  "arguments": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "startTime": 30,
    "endTime": 90,
    "outputPath": "/Users/yourname/Downloads/youtube"
  }
}
```

#### 4. Download Audio
```json
{
  "name": "download_audio",
  "arguments": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "format": "mp3",
    "outputPath": "/Users/yourname/Downloads/youtube"
  }
}
```

#### 5. Download Audio Slice
```json
{
  "name": "download_audio_slice",
  "arguments": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "startTime": 30,
    "endTime": 90,
    "format": "mp3",
    "outputPath": "/Users/yourname/Downloads/youtube"
  }
}
```

#### 6. Get Transcript
```json
{
  "name": "get_transcript",
  "arguments": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "language": "en"
  }
}
```

#### 7. Get Available Transcript Languages
```json
{
  "name": "get_available_transcript_languages",
  "arguments": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID"
  }
}
```

## Configuration Options

### Output Path Management
The `outputPath` parameter is **crucial** for organizing your downloads:

- **Default**: `/Users/fmackso/dev/CLAUDE/YOUTUBE` (automatically created)
- **Custom**: You can override with any absolute path like `/Users/yourname/Downloads/youtube`
- **Windows**: Use paths like `C:\\Users\\yourname\\Downloads\\youtube`
- **Auto-creation**: Directories will be created automatically if they don't exist
- **Environment Variable**: Set `YOUTUBE_DOWNLOAD_PATH` to override the default

#### Output Path Examples:
```bash
# macOS/Linux
/Users/yourname/Downloads/youtube
/home/username/youtube-downloads
~/Desktop/youtube

# Windows
C:\Users\yourname\Downloads\youtube
D:\Media\youtube-downloads
```

### Video Quality Options
- `highest` - Best available quality (default)
- `lowest` - Lowest available quality
- `720p`, `480p`, `360p` - Specific resolutions

### Audio Formats
- `mp3` - MP3 format (default)
- `wav` - WAV format
- `aac` - AAC format

### Supported Languages for Transcripts
- `en` - English (default)
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ru` - Russian
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese

## Examples

### Using with Claude Desktop

Once configured, you can use natural language with Claude. **Always specify where you want files saved:**

- "Download the audio from this YouTube video: [URL] and save it to /Users/myname/Downloads"
- "Get me a transcript of this video in Spanish"
- "Download just the first 2 minutes of this video to my Desktop"
- "Extract the audio from 1:30 to 3:45 of this video and save to /Users/myname/Music"

#### File Naming Convention
Downloaded files are automatically named using this pattern:
- **Videos**: `{video_title}.mp4`
- **Video Slices**: `{video_title}_slice_{start}-{end}.mp4`
- **Audio**: `{video_title}.{format}`
- **Audio Slices**: `{video_title}_audio_slice_{start}-{end}.{format}`

Special characters in titles are automatically sanitized for filesystem compatibility.

### Direct Usage

You can also run the server directly:

```bash
npm start
```

Then send MCP requests via stdin/stdout.

## Development

### Available Scripts

- `npm run build` - Build the TypeScript project
- `npm run dev` - Run in development mode with hot reload
- `npm start` - Start the built server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Project Structure

```
src/
├── index.ts           # Main MCP server
├── youtube-service.ts # YouTube functionality
└── types.ts          # TypeScript definitions
```

## Error Handling

The server includes comprehensive error handling for:
- Invalid YouTube URLs
- Network connectivity issues
- Missing video formats
- Transcript unavailability
- File system permissions
- FFmpeg processing errors

## Troubleshooting

### Common Issues

1. **"Could not extract functions" Error**
   - This usually indicates YouTube has changed their API
   - The server now uses `@distube/ytdl-core` which is more actively maintained
   - If you still encounter issues, try a different video URL

2. **Transcript Not Available**
   - Not all videos have transcripts
   - Try different language codes (`en`, `es`, `fr`, etc.)
   - Auto-generated transcripts may not be available in all languages

3. **FFmpeg Errors**
   - Ensure FFmpeg is properly installed and in your PATH
   - Check that you have sufficient disk space
   - Verify output directory permissions

4. **Download Failures**
   - Some videos may be region-locked or age-restricted
   - Private videos cannot be downloaded
   - Very long videos may timeout - try downloading slices instead

5. **Path and Permission Issues**
   - Always use absolute paths for `outputPath` (e.g., `/Users/name/Downloads`)
   - Ensure the directory exists or can be created
   - Check write permissions for the output directory
   - On Windows, use forward slashes or double backslashes in paths
   - Avoid special characters in path names

## Legal Notice

This tool is for educational and personal use only. Please respect YouTube's Terms of Service and copyright laws. Only download content you have permission to download.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
