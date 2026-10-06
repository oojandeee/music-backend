const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('YouTube Music Proxy Server is Online!');
});

// 1. Resolve YouTube Audio Stream URL & Metadata
app.get('/api/youtube/info', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) return res.status(400).json({ error: 'Missing video ID or URL' });

  try {
    const videoUrl = videoId.startsWith('http') 
      ? videoId 
      : `https://www.youtube.com/watch?v=${videoId}`;

    const info = await ytdl.getInfo(videoUrl);
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    if (!audioFormats.length) {
      return res.status(404).json({ error: 'No audio streams found' });
    }

    // Pick highest audio quality format
    const bestAudio = audioFormats.reduce((prev, curr) => 
      (curr.audioBitrate > prev.audioBitrate) ? curr : prev
    );

    return res.json({
      id: info.videoDetails.videoId,
      title: info.videoDetails.title,
      artist: info.videoDetails.author.name,
      thumbnail: info.videoDetails.thumbnails.pop()?.url,
      streamUrl: bestAudio.url,
    });
  } catch (err) {
    console.error('YouTube Info Error:', err.message);
    return res.status(500).json({ error: 'Failed to extract YouTube info', details: err.message });
  }
});

// 2. Direct Audio Pipe Stream (Fixes 403 Forbidden / Source Error on Android)
app.get('/api/youtube/stream', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) return res.status(400).json({ error: 'Missing video ID parameter' });

  try {
    const videoUrl = videoId.startsWith('http') 
      ? videoId 
      : `https://www.youtube.com/watch?v=${videoId}`;

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');

    // Pipe raw audio stream from YouTube through Render to the client app
    ytdl(videoUrl, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25, // 32MB buffer to prevent buffering stutters
    }).pipe(res);

  } catch (err) {
    console.error('YouTube Stream Error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream audio', details: err.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`YouTube proxy server running on port ${PORT}`);
});
