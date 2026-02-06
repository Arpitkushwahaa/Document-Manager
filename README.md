# Document Manager

A modern, full-stack document management system that supports uploading, listing, searching, and downloading documents with an immersive UI.

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DOCUMENT MANAGER ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐                                    ┌──────────────┐
│   FRONTEND      │──────── HTTP Requests ───────────▶│   BACKEND    │
│                 │                                    │              │
│  React + Vite   │◀────── JSON Responses ────────────│ Node.js +    │
│  Tailwind CSS   │                                    │ Express      │
│                 │                                    │              │
│ ┌─────────────┐ │                                    │ ┌──────────┐ │
│ │Upload UI    │ │─── POST /api/documents ──────────▶│ │ Multer   │ │
│ │(Drag&Drop)  │ │    (multipart/form-data)          │ │ Handler  │ │
│ └─────────────┘ │                                    │ └────┬─────┘ │
│                 │                                    │      │       │
│ ┌─────────────┐ │                                    │      ▼       │
│ │Search Bar   │ │─── GET /api/documents ───────────▶│ ┌──────────┐ │
│ │+ Filter     │ │    ?q=search&page=1&sort=desc     │ │ Query    │ │
│ └─────────────┘ │                                    │ │ Handler  │ │
│                 │                                    │ └────┬─────┘ │
│ ┌─────────────┐ │                                    │      │       │
│ │Document     │ │◀──── JSON (paginated results) ────│◀─────┘       │
│ │List +       │ │                                    │              │
│ │Pagination   │ │                                    │              │
│ └─────────────┘ │                                    │              │
│                 │                                    │              │
│ ┌─────────────┐ │                                    │ ┌──────────┐ │
│ │Download Btn │ │─── GET /api/documents/:id/────────▶│ │ Stream   │ │
│ │             │ │         download                   │ │ Handler  │ │
│ └─────────────┘ │◀──── File Stream ─────────────────│ └────┬─────┘ │
└─────────────────┘                                    └──────┼───────┘
                                                              │
                                                              ▼
                                                    ┌──────────────────┐
                                                    │  STORAGE LAYER   │
                                                    │                  │
                                                    │ ┌──────────────┐ │
                                                    │ │ /uploads/    │ │
                                                    │ │ (Binary      │ │
                                                    │ │  Files)      │ │
                                                    │ └──────────────┘ │
                                                    │                  │
                                                    │ ┌──────────────┐ │
                                                    │ │metadata.json │ │
                                                    │ │ (Document    │ │
                                                    │ │  Metadata)   │ │
                                                    │ └──────────────┘ │
                                                    └──────────────────┘

UPLOAD FLOW:
1. User selects files → 2. FormData created → 3. POST to backend → 
4. Multer saves to disk → 5. Metadata stored → 6. Success response

