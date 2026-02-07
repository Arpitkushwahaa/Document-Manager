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
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 50 // Maximum 50 files per request
  },
  fileFilter: (req, file, cb) => {
    // Accept all files but log them
    console.log(`Processing file: ${file.originalname} (${file.mimetype})`);
    cb(null, true);
  }
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

// Helper function to wait for file to be fully written
async function waitForFile(filePath, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size > 0) {
        return stats;
      }
      // If size is 0, wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // File doesn't exist yet, wait and retry
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  throw new Error('File not fully written after maximum attempts');
}

// API Routes

// Upload documents with error handling wrapper
app.post('/api/documents', (req, res, next) => {
  upload.array('files')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 100MB limit' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files. Maximum 50 files allowed' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      console.error('Unknown upload error:', err);
      return res.status(500).json({ error: 'Failed to process upload' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(`Received ${req.files.length} files for upload`);
    
    const metadata = await readMetadata();
    const newDocuments = [];
    const failedFiles = [];

    // Process each file and verify it exists
    for (const file of req.files) {
      const filePath = path.join(UPLOAD_DIR, file.filename);
      
      try {
        // Wait for file to be fully written and get actual size
        const stats = await waitForFile(filePath);
        
        const doc = {
          id: uuidv4(),
          title: file.originalname,
          filename: file.filename,
          size: stats.size,
          mimeType: file.mimetype,
          uploadDate: new Date().toISOString()
        };
        
        newDocuments.push(doc);
        console.log(`✓ File saved: ${file.originalname} (${stats.size} bytes)`);
      } catch (statError) {
        console.error(`✗ Error verifying file ${file.originalname}:`, statError.message);
        failedFiles.push(file.originalname);
        
        // Try to clean up the failed file
        try {
          await fs.unlink(filePath);
        } catch (unlinkError) {
          console.error(`Could not clean up failed file: ${file.filename}`);
        }
      }
    }

    if (newDocuments.length === 0) {
      return res.status(500).json({ 
        error: 'No files were successfully saved',
        failedFiles: failedFiles
      });
    }

    metadata.push(...newDocuments);
    await writeMetadata(metadata);

    const responseMessage = failedFiles.length > 0
      ? `Uploaded ${newDocuments.length} out of ${req.files.length} files. Failed: ${failedFiles.join(', ')}`
      : `Successfully uploaded ${newDocuments.length} file(s)`;

    console.log(`Upload complete: ${newDocuments.length} succeeded, ${failedFiles.length} failed`);

    res.status(201).json({ 
      success: true, 
      message: responseMessage,
      documents: newDocuments,
      count: newDocuments.length,
      failedFiles: failedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Cleanup uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(path.join(UPLOAD_DIR, file.filename));
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
    }
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

    // Set proper headers for download with encoded filename
    const encodedFilename = encodeURIComponent(document.title);
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Length', document.size);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Accept-Ranges', 'bytes');

    // Stream the file
    const fileStream = fsSync.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download file' });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download document' });
    }
  }
});

// Delete document
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const metadata = await readMetadata();
    const documentIndex = metadata.findIndex(doc => doc.id === id);

    if (documentIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = metadata[documentIndex];
    const filePath = path.join(UPLOAD_DIR, document.filename);

    // Delete the file from disk
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue even if file deletion fails
    }

    // Remove from metadata
    metadata.splice(documentIndex, 1);
    await writeMetadata(metadata);

    res.json({ 
      success: true, 
      message: 'Document deleted successfully',
      id: id
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
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
