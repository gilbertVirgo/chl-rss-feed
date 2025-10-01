# CHL RSS Feed Generator

A serverless RSS feed generator for Christian Heritage London podcasts. This Netlify function automatically fetches podcast episodes from Prismic, analyzes audio durations, and generates a compliant RSS feed that's uploaded to AWS S3.

## 🚀 Usage

### Manual Trigger

```bash
curl -X POST https://chl-rss-feed.netlify.app/.netlify/functions/runCronTask \
  -H "Authorization: Bearer your-secret-token-here"
```

### Local Development

```bash
# Start Netlify dev server
netlify dev

# Test locally
curl -X POST http://localhost:8888/.netlify/functions/runCronTask \
  -H "Authorization: Bearer your-secret-token-here"
```

## 🛠️ How It Works

This serverless function runs on-demand via HTTP requests with proper authentication. Here's what happens:

1. **Fetches Episodes**: Pulls all podcast episodes from Prismic CMS
2. **Audio Analysis**: Downloads and analyzes audio files to extract accurate durations using ffprobe
3. **Caching**: Stores episode durations locally to avoid re-downloading files
4. **XML Generation**: Creates a compliant RSS feed with proper iTunes tags
5. **Smart Upload**: Only uploads to S3 if content has changed (compares episode URLs)
6. **Cleanup**: Removes temporary audio files after processing

## 🔧 Architecture

### Serverless Function

-   **Platform**: Netlify Functions (AWS Lambda under the hood)
-   **Runtime**: Node.js with ES modules
-   **Authentication**: Bearer token or custom header
-   **Self-contained**: All dependencies bundled in `/netlify/functions/`

### Audio Duration Detection

The biggest challenge was getting audio durations without storing files permanently. The solution:

-   Downloads audio files temporarily during execution
-   Uses `ffprobe` binary (included for macOS/Linux) to analyze duration
-   Caches results in `episodeDurations.json` to avoid re-processing
-   Cleans up temporary files after each run

### AWS S3 Integration

Handles S3's aggressive caching by:

-   Deleting the entire bucket and recreating it (only reliable method found)
-   This forces a fresh upload and bypasses S3's stubborn file caching
-   Yes, this seems excessive, but it's the only thing that works consistently!

## ⚙️ Configuration

### Environment Variables

Set these in your Netlify dashboard:

```
AUTH_TOKEN=your-secure-random-token
AWS__BUCKET_NAME=your-s3-bucket-name
AWS__ACCESS_KEY_ID=your-aws-access-key
AWS__SECRET_ACCESS_KEY=your-aws-secret-key
PRISMIC_ENDPOINT=your-prismic-api-endpoint
```

### Scheduled Execution

You can set up scheduled triggers using:

-   Netlify scheduled functions
-   External cron services (cron-job.org, etc.)
-   GitHub Actions workflows
-   Any service that can make authenticated HTTP requests

## 📁 Project Structure

```
netlify/functions/
├── runCronTask.js          # Main Netlify function handler
├── formatEpisodes.js       # Episode collection formatter
├── formatEpisode.js        # Individual episode formatter
├── getEpisodes.js          # Prismic API integration
├── patchXMLFileOnS3.js     # S3 upload with bucket recreation
├── log.js                  # Simple console logging
├── episodeDurations.json   # Cached audio durations
├── ffprobe-osx-64         # macOS audio analysis binary
└── ffprobe-linux-64       # Linux audio analysis binary
```

## 🔒 Security

-   **Token Authentication**: Requires valid auth token in headers
-   **No Query Parameters**: Tokens only accepted via headers (more secure)
-   **Environment Variables**: All secrets stored as environment variables
-   **No Hardcoded Credentials**: Everything configurable via Netlify dashboard
