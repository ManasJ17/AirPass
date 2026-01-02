const express = require("express");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const archiver = require("archiver");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5000;

// Enable CORS (good for future if frontend is separate)
app.use(cors());

// Parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static frontend from /public
app.use(express.static(path.join(__dirname, "public")));

// ====== File Storage Setup (memory-only for serverless)
// Use memory storage so serverless platforms (Vercel) don't attempt disk writes.
const upload = multer({ storage: multer.memoryStorage() });

// In-memory mapping: key -> file metadata
// (Later you can replace this with MongoDB)
const files = new Map();

// ====== Chat Rooms Storage ======
// In-memory chat rooms storage
const rooms = new Map();

// Helper function to generate 10-character room key
function generateRoomKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 10; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Helper function to check if room is expired
function isRoomExpired(roomInfo) {
  if (!roomInfo.expiresAt) return false;
  return Date.now() > roomInfo.expiresAt;
}

// Helper function to clean expired chat rooms
function cleanExpiredRooms() {
  for (const [key, roomInfo] of rooms.entries()) {
    if (isRoomExpired(roomInfo)) {
      // Disconnect all users in expired room
      roomInfo.users.forEach(user => {
        const socket = io.sockets.sockets.get(user.socketId);
        if (socket) {
          socket.emit('room-error', { message: 'Chat room has expired' });
          socket.disconnect();
        }
      });
      rooms.delete(key);
      console.log(`Expired chat room ${key} deleted`);
    }
  }
}

// ====== Routes ======

// Health check (optional)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Helper function to convert expiry to milliseconds
function convertExpiryToMs(value, unit) {
  const num = parseInt(value) || 12; // default 12
  switch(unit) {
    case 'minutes': return num * 60 * 1000;
    case 'hours': return num * 60 * 60 * 1000;
    case 'days': return num * 24 * 60 * 60 * 1000;
    default: return 12 * 60 * 60 * 1000; // default 12 hours
  }
}

// Helper function to check if key is expired
function isKeyExpired(fileInfo) {
  if (!fileInfo.expiresAt) return false; // no expiry set
  return Date.now() > fileInfo.expiresAt;
}

// Helper function to clean expired entries
function cleanExpiredEntries() {
  for (const [key, fileInfo] of files.entries()) {
    if (isKeyExpired(fileInfo)) {
      files.delete(key);
    }
  }
}

// 1) Upload file, return key
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const key = uuidv4().slice(0, 8).toUpperCase(); // short 8-char key, uppercase
  
  // Calculate expiry time
  const expiryMs = convertExpiryToMs(req.body.expiryValue, req.body.expiryUnit);
  const expiresAt = Date.now() + expiryMs;

  // Store file buffer and metadata in-memory (temporary)
  files.set(key, {
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    uploadedAt: Date.now(),
    note: req.body.note || null,
    expiresAt: expiresAt
  });

  return res.json({ key });
});

// 1.5) Upload multiple files, create ZIP, return key
app.post("/api/upload-multiple", upload.array("files"), async (req, res) => {
  try {
    const uploadedFiles = req.files;
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const key = uuidv4().slice(0, 8).toUpperCase(); // short 8-char key, uppercase
    
    // Calculate expiry time
    const expiryMs = convertExpiryToMs(req.body.expiryValue, req.body.expiryUnit);
    const expiresAt = Date.now() + expiryMs;

    // Create ZIP in memory using Promise
    const zipBuffer = await new Promise((resolve, reject) => {
      const archive = archiver("zip", { zlib: { level: 9 } });
      const chunks = [];

      // Collect ZIP data
      archive.on("data", chunk => chunks.push(chunk));
      archive.on("error", reject);
      archive.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });

      // Add files to archive
      uploadedFiles.forEach(file => {
        archive.append(file.buffer, { name: file.originalname });
      });

      // Finalize the archive
      archive.finalize();
    });

    // Store ZIP buffer and metadata in-memory
    files.set(key, {
      buffer: zipBuffer,
      originalName: `AirPass-Files-${key}.zip`,
      mimeType: "application/zip",
      uploadedAt: Date.now(),
      note: req.body.note || null,
      fileCount: uploadedFiles.length,
      isMultiFile: true,
      expiresAt: expiresAt
    });

    res.json({ key });

  } catch (err) {
    console.error("Multi-upload error:", err);
    res.status(500).json({ message: "Failed to create ZIP file" });
  }
});

