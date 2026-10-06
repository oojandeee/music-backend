const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Root Endpoint
app.get('/', (req, res) => {
  res.send('JioSaavn Proxy Server is Live and Ready!');
});

/**
 * Helper: Decrypt encrypted_media_url from JioSaavn using DES-ECB
 * Converts encrypted token into direct high-quality 320kbps CDN URL.
 */
function decryptMediaUrl(encryptedUrl) {
  try {
    const key = '38588582'; // Standard JioSaavn DES key
    const cipherBuffer = Buffer.from(encryptedUrl.trim(), 'base64');
    const decipher = crypto.createDecipheriv('des-ecb', Buffer.from(key), null);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(cipherBuffer, 'binary', 'utf8');
    decrypted += decipher.final('utf8');
    // Swap bitrate quality flag to highest available 320kbps MP4 stream
    return decrypted.replace(/_96\.mp4|_160\.mp4/g, '_320.mp4');
  } catch (err) {
    console.error('Decryption Error:', err.message);
    return null;
  }
}

// 1. Search Songs Endpoint
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing search query' });

  try {
    const searchUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
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
    return res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

// 2. Fetch Stream Details Endpoint
app.get('/api/stream', async (req, res) => {
  const songId = req.query.id;
  if (!songId) return res.status(400).json({ error: 'Missing song ID' });

  try {
    const saavnUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0&_format=json&pids=${songId}`;
    const response = await axios.get(saavnUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });

    const songData = response.data[songId];
    if (!songData) return res.status(404).json({ error: 'Song details not found' });

    let streamUrl = '';

    // Priority 1: Decrypt full encrypted media URL
    if (songData['more_info']?.['encrypted_media_url']) {
      streamUrl = decryptMediaUrl(songData['more_info']['encrypted_media_url']);
    }

    // Priority 2: Sanitize preview URL fallback to full track URL
    if (!streamUrl && songData['media_preview_url']) {
      streamUrl = songData['media_preview_url']
        .replace('preview.saavncdn.com', 'aac.saavncdn.com') // Replace preview domain
        .replace('_p.mp4', '.mp4')                         // Strip preview tag
        .replace('_96.mp4', '_320.mp4')                    // Upgrade quality
        .replace('http:', 'https:');
    }

    if (!streamUrl) {
      return res.status(404).json({ error: 'Could not resolve playable media URL' });
    }

    return res.json({ id: songId, streamUrl });

  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch stream details', details: err.message });
  }
});

// 3. Audio Streaming Pipe Endpoint (Prevents Vivo / Android 403 Forbidden Block)
app.get('/api/proxy-stream', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Audio URL parameter is required' });
  }

  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.jiosaavn.com/',
      },
    });

    res.setHeader('Content-Type', 'audio/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    response.data.pipe(res);
  } catch (err) {
    console.error('Streaming Error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Audio pipe streaming failed', details: err.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
