// Spotify Now Playing API Integration
// This file handles Spotify API authentication and fetches currently playing track

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const querystring = require('querystring');

const app = express();
const PORT = process.env.PORT || 3001;

// Spotify API Configuration
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_NOW_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing';
const SPOTIFY_RECENTLY_PLAYED_URL = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Get Access Token using Refresh Token
async function getAccessToken() {
    try {
        const response = await axios.post(
            SPOTIFY_TOKEN_URL,
            querystring.stringify({
                grant_type: 'refresh_token',
                refresh_token: REFRESH_TOKEN
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error.response?.data || error.message);
        throw error;
    }
}

// Get Currently Playing Track
async function getNowPlaying(accessToken) {
    try {
        const response = await axios.get(SPOTIFY_NOW_PLAYING_URL, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response?.status === 204) {
            // No track currently playing
            return null;
        }
        throw error;
    }
}

// Get Recently Played Track
async function getRecentlyPlayed(accessToken) {
    try {
        const response = await axios.get(SPOTIFY_RECENTLY_PLAYED_URL, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data.items[0];
    } catch (error) {
        console.error('Error getting recently played:', error.response?.data || error.message);
        return null;
    }
}

// API Endpoint: Get Now Playing or Recently Played
app.get('/api/spotify/now-playing', async (req, res) => {
    try {
        const accessToken = await getAccessToken();
        let nowPlaying = await getNowPlaying(accessToken);

        if (!nowPlaying || !nowPlaying.item) {
            // If nothing is playing, get recently played
            const recentlyPlayed = await getRecentlyPlayed(accessToken);
            if (recentlyPlayed) {
                return res.json({
                    isPlaying: false,
                    title: recentlyPlayed.track.name,
                    artist: recentlyPlayed.track.artists.map(artist => artist.name).join(', '),
                    album: recentlyPlayed.track.album.name,
                    albumImageUrl: recentlyPlayed.track.album.images[0]?.url,
                    songUrl: recentlyPlayed.track.external_urls.spotify,
                    playedAt: recentlyPlayed.played_at
                });
            }
            return res.json({ isPlaying: false, message: 'No recent activity' });
        }

        // Return currently playing track
        res.json({
            isPlaying: true,
            title: nowPlaying.item.name,
            artist: nowPlaying.item.artists.map(artist => artist.name).join(', '),
            album: nowPlaying.item.album.name,
            albumImageUrl: nowPlaying.item.album.images[0]?.url,
            songUrl: nowPlaying.item.external_urls.spotify,
            progress: nowPlaying.progress_ms,
            duration: nowPlaying.item.duration_ms
        });

    } catch (error) {
        console.error('Error in /api/spotify/now-playing:', error.message);
        res.status(500).json({ error: 'Failed to fetch Spotify data' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Spotify API server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎵 Spotify API server running on http://localhost:${PORT}`);
    console.log(`📡 Now Playing endpoint: http://localhost:${PORT}/api/spotify/now-playing`);
});

module.exports = app;
