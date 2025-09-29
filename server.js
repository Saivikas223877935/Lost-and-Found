const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const itemRoutes = require('./routes/items');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// attach io for controllers to emit events
app.set('io', io);

// ----- Ensure uploads dir exists at startup -----
const UPLOAD_DIR = path.join(__dirname, 'uploads');
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log('[init] uploads directory ready at', UPLOAD_DIR);
} catch (e) {
  console.error('[init] failed to create uploads directory:', e.message);
}

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// static (public assets)
app.use(express.static(path.join(__dirname, 'public')));

// serve uploaded images (e.g., /uploads/filename.png)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// api
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

// health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// sockets
require('./sockets')(io);

// start
const PORT = process.env.PORT || 8080;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/lostfound';

connectDB(MONGO_URL).then(() => {
  server.listen(PORT, () => console.log(`Server running on :${PORT}`));
}).catch((err) => {
  console.error('[db] connection error:', err);
});
