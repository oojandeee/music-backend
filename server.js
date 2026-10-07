const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('YouTube Direct Pipe Server Active');
});

app.get('/api/youtube/stream', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) return res.status(400).json({ error: 'Video ID or URL is required' });

  try {
    const videoUrl = videoId.startsWith('http') 
      ? videoId 
      : `https://www.youtube.com/watch?v=${videoId}`;

    // Set audio headers for Flutter player
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');

    // Pipe directly from YouTube using Mobile Client Spoofing
    const stream = ytdl(videoUrl, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
      requestOptions: {
        headers: {
          'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11; en_US)',
          'X-YouTube-Client-Name': '3',
          'X-YouTube-Client-Version': '19.09.37',
        }
      }
    });

    stream.on('error', (err) => {
      console.error('YTDL Stream Error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream failed', details: err.message });
      }
    });

    stream.pipe(res);

  } catch (err) {
    console.error('Route Error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
