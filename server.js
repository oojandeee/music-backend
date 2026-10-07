const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('YouTube Audio Proxy Server is Live!');
});

// YouTube Proxy Stream endpoint
app.get('/api/youtube/stream', async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) return res.status(400).json({ error: 'Missing video ID' });

  // List of public Piped API instances to fallback if one fails
  const instances = [
    `https://pipedapi.kavin.rocks/streams/${videoId}`,
    `https://api.piped.privacydev.net/streams/${videoId}`,
    `https://pipedapi.mha.fi/streams/${videoId}`
  ];

  let audioUrl = null;

  for (const instanceUrl of instances) {
    try {
      const response = await axios.get(instanceUrl, { timeout: 5000 });
      const audioStreams = response.data?.audioStreams;

      if (audioStreams && audioStreams.length > 0) {
        // Find the highest bitrate audio stream
        const bestAudio = audioStreams.reduce((prev, curr) => 
          (curr.bitrate > prev.bitrate) ? curr : prev
        );
        audioUrl = bestAudio.url;
        break; // Stop loop if successful
      }
    } catch (e) {
      console.log(`Instance failed: ${instanceUrl}, trying next...`);
    }
  }

  if (!audioUrl) {
    return res.status(500).json({ error: 'Could not fetch playable audio stream from YouTube' });
  }

  try {
    // Pipe the audio stream back to the Flutter player
    const streamResponse = await axios({
      method: 'get',
      url: audioUrl,
      responseType: 'stream',
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    streamResponse.data.pipe(res);

  } catch (err) {
    console.error('Piping error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to pipe audio stream' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
