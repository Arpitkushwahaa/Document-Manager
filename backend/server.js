const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure directories exist
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const METADATA_FILE = path.join(__dirname, 'metadata.json');

// Initialize storage
async function initStorage() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    try {
      await fs.access(METADATA_FILE);
    } catch {
      await fs.writeFile(METADATA_FILE, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Helper functions
async function readMetadata() {
  try {
    const data = await fs.readFile(METADATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeMetadata(data) {
  await fs.writeFile(METADATA_FILE, JSON.stringify(data, null, 2));
}

// API Routes

// Upload documents
app.post('/api/documents', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const metadata = await readMetadata();
    const newDocuments = req.files.map(file => ({
      id: uuidv4(),
      title: file.originalname,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimetype,
      uploadDate: new Date().toISOString()
    }));

    metadata.push(...newDocuments);
    await writeMetadata(metadata);

    res.status(201).json({ 
      success: true, 
      documents: newDocuments,
      count: newDocuments.length
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
});

// List documents with pagination, sorting, and search
app.get('/api/documents', async (req, res) => {
  try {
    let documents = await readMetadata();

    // Search by title
    const searchQuery = req.query.q;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      documents = documents.filter(doc => 
        doc.title.toLowerCase().includes(query)
      );
    }

    // Sort by upload date
    const sortOrder = req.query.sortOrder || 'desc';
    documents.sort((a, b) => {
      const dateA = new Date(a.uploadDate);
      const dateB = new Date(b.uploadDate);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const paginatedDocs = documents.slice(startIndex, endIndex);

    res.json({
      documents: paginatedDocs,
      pagination: {
        page,
        pageSize,
        total: documents.length,
        totalPages: Math.ceil(documents.length / pageSize)
      }
    });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Download document (streaming)
app.get('/api/documents/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const metadata = await readMetadata();
    const document = metadata.find(doc => doc.id === id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(UPLOAD_DIR, document.filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Set headers for download
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.title}"`);
    res.setHeader('Content-Length', document.size);

    // Stream the file
    const fileStream = fsSync.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download document' });
    }
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Start server
initStorage().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
