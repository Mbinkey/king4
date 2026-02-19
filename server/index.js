// Server configuration for Render deployment
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || 'apex-secret-key-2024';

app.use(cors());
// Increase payload size limit to handle base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database Setup
let db;

async function initDB() {
  // Use /tmp directory for database file in production environments (like Render)
  // because the app directory is often read-only or ephemeral.
  // Fallback to local directory for development.
  const dbPath = process.env.NODE_ENV === 'production' 
    ? '/tmp/apex.sqlite' 
    : path.join(__dirname, 'apex.sqlite');
    
  console.log(`Initializing database at: ${dbPath}`);

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS cars (
      id TEXT PRIMARY KEY,
      name TEXT,
      brand TEXT,
      year INTEGER,
      price INTEGER,
      mileage TEXT,
      engine TEXT,
      horsepower TEXT,
      transmission TEXT,
      topSpeed TEXT,
      acceleration TEXT,
      fuelType TEXT,
      color TEXT,
      description TEXT,
      status TEXT,
      images TEXT,
      featured BOOLEAN,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      carId TEXT,
      carName TEXT,
      customerName TEXT,
      email TEXT,
      phone TEXT,
      country TEXT,
      address TEXT,
      status TEXT,
      totalPrice INTEGER,
      createdAt TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS testdrives (
      id TEXT PRIMARY KEY,
      carId TEXT,
      carName TEXT,
      customerName TEXT,
      email TEXT,
      phone TEXT,
      date TEXT,
      time TEXT,
      location TEXT,
      status TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      subject TEXT,
      message TEXT,
      read BOOLEAN,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      passwordHash TEXT
    );
  `);

  // Seed Admin
  const adminUsername = 'Fod@y@kings auto';
  const adminPassword = '7727113j';

  // Check if admin exists
  const existingAdmin = await db.get('SELECT * FROM admins WHERE username = ?', [adminUsername]);
  
  if (!existingAdmin) {
    // Remove any old admins to be safe/clean
    await db.run('DELETE FROM admins');
    
    const hash = await bcrypt.hash(adminPassword, 10);
    await db.run('INSERT INTO admins (id, username, passwordHash) VALUES (?, ?, ?)', ['admin-1', adminUsername, hash]);
    console.log('Admin seeded with new credentials');
  }

  console.log('Database initialized');
}

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../dist')));

// Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Health Check
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await db.get('SELECT * FROM admins WHERE username = ?', [username]);
  
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: admin.id, username: admin.username }, SECRET, { expiresIn: '24h' });
  res.json({ token });
});

// Car Routes
app.get('/api/cars', async (req, res) => {
  const cars = await db.all('SELECT * FROM cars');
  res.json(cars.map(c => ({...c, images: JSON.parse(c.images), featured: !!c.featured})));
});

app.get('/api/cars/:id', async (req, res) => {
  const car = await db.get('SELECT * FROM cars WHERE id = ?', [req.params.id]);
  if (!car) return res.status(404).json({ error: 'Not found' });
  res.json({...car, images: JSON.parse(car.images), featured: !!car.featured});
});

app.post('/api/cars', authenticate, async (req, res) => {
  try {
    const car = req.body;
    console.log(`[API] Received request to add car: ${car.name} (${car.id})`);
    
    // Ensure images is stringified
    const imagesStr = Array.isArray(car.images) ? JSON.stringify(car.images) : JSON.stringify([]);
    
    await db.run(
      `INSERT INTO cars (id, name, brand, year, price, mileage, engine, horsepower, transmission, topSpeed, acceleration, fuelType, color, description, status, images, featured, createdAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        car.id, 
        car.name, 
        car.brand, 
        car.year, 
        car.price, 
        car.mileage, 
        car.engine, 
        car.horsepower, 
        car.transmission, 
        car.topSpeed, 
        car.acceleration, 
        car.fuelType, 
        car.color, 
        car.description, 
        car.status, 
        imagesStr, 
        car.featured ? 1 : 0, // Ensure boolean is stored as integer
        car.createdAt || new Date().toISOString()
      ]
    );
    console.log(`[API] Successfully added car: ${car.id}`);
    res.json(car);
  } catch (error) {
    console.error('[API] Error adding car:', error);
    res.status(500).json({ error: 'Failed to add car', details: error.message });
  }
});

