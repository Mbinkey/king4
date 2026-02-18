import { Car, Order, TestDrive, ContactMessage, AdminUser } from './database';

const API_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  cars: {
    getAll: () => fetchAPI<Car[]>('/cars'),
    getById: (id: string) => fetchAPI<Car>(`/cars/${id}`),
    create: (car: Car) => fetchAPI<Car>('/cars', { method: 'POST', body: JSON.stringify(car) }),
    update: (car: Car) => fetchAPI<Car>(`/cars/${car.id}`, { method: 'PUT', body: JSON.stringify(car) }),
    delete: (id: string) => fetchAPI<void>(`/cars/${id}`, { method: 'DELETE' }),
  },
  orders: {
    getAll: () => fetchAPI<Order[]>('/orders'),
    getById: (id: string) => fetchAPI<Order>(`/orders/${id}`),
    create: (order: Order) => fetchAPI<Order>('/orders', { method: 'POST', body: JSON.stringify(order) }),
    update: (order: Order) => fetchAPI<Order>(`/orders/${order.id}`, { method: 'PUT', body: JSON.stringify(order) }),
    delete: (id: string) => fetchAPI<void>(`/orders/${id}`, { method: 'DELETE' }),
  },
  testDrives: {
    getAll: () => fetchAPI<TestDrive[]>('/testdrives'),
    getById: (id: string) => fetchAPI<TestDrive>(`/testdrives/${id}`),
    create: (td: TestDrive) => fetchAPI<TestDrive>('/testdrives', { method: 'POST', body: JSON.stringify(td) }),
    update: (td: TestDrive) => fetchAPI<TestDrive>(`/testdrives/${td.id}`, { method: 'PUT', body: JSON.stringify(td) }),
    delete: (id: string) => fetchAPI<void>(`/testdrives/${id}`, { method: 'DELETE' }),
  },
  messages: {
    getAll: () => fetchAPI<ContactMessage[]>('/messages'),
    getById: (id: string) => fetchAPI<ContactMessage>(`/messages/${id}`),
    create: (msg: ContactMessage) => fetchAPI<ContactMessage>('/messages', { method: 'POST', body: JSON.stringify(msg) }),
    update: (msg: ContactMessage) => fetchAPI<ContactMessage>(`/messages/${msg.id}`, { method: 'PUT', body: JSON.stringify(msg) }),
    delete: (id: string) => fetchAPI<void>(`/messages/${id}`, { method: 'DELETE' }),
  },
  auth: {
    login: async (username: string, password: string) => {
      try {
        const { token } = await fetchAPI<{ token: string }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        });
        localStorage.setItem('admin_token', token);
        return true;
      } catch (e) {
        return false;
      }
    },
    setupAdmin: async () => {
      // Backend handles seeding automatically
    },
    changePassword: async () => {
      // Not implemented in backend yet
      return false; 
    }
  },
  seed: async () => {
    // Backend handles seeding automatically
  }
};
