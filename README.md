# Document Manager

A modern, full-stack document management system that supports uploading, listing, searching, and downloading documents with an immersive UI.

## 🚀 Features

- **Multiple File Upload**: Upload multiple documents simultaneously with drag-and-drop support
- **Smart Search**: Real-time text search across document titles
- **Sorting**: Sort documents by upload date (newest/oldest first)
- **Pagination**: Efficient navigation through large document collections
- **Streaming Downloads**: Memory-efficient file downloads using streaming
- **Responsive UI**: Beautiful, modern interface built with React and Tailwind CSS
- **File Management**: View file sizes, upload dates, and download documents easily

## 📋 Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Multer** - Multipart/form-data handling for file uploads
- **UUID** - Unique ID generation
- **CORS** - Cross-origin resource sharing

## 🏗️ Architecture

The system follows a clean separation of concerns:

- **Frontend (React)**: Handles UI/UX, user interactions, and API communication
- **Backend (Express)**: RESTful API endpoints for document operations
- **File Storage**: Local disk storage for binary files
- **Metadata Storage**: JSON file for document metadata (title, size, upload date, etc.)

## 📦 Project Structure

```
Document Manager/
├── backend/
│   ├── server.js          # Express server with all API endpoints
│   ├── package.json       # Backend dependencies
│   ├── uploads/           # Directory for uploaded files (auto-created)
│   └── metadata.json      # Document metadata storage (auto-created)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadSection.jsx    # Multiple file upload UI
│   │   │   ├── DocumentList.jsx     # Document listing with pagination
│   │   │   └── SearchBar.jsx        # Search and sort controls
│   │   ├── App.jsx        # Main application component
│   │   ├── main.jsx       # React entry point
│   │   └── index.css      # Global styles with Tailwind
│   ├── index.html
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.js     # Vite configuration
│   └── tailwind.config.js # Tailwind CSS configuration
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🔌 API Endpoints

### Upload Documents
```
POST /api/documents
Content-Type: multipart/form-data

Body: files[] (array of files)

Response: {
  success: true,
  documents: [...],
  count: number
}
```

### List Documents
```
GET /api/documents?page=1&pageSize=10&sortOrder=desc&q=search

Query Parameters:
- page: Page number (default: 1)
- pageSize: Items per page (default: 10)
- sortOrder: 'asc' or 'desc' (default: 'desc')
- q: Search query for document title

Response: {
  documents: [...],
  pagination: {
    page: number,
    pageSize: number,
    total: number,
    totalPages: number
  }
}
```

### Download Document
```
GET /api/documents/:id/download

Response: File stream with appropriate headers
- Content-Type: application/octet-stream
- Content-Disposition: attachment; filename="..."
- Content-Length: file size
```

## 📊 Key Features Implemented

### 1. Multiple File Upload
- Users can select multiple files at once
- Drag-and-drop interface for easy file selection
- Visual feedback showing selected files with sizes
- Single API call uploads all files efficiently

### 2. Document Listing
- Paginated display (configurable page size)
- Shows title, file size, and upload date
- Responsive grid layout
- Loading states and empty states

### 3. Search Functionality
- Real-time search by document title
- Case-insensitive "contains" matching
- Search results maintain pagination and sorting

### 4. Sorting
- Sort by upload date (ascending/descending)
- Persists across search operations

### 5. Streaming Download
- Files are streamed from disk to client
- No memory buffering of entire file
- Proper HTTP headers for file downloads
- Original filename preserved

## ⚙️ Key Tradeoffs Due to Time Limit

1. **Local Storage vs Cloud**: Files stored on local disk for simplicity. Production would use S3/GCS.

2. **JSON Metadata**: Using a JSON file instead of a proper database. Good for demo, but would use PostgreSQL/MongoDB in production.

3. **No Authentication**: No user authentication or authorization. Would implement OAuth/JWT in production.

4. **Basic Validation**: Limited file type and size validation. Production needs comprehensive validation and antivirus scanning.

5. **No Error Recovery**: No retry mechanisms or transaction handling. Production needs robust error handling.

6. **Single Server**: No horizontal scaling or load balancing considered.

---

## Design Questions

### 1. Multiple Uploads - How does your system handle uploading multiple documents?

**Implementation:**
- Uses a **single HTTP request** to upload multiple files
- Frontend uses FormData to append multiple files with the same field name (`files[]`)
- Backend uses Multer's `.array('files')` method to handle multiple files
- All files are processed in one transaction

**Limits & Tradeoffs:**

**Pros:**
- More efficient - single HTTP request reduces overhead
- Atomic operation - all files succeed or fail together
- Better UX - single upload progress indicator
- Reduces server connections

**Cons:**
- Large batches can timeout
- If one file fails, may need to retry all
- Memory usage spikes with many large files

**Current Limits:**
- 100MB per file (configurable in Multer)
- No explicit limit on number of files, but practically limited by timeout and memory
- In production, would add: max files per request (e.g., 50), queue large batches, chunked uploads for files >100MB

**Alternative Considered:**
- Multiple sequential requests - easier error handling per file but slower and more complex progress tracking

### 2. Streaming - Why is streaming important for upload/download?

**Why Streaming Matters:**

**For Downloads:**
```javascript
// ❌ BAD - Loading entire file into memory
const fileData = await fs.readFile(filePath);
res.send(fileData); // 1GB file = 1GB RAM usage per download