app.put('/api/cars/:id', authenticate, async (req, res) => {
  try {
    const car = req.body;
    console.log(`[API] Updating car: ${car.id}`);
    
    const imagesStr = Array.isArray(car.images) ? JSON.stringify(car.images) : JSON.stringify([]);

    await db.run(
      `UPDATE cars SET name=?, brand=?, year=?, price=?, mileage=?, engine=?, horsepower=?, transmission=?, topSpeed=?, acceleration=?, fuelType=?, color=?, description=?, status=?, images=?, featured=? WHERE id=?`,
      [
        car.name, 
        car.brand, 
        car.year, 
        car.price, 
        car.mileage, 
        car.engine, 
        car.horsepower, 
        car.transmission, 
        car.topSpeed, 
        car.acceleration, 
        car.fuelType, 
        car.color, 
        car.description, 
        car.status, 
        imagesStr, 
        car.featured ? 1 : 0, 
        req.params.id
      ]
    );
    res.json(car);
  } catch (error) {
    console.error('[API] Error updating car:', error);
    res.status(500).json({ error: 'Failed to update car' });
  }
});

app.delete('/api/cars/:id', authenticate, async (req, res) => {
  await db.run('DELETE FROM cars WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// Order Routes
app.get('/api/orders', authenticate, async (req, res) => {
  const orders = await db.all('SELECT * FROM orders');
  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  const order = req.body;
  await db.run(
    `INSERT INTO orders (id, carId, carName, customerName, email, phone, country, address, status, totalPrice, createdAt, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [order.id, order.carId, order.carName, order.customerName, order.email, order.phone, order.country, order.address, order.status, order.totalPrice, order.createdAt, order.notes]
  );
  res.json(order);
});

app.put('/api/orders/:id', authenticate, async (req, res) => {
  const order = req.body;
  await db.run('UPDATE orders SET status = ? WHERE id = ?', [order.status, req.params.id]);
  res.json(order);
});

app.delete('/api/orders/:id', authenticate, async (req, res) => {
  await db.run('DELETE FROM orders WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// Test Drive Routes
app.get('/api/testdrives', authenticate, async (req, res) => {
  const tds = await db.all('SELECT * FROM testdrives');
  res.json(tds);
});

app.post('/api/testdrives', async (req, res) => {
  const td = req.body;
  await db.run(
    `INSERT INTO testdrives (id, carId, carName, customerName, email, phone, date, time, location, status, createdAt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [td.id, td.carId, td.carName, td.customerName, td.email, td.phone, td.date, td.time, td.location, td.status, td.createdAt]
  );
  res.json(td);
});

app.put('/api/testdrives/:id', authenticate, async (req, res) => {
  const td = req.body;
  await db.run('UPDATE testdrives SET status = ? WHERE id = ?', [td.status, req.params.id]);
  res.json(td);
});

app.delete('/api/testdrives/:id', authenticate, async (req, res) => {
  await db.run('DELETE FROM testdrives WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// Message Routes
app.get('/api/messages', authenticate, async (req, res) => {
  const msgs = await db.all('SELECT * FROM messages');
  res.json(msgs.map(m => ({...m, read: !!m.read})));
});

app.post('/api/messages', async (req, res) => {
  const msg = req.body;
  await db.run(
    `INSERT INTO messages (id, name, email, phone, subject, message, read, createdAt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [msg.id, msg.name, msg.email, msg.phone, msg.subject, msg.message, msg.read, msg.createdAt]
  );
  res.json(msg);
});

app.put('/api/messages/:id', authenticate, async (req, res) => {
  const msg = req.body;
  await db.run('UPDATE messages SET read = ? WHERE id = ?', [msg.read, req.params.id]);
  res.json(msg);
});

app.delete('/api/messages/:id', authenticate, async (req, res) => {
  await db.run('DELETE FROM messages WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// Handle React routing, return all requests to React app
// Using regex to match all routes safely in newer Express versions
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