DOWNLOAD FLOW:
1. User clicks download → 2. GET request with ID → 3. Backend streams file →
4. Browser receives chunks → 5. File saved locally
```

## 📸 Screenshots

### Upload Interface
`Screenshot will be added here`

### Document List with Search
`Screenshot will be added here`

### Download Functionality
`Screenshot will be added here`

## 🎥 Demo Video

**Screen Recording (5 minutes):** `Demo link will be added here`

## 🚀 Features

- **Multiple File Upload**: Upload multiple documents simultaneously with drag-and-drop support
- **Smart Search**: Real-time text search across document titles
- **Sorting**: Sort documents by upload date (newest/oldest first)
- **Pagination**: Efficient navigation through large document collections
- **Streaming Downloads**: Memory-efficient file downloads using streaming
- **Responsive UI**: Beautiful, modern interface built with React and Tailwind CSS

## 📋 Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, Axios, Lucide React  
**Backend:** Node.js, Express, Multer, UUID, CORS  
**Storage:** Local disk for files, JSON for metadata

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

**Upload Documents**
```
POST /api/documents
Body: multipart/form-data with files[]
```

**List Documents**
```
GET /api/documents?page=1&pageSize=10&sortOrder=desc&q=search
```

**Download Document**
```
GET /api/documents/:id/download
Returns: File stream
```

---

## 📝 Setup Assumptions

1. **Local Development**: The application is designed to run locally on a single machine
2. **No Database**: Uses JSON file for metadata storage instead of a database
3. **Local File Storage**: Files are stored on the local disk in the `backend/uploads/` directory
4. **No Authentication**: No user authentication or authorization implemented
5. **CORS Enabled**: Backend allows cross-origin requests from the frontend
6. **Port Configuration**: Backend runs on port 5000, frontend on port 3000
7. **Node.js Environment**: Assumes Node.js v16+ is installed
8. **No Production Build**: Focused on development mode, not production deployment

---

## ⚙️ Key Tradeoffs Due to Time Limit

1. **Local Storage vs Cloud Storage**
   - Using local disk storage instead of S3/GCS
   - Simpler implementation but not scalable for production
   - Files are not backed up or distributed

2. **JSON File vs Database**
   - Using `metadata.json` instead of PostgreSQL/MongoDB
   - Easy for demo but has concurrency issues and no transactions
   - Not suitable for multiple servers or high traffic

3. **No Authentication/Authorization**
   - Skipped user authentication (OAuth/JWT)
   - Anyone can upload, view, and download all documents
   - Production would need user sessions and access controls

4. **Basic Validation**
   - Limited file type and size validation (100MB limit)
   - No virus scanning or content validation
   - Production needs comprehensive security checks

5. **Single Server Architecture**
   - No load balancing or horizontal scaling
   - No CDN for serving files
   - Backend becomes bottleneck for large files

6. **Minimal Error Handling**
   - Basic try-catch blocks but no retry mechanisms
   - No transaction rollback for failed uploads
   - Production needs comprehensive error recovery

---

## Design Questions

### 1. Multiple Uploads - How does your system handle uploading multiple documents?

**One request or many?**
- **Single HTTP request** for all files
- Frontend uses `FormData` to append multiple files with the same field name (`files[]`)
- Backend uses Multer's `.array('files')` method to process all files in one transaction

**Limits:**
- 100MB per file (configurable in Multer)
- No explicit limit on number of files per request
- Practically limited by HTTP timeout (~30 seconds) and available memory

**Tradeoffs:**

**Advantages:**
- ✅ More efficient - reduces HTTP overhead
- ✅ Atomic operation - all files succeed or fail together
- ✅ Better UX - single upload action with unified feedback
- ✅ Fewer server connections

**Disadvantages:**
- ❌ Large batches can timeout
- ❌ If one file fails, may need to retry all files
- ❌ Memory usage spikes with many large files simultaneously
- ❌ No granular progress per file (without additional implementation)

**Production Improvements:**
- Add maximum files per request (e.g., 50 files)
- Implement chunked uploads for files >100MB
- Use background job queue for large batches
- Add per-file upload progress tracking

---

### 2. Streaming - Why is streaming important for upload/download?

**Why Streaming Matters:**

Without streaming, the server must load the entire file into memory before sending it to the client.

**Example:**
- 1GB file without streaming = 1GB RAM used per download
- 10 concurrent users = 10GB RAM needed
- Server crashes with out-of-memory errors

**Problems When Server Loads Full File into Memory:**

1. **Memory Exhaustion**
   - Large files consume massive amounts of RAM
   - Multiple concurrent downloads quickly exhaust available memory
   - Server becomes unstable and may crash
   - Can't scale to handle many users

2. **Slow Time to First Byte**
   - Client must wait for server to read entire file first
   - No data sent until complete file is loaded
   - Poor user experience with no immediate feedback

3. **Resource Waste**
   - If user cancels download, all memory/CPU already wasted
   - Failed connections waste resources that could serve other users

4. **File Size Limitations**
   - Can't serve files larger than available RAM
   - Severely limits use cases

**Benefits of Streaming (Our Implementation):**

```javascript
// Backend streams file in small chunks
const fileStream = fsSync.createReadStream(filePath);
fileStream.pipe(res); // Pipe chunks directly to response
```

- ✅ **Constant memory usage** (~16KB buffer regardless of file size)
- ✅ **Immediate response** - starts sending data right away
- ✅ **Handles large files** - can serve files bigger than RAM
- ✅ **Graceful cancellation** - stops reading if client disconnects
- ✅ **Scalable** - supports many concurrent downloads efficiently

---

### 3. Moving to S3 - If files move to object storage (e.g., S3):

**What changes in your backend?**

**1. Upload Endpoint Changes:**
```javascript
// Before (Local Disk):
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => cb(null, `${uuid()}${ext}`)
});

