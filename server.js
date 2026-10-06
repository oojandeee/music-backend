const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Music Proxy Server is Live!');
});

app.get('/api/stream', async (req, res) => {
  const songId = req.query.id;
  if (!songId) {
    return res.status(400).json({ error: 'Missing song ID' });
  }

  try {
    const saavnUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0&_format=json&pids=${songId}`;
    const response = await axios.get(saavnUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const songData = response.data[songId];
    if (!songData) {
      return res.status(404).json({ error: 'Song details not found' });
    }

    let rawUrl = songData['media_preview_url'] || songData['more_info']?.['encrypted_media_url'];
    if (!rawUrl) {
      return res.status(404).json({ error: 'Stream URL not available' });
    }

    let streamUrl = rawUrl
      .replace('_preview.mp4', '.mp4')
      .replace('http:', 'https:')
      .replace('_96.mp4', '_320.mp4')
      .replace('_160.mp4', '_320.mp4')
      .replace('v0.cdn.jiosaavn.com', 'aac.saavncdn.com');

    try {
      await axios.head(streamUrl, { timeout: 3000 });
    } catch (_) {
      streamUrl = streamUrl.replace('_320.mp4', '_160.mp4');
    }

    return res.json({
      id: songId,
      title: songData['song'] || 'Unknown Track',
      artist: songData['more_info']?.['singers'] || 'Unknown Artist',
      imageUrl: (songData['image'] || '').replace('150x150', '500x500'),
      streamUrl: streamUrl
    });

  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch stream details' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