// 2) Get file info using key
app.get("/api/file/:key", (req, res) => {
  // Clean expired entries first
  cleanExpiredEntries();
  
  const key = req.params.key;
  const fileInfo = files.get(key);

  if (!fileInfo) {
    return res.status(404).json({ message: "Invalid or expired key" });
  }
  
  // Check if key has expired
  if (isKeyExpired(fileInfo)) {
    files.delete(key); // Remove expired entry
    return res.status(410).json({ ok: false, error: 'expired' });
  }

  // Return file metadata without the buffer
  res.json({
    filename: fileInfo.originalName,
    size: formatFileSize(fileInfo.buffer.length),
    type: fileInfo.isMultiFile ? `ZIP Package (${fileInfo.fileCount} files)` : getFileType(fileInfo.originalName, fileInfo.mimeType),
    uploadedAt: fileInfo.uploadedAt,
    note: fileInfo.note || null,
    isMultiFile: fileInfo.isMultiFile || false,
    fileCount: fileInfo.fileCount || 1
  });
});

// 3) Download file using key
app.get("/api/download/:key", (req, res) => {
  // Clean expired entries first
  cleanExpiredEntries();
  
  const key = req.params.key;
  const fileInfo = files.get(key);

  if (!fileInfo) {
    return res.status(404).json({ message: "Invalid or expired key" });
  }
  
  // Check if key has expired
  if (isKeyExpired(fileInfo)) {
    files.delete(key); // Remove expired entry
    return res.status(410).json({ ok: false, error: 'expired' });
  }

  // Serve from memory buffer
  if (!fileInfo.buffer) {
    return res.status(404).json({ message: "File not available" });
  }

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileInfo.originalName}"`
  );
  res.setHeader("Content-Type", fileInfo.mimeType || "application/octet-stream");
  return res.send(fileInfo.buffer);
});

// Helper functions
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileType(filename, mimeType) {
  const ext = filename.split('.').pop().toLowerCase();
  
  if (mimeType?.startsWith('image/')) return 'Image';
  if (mimeType?.startsWith('video/')) return 'Video';
  if (mimeType?.startsWith('audio/')) return 'Audio';
  if (mimeType?.includes('pdf')) return 'PDF Document';
  if (mimeType?.includes('word') || ext === 'docx') return 'Word Document';
  if (mimeType?.includes('excel') || ext === 'xlsx') return 'Excel Spreadsheet';
  if (mimeType?.includes('powerpoint') || ext === 'pptx') return 'PowerPoint Presentation';
  if (ext === 'txt') return 'Text Document';
  if (ext === 'zip' || ext === 'rar') return 'Archive';
  
  return 'File';
}

// New route for file info (used by QR Share page)
app.get("/api/file-info/:key", (req, res) => {
  // Clean expired entries first
  cleanExpiredEntries();
  
  const key = req.params.key;
  const fileInfo = files.get(key);

  if (!fileInfo) {
    return res.status(404).json({ message: "Invalid or expired key" });
  }
  
  // Check if key has expired
  if (isKeyExpired(fileInfo)) {
    files.delete(key); // Remove expired entry
    return res.status(410).json({ ok: false, error: 'expired' });
  }

  // Return basic file info for validation
  res.json({
    exists: true,
    filename: fileInfo.originalName,
    expiresAt: fileInfo.expiresAt
  });
});

