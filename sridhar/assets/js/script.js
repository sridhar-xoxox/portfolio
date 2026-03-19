'use strict';

// Theme Toggle Functionality
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = themeToggle?.querySelector('ion-icon');

// Get saved theme or default to dark
function getSavedTheme() {
  const saved = localStorage.getItem('theme');
  return saved || 'dark';
}

// Set theme
function setTheme(theme) {
  document.body.classList.remove('dark', 'light');
  document.body.classList.add(theme);
  localStorage.setItem('theme', theme);

  // Update icon
  if (themeIcon) {
    if (theme === 'dark') {
      themeIcon.setAttribute('name', 'moon-outline');
    } else {
      themeIcon.setAttribute('name', 'sunny-outline');
    }
  }
}

// Initialize theme on page load
const currentTheme = getSavedTheme();
setTheme(currentTheme);

// Toggle theme on button click
if (themeToggle) {
  themeToggle.addEventListener('click', function () {
    const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });
}


// Spotify Widget Functionality consolidated into initializeSpotifyWidget below


// Time Display Functionality
const timeValue = document.getElementById('time-value');
const timeLocation = document.querySelector('.time-location');
const timeSeparator = document.querySelector('.time-separator');

function updateTime() {
  if (!timeValue) return;

  // Get India time (IST - UTC+5:30)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const indiaTime = new Date(utc + (5.5 * 3600000));

  // Format time
  let hours = indiaTime.getHours();
  const minutes = indiaTime.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  const hoursStr = hours < 10 ? '0' + hours : hours;

  const timeString = `${hoursStr}:${minutesStr} ${ampm}`;

  // Update time value
  timeValue.textContent = timeString;

  // Update data-text for chromatic aberration
  if (timeValue) {
    timeValue.setAttribute('data-text', timeString);
  }
  if (timeLocation) {
    timeLocation.setAttribute('data-text', 'INDIA');
  }
  if (timeSeparator) {
    timeSeparator.setAttribute('data-text', '/');
  }
}

// Initialize time display
if (timeValue) {
  updateTime();
  // Update every minute
  setInterval(updateTime, 60000);
}

// Navigation Functionality
const navLinks = document.querySelectorAll('[data-nav-link]');
const pages = document.querySelectorAll('[data-page]');

// Page mapping - maps navbar link to page name
const pageMap = {
  'about': 'about',
  'website': 'website'
};

// Function to switch pages
function switchPage(targetPage) {
  // Hide all pages
  pages.forEach(page => {
    page.classList.remove('active');
  });

  // Show target page
  const targetPageElement = document.querySelector(`[data-page="${targetPage}"]`);
  if (targetPageElement) {
    targetPageElement.classList.add('active');
  }

  // Update active nav link
  navLinks.forEach(link => {
    link.classList.remove('active');
    const linkPage = link.getAttribute('aria-label');
    if (linkPage === 'About' && targetPage === 'about') {
      link.classList.add('active');
    } else if (linkPage === 'Website' && targetPage === 'website') {
      link.classList.add('active');
    }
  });

  // Initialize Spotify widget if switching to website page
  if (targetPage === 'website') {
    const websiteSpotifyWidget = document.getElementById('spotify-widget-website');
    if (websiteSpotifyWidget && !websiteSpotifyWidget.dataset.initialized) {
      initializeSpotifyWidget(websiteSpotifyWidget);
      websiteSpotifyWidget.dataset.initialized = 'true';
    }
  }
}

// Function to initialize Spotify widget
function initializeSpotifyWidget(widgetElement) {
  const SPOTIFY_CONFIG = {
    userId: '31pedugibf3ltzotmdfdy6xpnbee',
    apiEndpoint: '/api/spotify',
    profileUrl: 'https://open.spotify.com/user/31pedugibf3ltzotmdfdy6xpnbee'
  };

  async function fetchSpotifyData() {
    try {
      const response = await fetch(SPOTIFY_CONFIG.apiEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.item) {
        displaySpotifyTrack(data, widgetElement);
      } else if (data.track) {
        displaySpotifyTrack({ item: data.track, is_playing: data.is_playing }, widgetElement);
      } else if (data.name) {
        displaySpotifyTrack({ item: data, is_playing: true }, widgetElement);
      } else {
        displaySpotifyError(widgetElement, SPOTIFY_CONFIG.profileUrl);
      }
    } catch (error) {
      console.error('Error fetching Spotify data:', error);
      displaySpotifyError(widgetElement, SPOTIFY_CONFIG.profileUrl);
    }
  }

  function displaySpotifyTrack(data, widget) {
    if (!data || !data.item) {
      displaySpotifyError(widget, SPOTIFY_CONFIG.profileUrl);
      return;
    }

    const track = data.item;

    widget.innerHTML = `
      <div class="spotify-track">
        <img 
          src="${track.album.images[0]?.url || './assets/images/spotify-placeholder.png'}" 
          alt="${track.name}"
          class="spotify-album-art"
        />
        <div class="spotify-track-info">
          <div class="spotify-track-name">${track.name}</div>
          <div class="spotify-track-artist">${track.artists.map(artist => artist.name).join(', ')}</div>
        </div>
        <a 
          href="${track.external_urls.spotify}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="spotify-external-link"
          aria-label="Open on Spotify"
        >
          <ion-icon name="open-outline"></ion-icon>
        </a>
      </div>
    `;
  }

  function displaySpotifyError(widget, profileUrl) {
    widget.innerHTML = `
      <div class="spotify-loading">
        <ion-icon name="musical-notes-outline"></ion-icon>
        <p>Not playing anything right now</p>
        <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" class="spotify-profile-link">
          View my Spotify profile
        </a>
      </div>
    `;
  }

  // Fetch immediately
  fetchSpotifyData();

  // Refresh every 30 seconds
  setInterval(fetchSpotifyData, 30000);
}

// Add click event listeners to nav links
navLinks.forEach(link => {
  link.addEventListener('click', function () {
    const linkLabel = this.getAttribute('aria-label');
    let targetPage = 'about'; // default to about/home

    if (linkLabel === 'About') {
      targetPage = 'about';
    } else if (linkLabel === 'Website') {
      targetPage = 'website';
    }

    switchPage(targetPage);
  });
});

// Initialize page on load - show about page by default
document.addEventListener('DOMContentLoaded', function () {
  // Ensure about page is active on initial load
  const aboutPage = document.querySelector('[data-page="about"]');
  const websitePage = document.querySelector('[data-page="website"]');

  if (aboutPage) {
    aboutPage.classList.add('active');
  }
  if (websitePage) {
    websitePage.classList.remove('active');
  }

  // Set initial active nav link
  const homeLink = document.querySelector('[data-nav-link][aria-label="About"]');
  const websiteLink = document.querySelector('[data-nav-link][aria-label="Website"]');

  if (homeLink) {
    homeLink.classList.add('active');
  }
  if (websiteLink) {
    websiteLink.classList.remove('active');
  }
});