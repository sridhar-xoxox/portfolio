const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Improve file size limits for larger uploads (videos/zips)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Enable CORS for all routes
app.use(cors());

// Serve static files from the root directory
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure data and upload directories exist
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const WORKS_FILE = path.join(DATA_DIR, 'works.json');

fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(UPLOADS_DIR);
if (!fs.existsSync(WORKS_FILE)) {
  fs.writeJsonSync(WORKS_FILE, []);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'misc';
    const uploadPath = path.join(UPLOADS_DIR, category);
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and append timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, name + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// --- API Endpoints ---

// GET All Works
app.get('/api/works', async (req, res) => {
  try {
    const works = await fs.readJson(WORKS_FILE);
    const category = req.query.category;
    if (category) {
      return res.json(works.filter(w => w.category === category));
    }
    res.json(works);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch works.' });
  }
});

// POST New Work (Upload)
app.post('/api/upload', upload.single('file'), async (req, res) => {
  console.log('Received upload request');
  try {
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    console.log('File uploaded:', req.file.filename);

    const newWork = {
      id: Date.now().toString(),
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      filePath: `/uploads/${req.body.category}/${req.file.filename}`,
      fileType: req.file.mimetype,
      originalName: req.file.originalname,
      date: new Date().toISOString()
    };

    const works = await fs.readJson(WORKS_FILE);
    works.unshift(newWork); // Add to beginning
    await fs.writeJson(WORKS_FILE, works, { spaces: 2 });

    res.json({ message: 'Upload successful!', work: newWork });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// DELETE Work
app.delete('/api/works/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let works = await fs.readJson(WORKS_FILE);
    const workIndex = works.findIndex(w => w.id === id);

    if (workIndex === -1) {
      return res.status(404).json({ error: 'Work not found' });
    }

    const work = works[workIndex];
    // Attempt to delete file
    // Note: filePath is relative URL like /uploads/..., construct absolute path
    const absoluteFilePath = path.join(__dirname, work.filePath);
    try {
      if (await fs.pathExists(absoluteFilePath)) {
        await fs.remove(absoluteFilePath);
      }
    } catch (err) {
      console.error('File deletion error:', err);
      // Continue to delete record even if file deletion fails
    }

    works.splice(workIndex, 1);
    await fs.writeJson(WORKS_FILE, works, { spaces: 2 });

    res.json({ message: 'Work deleted successfully' });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Spotify API endpoint
app.get('/api/spotify', async (req, res) => {
  try {
    const CLIENT_ID = process.env.CLIENT_ID;
    const CLIENT_SECRET = process.env.CLIENT_SECRET;
    const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
      return res.status(500).json({
        error: 'Spotify credentials not configured. Please check your .env file.'
      });
    }

    // Get access token using refresh token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: REFRESH_TOKEN
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token refresh error:', errorData);
      return res.status(401).json({
        error: 'Failed to refresh access token. Please check your refresh token.'
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch currently playing track
    const spotifyResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (spotifyResponse.status === 204) {
      // No content - user is not playing anything
      return res.status(204).send();
    }

    if (!spotifyResponse.ok) {
      const errorData = await spotifyResponse.json();
      console.error('Spotify API error:', errorData);
      return res.status(spotifyResponse.status).json({
        error: 'Failed to fetch currently playing track',
        details: errorData
      });
    }

    const data = await spotifyResponse.json();
    res.json(data);
  } catch (error) {
    console.error('Error in /api/spotify:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Export app for Vercel
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin Interface: http://localhost:${PORT}/admin.html`);
    console.log(`Works Page: http://localhost:${PORT}/works.html`);
  });
}
