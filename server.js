const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Music Proxy Server is Live!');
});

// Helper: Decrypt encrypted_media_url from JioSaavn API using DES-ECB
function decryptMediaUrl(encryptedUrl) {
  try {
    const key = '38588582';
    const cipherBuffer = Buffer.from(encryptedUrl.trim(), 'base64');
    const decipher = crypto.createDecipheriv('des-ecb', Buffer.from(key), null);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(cipherBuffer, 'binary', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted.replace(/_96\.mp4|_160\.mp4/g, '_320.mp4');
  } catch (err) {
    return null;
  }
}

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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
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
    return res.status(500).json({ error: 'Failed to search tracks', details: err.message });
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const songData = response.data[songId];
    if (!songData) {
      return res.status(404).json({ error: 'Song details not found for ID: ' + songId });
    }

    let streamUrl = '';

    // Check media_preview_url first
    if (songData['media_preview_url']) {
      streamUrl = songData['media_preview_url']
        .replace('_preview.mp4', '.mp4')
        .replace('http:', 'https:')
        .replace('v0.cdn.jiosaavn.com', 'aac.saavncdn.com');
    } 
    // Fallback to DES Decryption of encrypted_media_url
    else if (songData['more_info']?.['encrypted_media_url']) {
      streamUrl = decryptMediaUrl(songData['more_info']['encrypted_media_url']);
    }

    if (!streamUrl) {
      return res.status(404).json({ error: 'Encrypted media URL resolution failed' });
    }

    return res.json({
      id: songId,
      streamUrl: streamUrl
    });

  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch stream details', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
