# Spotify Widget Integration Guide

This guide explains how the Spotify "Now Playing" widget is integrated into your portfolio website and how to manage it.

## 1. Overview

The Spotify widget (`.grid-card.card-spotify`) is a dynamic component that displays your currently playing track from Spotify. It uses:
- **Frontend**: HTML/CSS in `index.html` and JavaScript in `assets/js/script.js`.
- **Backend**: A Node.js API endpoint `/api/spotify` in `server.js`.

## 2. Frontend Structure (`index.html`)

The widget is placed in the `index.html` file within the website section grid.

```html
<!-- Spotify Widget -->
<div class="grid-card card-spotify">
  <a href="https://open.spotify.com/user/31pedugibf3ltzotmdfdy6xpnbee" target="_blank"
    rel="noopener noreferrer" class="spotify-header">
    <ion-icon name="musical-notes-outline"></ion-icon>
    <span class="chip">Now Playing</span>
  </a>
  <div class="spotify-content" id="spotify-widget-website">
    <div class="spotify-loading">
      <ion-icon name="musical-notes-outline"></ion-icon>
      <p>Loading Spotify data...</p>
    </div>
  </div>
</div>
```

## 3. Styling (`assets/css/style.css`)

The widget is styled to match the site's dark, modern aesthetic. Key classes include:
- `.card-spotify`: The main container.
- `.spotify-header`: Contains the icon and "Now Playing" chip.
- `.spotify-track`: Formats the album art, track name, and artist.
- `.spotify-album-art`: Styles the album cover image.

## 4. Backend Configuration (`server.js`)

The backend handles the authentication with Spotify's API to keep your client secret secure.

### Required Environment Variables (.env)
You must have a `.env` file in the root directory with the following keys:

```bash
CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_client_secret
REFRESH_TOKEN=your_spotify_refresh_token
```

### API Endpoint (`/api/spotify`)
The server exposes this endpoint which:
1. Uses the `REFRESH_TOKEN` to get a fresh `ACCESS_TOKEN`.
2. Calls the Spotify API `me/player/currently-playing`.
3. Returns the track data or a 204 status if nothing is playing.

## 5. JavaScript Logic (`assets/js/script.js`)

The script:
1. Fetches data from `/api/spotify` every 30 seconds.
2. Updates the DOM element `#spotify-widget-website`.
3. Handles states:
   - **Playing**: Shows album art, title, artist, and a link.
   - **Not Playing**: Shows a default "Not playing anything" message.
   - **Error**: Shows a fallback message.

## 6. managing Files

If you need to move or rearrange clean up your project, you can organize the older documentation files (`SPOTIFY_SETUP.md`, etc.) into a `docs/` folder, but ensure `server.js` and `index.html` remain in the root for the application to run correctly.
