import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5001; // Use one port variable

// --- Middleware ---
app.use(cors()); // Allow requests from other origins (like your React app)
app.use(express.json()); // To parse JSON request bodies

// --- Multer Setup for Image Upload ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Save file with unique name
  },
});

const upload = multer({ storage });

// --- MongoDB Connection ---
mongoose.connect('mongodb+srv://suyogya227_db_user:pU7hLo5XDHngpvuq@cluster0.zsc4nxd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// --- Mongoose Schema & Model ---
const itemSchema = new mongoose.Schema({
  name: String,
  image: String, // Store image file path
});
const Item = mongoose.model('Item', itemSchema);

// --- API Routes ---

// Get all items
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new item with image
app.post('/api/items', upload.single('image'), async (req, res) => {
  const { name } = req.body;
  const imagePath = req.file ? req.file.filename : null; // Get the filename from Multer

  const newItem = new Item({ name, image: imagePath });
  try {
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Serve uploaded images statically
app.use('/uploads', express.static('uploads'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} 🚀`);
});