// ====== Socket.IO Chat Logic ======
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new chat room
  socket.on('create-room', () => {
    try {
      let roomKey;
      do {
        roomKey = generateRoomKey();
      } while (rooms.has(roomKey)); // Ensure unique key

      const expiresAt = Date.now() + (12 * 60 * 60 * 1000); // 12 hours

      rooms.set(roomKey, {
        createdAt: Date.now(),
        expiresAt: expiresAt,
        users: [],
        lastActivity: Date.now()
      });

      socket.emit('room-created', { key: roomKey });
      console.log(`Chat room created: ${roomKey}`);
    } catch (error) {
      socket.emit('room-error', { message: 'Failed to create room' });
    }
  });

  // Join an existing chat room
  socket.on('join-room', (data) => {
    try {
      const { key, name } = data;
      
      if (!key || !name) {
        socket.emit('room-error', { message: 'Room key and display name are required' });
        return;
      }

      // Clean expired rooms first
      cleanExpiredRooms();

      const roomInfo = rooms.get(key);
      
      if (!roomInfo) {
        socket.emit('room-error', { message: 'Room not found' });
        return;
      }

      if (isRoomExpired(roomInfo)) {
        socket.emit('room-error', { message: 'Room has expired' });
        rooms.delete(key);
        return;
      }

      // Check if name already exists in room
      const existingUser = roomInfo.users.find(user => user.name === name);
      if (existingUser) {
        socket.emit('room-error', { message: 'Display name already taken in this room' });
        return;
      }

      // Join the room
      socket.join(key);
      
      // Add user to room
      roomInfo.users.push({
        socketId: socket.id,
        name: name
      });
      
      roomInfo.lastActivity = Date.now();

      // Notify room that user joined
      socket.to(key).emit('system-message', {
        message: `${name} joined the chat`,
        timestamp: Date.now()
      });

      // Emit user count update to all users in the room
      io.to(key).emit('room-users-update', {
        count: roomInfo.users.length,
        users: roomInfo.users.map(user => user.name)
      });

      // Confirm successful join to user
      socket.emit('room-joined', { key: key, name: name });
      
      console.log(`${name} joined room ${key}`);
    } catch (error) {
      socket.emit('room-error', { message: 'Failed to join room' });
    }
  });

  // Handle chat messages
  socket.on('send-message', (data) => {
    try {
      const { key, message, name } = data;
      
      if (!key || !message || !name) {
        return;
      }

      const roomInfo = rooms.get(key);
      if (!roomInfo || isRoomExpired(roomInfo)) {
        socket.emit('room-error', { message: 'Room not found or expired' });
        return;
      }

      // Update last activity
      roomInfo.lastActivity = Date.now();

      // Broadcast message to all users in the room (including sender)
      io.to(key).emit('chat-message', {
        name: name,
        message: message,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Handle typing events
  socket.on('typing-start', (data) => {
    try {
      const { key, name } = data;
      
      if (!key || !name) {
        return;
      }

      const roomInfo = rooms.get(key);
      if (!roomInfo || isRoomExpired(roomInfo)) {
        return;
      }

      // Broadcast typing indicator to other users in the room (not sender)
      socket.to(key).emit('user-typing', {
        name: name,
        isTyping: true
      });
      
    } catch (error) {
      console.error('Error handling typing start:', error);
    }
  });

  socket.on('typing-stop', (data) => {
    try {
      const { key, name } = data;
      
      if (!key || !name) {
        return;
      }

      const roomInfo = rooms.get(key);
      if (!roomInfo || isRoomExpired(roomInfo)) {
        return;
      }

      // Broadcast typing stop to other users in the room (not sender)
      socket.to(key).emit('user-typing', {
        name: name,
        isTyping: false
      });
      
    } catch (error) {
      console.error('Error handling typing stop:', error);
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove user from all rooms
    for (const [key, roomInfo] of rooms.entries()) {
      const userIndex = roomInfo.users.findIndex(user => user.socketId === socket.id);
      if (userIndex !== -1) {
        const user = roomInfo.users[userIndex];
        roomInfo.users.splice(userIndex, 1);
        
        // Notify room that user left
        socket.to(key).emit('system-message', {
          message: `${user.name} left the chat`,
          timestamp: Date.now()
        });

        // Stop any typing indicators for this user
        socket.to(key).emit('user-typing', {
          name: user.name,
          isTyping: false
        });

        // Emit updated user count to remaining users in the room
        io.to(key).emit('room-users-update', {
          count: roomInfo.users.length,
          users: roomInfo.users.map(user => user.name)
        });
        
        console.log(`${user.name} left room ${key}`);
        break;
      }
    }
  });
});

// Periodic cleanup every 10 minutes
setInterval(() => {
  console.log('Running periodic cleanup...');
  cleanExpiredEntries();
  cleanExpiredRooms();
}, 10 * 60 * 1000);

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = server;