// After (S3):
const storage = multerS3({
  s3: s3Client,
  bucket: 'my-documents',
  key: (req, file, cb) => cb(null, `documents/${uuid()}${ext}`)
});
```

**2. Metadata Storage:**
```javascript
// Before:
{ filename: "abc123.pdf", ... }

// After:
{ 
  s3Key: "documents/abc123.pdf",
  s3Bucket: "my-documents",
  s3Region: "us-east-1",
  ...
}
```

**3. Download Endpoint Changes:**
- Generate pre-signed URLs instead of streaming from disk
- Or stream from S3 through backend (less efficient)

**4. Dependencies:**
- Add AWS SDK (`@aws-sdk/client-s3`, `multer-s3`)
- Configure AWS credentials and IAM roles
- Add S3 bucket configuration

**Would the backend still handle file bytes?**

**Two approaches:**

**Option 1: Backend Proxies (Streaming through backend)**
```javascript
const s3Stream = s3Client.getObject({ Bucket, Key }).createReadStream();
s3Stream.pipe(res);
```
- Backend still handles bytes by streaming S3 → Backend → Client
- **Use when:** Need access control, logging, transformation
- **Tradeoff:** Backend bandwidth costs, increased latency

**Option 2: Pre-signed URLs (Recommended)**
```javascript
const url = s3Client.getSignedUrl('getObject', {
  Bucket: 'my-documents',
  Key: document.s3Key,
  Expires: 3600 // 1 hour
});
res.json({ downloadUrl: url });
```
- Backend does NOT handle bytes - client downloads directly from S3
- **Use when:** Want fast downloads, reduce backend load
- **Tradeoff:** Less control over access, URL can be shared temporarily

**Recommendation:**
- **Downloads:** Use pre-signed URLs (faster, scalable)
- **Uploads:** Proxy through backend for validation and virus scanning

**Additional considerations:**
- Enable S3 versioning for file history
- Add lifecycle policies to archive old files
- Use CloudFront CDN for global distribution
- Implement retry logic for S3 API failures

---

### 4. Frontend UX - If you had more time:

**How would you add document preview?**

**Implementation Plan:**

1. **Preview Modal Component**
   - Click document → opens full-screen modal
   - Display based on file type

2. **File Type Handling**
   - **PDFs:** Use `react-pdf` or `pdf.js` to render pages
   - **Images:** Display with `<img>` tag, add zoom/pan controls
   - **Text/Code:** Syntax highlighting with `react-syntax-highlighter`
   - **Office Docs:** Embed using Google Docs Viewer or Office Online
   - **Videos:** HTML5 `<video>` player with controls
   - **Other:** Show metadata and download option

3. **Backend Endpoint**
   ```javascript
   GET /api/documents/:id/preview
   // Returns optimized preview version (thumbnails, first page, etc.)
   ```

4. **UX Features**
   - Navigation arrows for next/previous document
   - Zoom controls for images/PDFs
   - Full download button within preview
   - Close on ESC key or click outside
   - Loading spinner while fetching

**How would you show upload progress?**

**Implementation:**

1. **Track Upload Progress**
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

2. **Visual Progress Indicators**
   - **Per-file progress bar** showing percentage (0-100%)
   - **Overall progress** for batch upload
   - **Upload speed** (MB/s calculated from bytes and time)
   - **Estimated time remaining** (ETA)
   - **Status icons** (uploading/success/error per file)

3. **Advanced Features**
   - Pause/resume uploads (requires chunked upload implementation)
   - Cancel individual files without stopping others
   - Retry failed uploads automatically or manually
   - Background uploads (continue while browsing)
   - Desktop notifications when complete

4. **UI Component Example**
   ```jsx
   <ProgressBar 
     fileName="document.pdf"
     progress={75}
     speed="2.5 MB/s"
     timeRemaining="15 seconds"
     status="uploading" // or 'success' | 'error'
   />
   ```

---

## 📝 License

MIT License

## 👤 Author

**Arpit Kushwaha**

Created as part of an internship assignment for Finfully AI.

---

**Note**: This is a demonstration project built in ~90 minutes. Not intended for production use without additional security hardening, authentication, and infrastructure improvements.
