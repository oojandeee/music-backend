const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Music Proxy Server is Live!');
});

// Proxy Search Endpoint
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing search query' });
  }

  try {
    const searchUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const songsData = response.data?.songs?.data || [];
    const results = songsData.map(song => ({
      id: song.id,
      title: song.title ? song.title.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'") : 'Unknown Track',
      artist: song.more_info?.singers || song.subtitle || 'Unknown Artist',
      imageUrl: song.image ? song.image.replace('150x150', '500x500') : ''
    }));

    return res.json({ results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to search tracks' });
  }
});

// Proxy Audio Stream Endpoint
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

    return res.json({
      id: songId,
      streamUrl: streamUrl
    });

  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch stream details' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