// ✅ GOOD - Streaming
const stream = fs.createReadStream(filePath);
stream.pipe(res); // Constant small memory usage
```

**Problems Without Streaming:**

1. **Memory Exhaustion**
   - 10 users downloading 500MB files = 5GB RAM needed
   - Server crashes with out-of-memory errors
   - Can't scale to handle concurrent users

2. **Slow Time to First Byte (TTFB)**
   - Must read entire file before sending anything
   - User waits with no feedback
   - Poor user experience

3. **Failed Transfers Waste Resources**
   - If user cancels after reading full file, all that memory/CPU wasted
   - With streaming, stop reading immediately on disconnect

4. **No Progress Feedback**
   - Can't track progress of large downloads
   - Browser can't show download progress bar accurately

**Benefits of Streaming:**
- Constant memory footprint (~16KB buffer)
- Start sending data immediately
- Handle files larger than available RAM
- Support range requests for resume capability
- Graceful handling of connection interruptions

**Implementation in Our System:**
```javascript
// Backend streams file in chunks
const fileStream = fsSync.createReadStream(filePath);
fileStream.pipe(res); // Pipe chunks directly to HTTP response

// Client receives and saves chunks progressively
```

### 3. Moving to S3 - What changes if files move to object storage?

**Backend Changes Required:**

**1. Replace File System Operations:**
```javascript
// Current (Local Disk):
const storage = multer.diskStorage({...});
const stream = fs.createReadStream(filePath);

// S3 Version:
const storage = multerS3({
  s3: s3Client,
  bucket: 'my-documents',
  key: (req, file, cb) => cb(null, `${uuid()}`)
});
const stream = s3Client.getObject({ Bucket, Key }).createReadStream();
```

**2. Update Upload Endpoint:**
- Change from `multer.diskStorage` to `multer-s3`
- Store S3 key instead of local filename in metadata
- Add region and bucket info to configuration

**3. Update Download Endpoint:**
- Generate pre-signed URLs for direct S3 downloads OR
- Stream from S3 through backend
- Update metadata to store S3 object key

**4. Metadata Changes:**
```javascript
// Before:
{
  filename: "uuid.pdf",  // local file path
  ...
}

// After:
{
  s3Key: "documents/uuid.pdf",
  s3Bucket: "my-documents-prod",
  s3Region: "us-east-1",
  ...
}
```

**Would the backend still handle file bytes?**

**Two Approaches:**

**Approach 1: Backend Proxies (Current streaming model)**
- Backend streams from S3 → Client
- **Pros**: Fine-grained access control, usage tracking, content modification
- **Cons**: Backend bandwidth costs, increased latency, backend becomes bottleneck

**Approach 2: Pre-signed URLs (Better for most cases)**
```javascript
// Backend generates temporary URL
const url = s3Client.getSignedUrl('getObject', {
  Bucket: 'my-documents',
  Key: document.s3Key,
  Expires: 3600 // 1 hour
});
res.json({ downloadUrl: url });

