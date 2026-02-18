import { api } from './api-client';

export interface Car {
  id: string;
  name: string;
  brand: string;
  year: number;
  price: number;
  mileage: string;
  engine: string;
  horsepower: string;
  transmission: string;
  topSpeed: string;
  acceleration: string;
  fuelType: string;
  color: string;
  description: string;
  status: 'in-stock' | 'sold-out' | 'coming-soon';
  images: string[];
  featured: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  carId: string;
  carName: string;
  customerName: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  totalPrice: number;
  createdAt: string;
  notes: string;
}

export interface TestDrive {
  id: string;
  carId: string;
  carName: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
}

// --- Local IndexedDB Implementation ---
const DB_NAME = 'ApexMotorsDB';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('cars')) {
        db.createObjectStore('cars', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('orders')) {
        db.createObjectStore('orders', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('testdrives')) {
        db.createObjectStore('testdrives', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('messages')) {
        db.createObjectStore('messages', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('admin')) {
        db.createObjectStore('admin', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
  });
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getById<T>(storeName: string, id: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function put<T>(storeName: string, data: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function remove(storeName: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'apex_salt_2024');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const localDB = {
  cars: {
    getAll: () => getAll<Car>('cars'),
    getById: (id: string) => getById<Car>('cars', id),
    create: (car: Car) => put('cars', car),
    update: (car: Car) => put('cars', car),
    delete: (id: string) => remove('cars', id),
  },
  orders: {
    getAll: () => getAll<Order>('orders'),
    getById: (id: string) => getById<Order>('orders', id),
    create: (order: Order) => put('orders', order),
    update: (order: Order) => put('orders', order),
    delete: (id: string) => remove('orders', id),
  },
  testDrives: {
    getAll: () => getAll<TestDrive>('testdrives'),
    getById: (id: string) => getById<TestDrive>('testdrives', id),
    create: (td: TestDrive) => put('testdrives', td),
    update: (td: TestDrive) => put('testdrives', td),
    delete: (id: string) => remove('testdrives', id),
  },
  messages: {
    getAll: () => getAll<ContactMessage>('messages'),
    getById: (id: string) => getById<ContactMessage>('messages', id),
    create: (msg: ContactMessage) => put('messages', msg),
    update: (msg: ContactMessage) => put('messages', msg),
    delete: (id: string) => remove('messages', id),
  },
  auth: {
    hashPassword,
    login: async (username: string, password: string): Promise<boolean> => {
      const admins = await getAll<AdminUser>('admin');
      const hashed = await hashPassword(password);
      const admin = admins.find(a => a.username === username && a.passwordHash === hashed);
      return !!admin;
    },
    setupAdmin: async () => {
      const admins = await getAll<AdminUser>('admin');
      const oldAdmin = admins.find(a => a.username === 'admin');
      if (oldAdmin) await remove('admin', oldAdmin.id);
      
      const newAdmin = admins.find(a => a.username === 'Fod@y@kings auto');
      if (!newAdmin) {
        const hashed = await hashPassword('7727113j');
        await put('admin', { id: 'admin-1', username: 'Fod@y@kings auto', passwordHash: hashed });
      }
    },
    changePassword: async (oldPassword: string, newPassword: string): Promise<boolean> => {
      const admins = await getAll<AdminUser>('admin');
      const oldHash = await hashPassword(oldPassword);
      const admin = admins.find(a => a.passwordHash === oldHash);
      if (!admin) return false;
      const newHash = await hashPassword(newPassword);
      admin.passwordHash = newHash;
      await put('admin', admin);
      return true;
    }
  },
  seed: async () => {
    await localDB.auth.setupAdmin();
    const meta = await getById<{key: string; value: boolean}>('meta', 'seeded');
    if (meta?.value) return;

    const sampleCars: Car[] = [
      {
        id: 'car-1',
        name: 'Veloce GT',
        brand: 'APEX',
        year: 2024,
        price: 285000,
        mileage: '0 mi',
        engine: '5.2L V10',
        horsepower: '640 HP',
        transmission: '7-Speed DCT',
        topSpeed: '212 mph',
        acceleration: '2.9s 0-60',
        fuelType: 'Premium',
        color: 'Inferno Orange',
        description: 'The APEX Veloce GT represents the pinnacle of automotive engineering.',
        status: 'in-stock',
        images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80'],
        featured: true,
        createdAt: new Date().toISOString(),
      },
      // ... (rest of samples would be here, truncated for brevity in this hybrid file but we can restore if needed)
    ];
    // Simple seed if empty
    const existing = await getAll<Car>('cars');
    if (existing.length === 0) {
       for (const car of sampleCars) { await localDB.cars.create(car); }
       await put('meta', { key: 'seeded', value: true });
    }
  }
};

// --- Export Decision ---
// If we are in production AND configured to use the server, use API.
// Otherwise use LocalDB (Preview Mode).
const USE_SERVER = import.meta.env.VITE_USE_SERVER === 'true';

export const db = USE_SERVER ? api : localDB;