// Client downloads directly from S3
```
- **Pros**: Faster downloads, reduced backend load, S3's global CDN
- **Cons**: Less control, URL can be shared within expiry time

**Recommendation**: Use pre-signed URLs for downloads, proxy uploads through backend for validation.

**Additional Considerations:**
- Add AWS SDK (`aws-sdk` or `@aws-sdk/client-s3`)
- Configure IAM roles with least privilege
- Enable S3 versioning for file history
- Add lifecycle policies for cost optimization
- Consider CloudFront CDN for global distribution
- Implement retry logic for S3 API failures

### 4. Frontend UX - If you had more time, how would you improve it?

**Document Preview:**

**Implementation Plan:**
1. **Preview Modal Component**
   ```javascript
   <PreviewModal document={selectedDoc} onClose={...} />
   ```

2. **File Type Handling**
   - **PDFs**: Use `react-pdf` library to render inline
   - **Images**: Display with `<img>` tag, add zoom/pan
   - **Text/Code**: Syntax highlighting with `react-syntax-highlighter`
   - **Office Docs**: Use Google Docs Viewer iframe or Office Online
   - **Videos**: HTML5 `<video>` player with controls

3. **Backend Changes**
   ```javascript
   // New endpoint for preview (lower quality/size)
   GET /api/documents/:id/preview
   
   // For PDFs: first page thumbnail
   // For images: resized version
   // For videos: thumbnail extraction
   ```

4. **UX Flow**
   - Click document → Preview modal opens
   - Loading spinner while fetching
   - Navigation arrows for next/previous
   - Full download button in preview
   - Close on ESC or click outside

**Upload Progress:**

**Implementation Plan:**

1. **Progress Tracking**
   ```javascript
   const [uploadProgress, setUploadProgress] = useState({});
   
   axios.post('/api/documents', formData, {
     onUploadProgress: (progressEvent) => {
       const percent = Math.round(
         (progressEvent.loaded * 100) / progressEvent.total
       );
       setUploadProgress(prev => ({
         ...prev,
         [fileId]: percent
       }));
     }
   });
   ```

2. **Visual Indicators**
   - Per-file progress bars with percentage
   - Overall upload progress
   - Upload speed (MB/s)
   - Estimated time remaining
   - Success/error icons per file

3. **Advanced Features**
   - Pause/resume uploads (chunked upload needed)
   - Cancel individual files
   - Retry failed uploads
   - Background uploads (continue while browsing)

4. **UI Component**
   ```javascript
   <ProgressBar 
     fileName={file.name}
     progress={uploadProgress[file.id]}
     speed={uploadSpeed}
     status={status} // 'uploading' | 'success' | 'error'
   />
   ```

**Other UX Improvements:**

1. **Bulk Operations**
   - Multi-select documents
   - Bulk download as ZIP
   - Bulk delete with confirmation

2. **Advanced Search**
   - Filter by file type, size range, date range
   - Search debouncing for better performance
   - Search history/suggestions

3. **Keyboard Shortcuts**
   - `Ctrl+U`: Upload
   - `Ctrl+F`: Focus search
   - Arrow keys: Navigate documents
   - `Enter`: Download selected

4. **Accessibility**
   - ARIA labels for screen readers
   - Keyboard navigation
   - Focus indicators
   - High contrast mode

5. **Offline Support**
   - Service worker for offline viewing
   - Queue uploads when offline
   - Sync when connection restored

6. **Notifications**
   - Toast messages for actions
   - Desktop notifications for completed uploads
   - Error alerts with retry options

---

## 🧪 Testing

While comprehensive tests are out of scope for this assignment, here are test scenarios covered manually:

- ✅ Upload single file
- ✅ Upload multiple files simultaneously
- ✅ Search documents by title
- ✅ Sort documents (newest/oldest)
- ✅ Pagination navigation
- ✅ Download documents with correct filenames
- ✅ Empty state handling
- ✅ Error handling for failed uploads
- ✅ Large file uploads (tested with 50MB+ files)
- ✅ Special characters in filenames

## 📝 License

MIT License - feel free to use this project for learning purposes.

## 👤 Author

Created as part of an internship assignment for Finfully.

---

**Note**: This is a demonstration project built in ~90 minutes. Not intended for production use without additional security hardening, authentication, and infrastructure improvements.
