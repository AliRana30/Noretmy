// Mock API for testing login functionality
// In a real application, this would be replaced with actual API calls

const MOCK_USERS = [
  {
    id: 1,
    email: 'admin@noretmy.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    avatar: 'https://images.pexels.com/photos/941693/pexels-photo-941693.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500'
  },
  {
    id: 2,
    email: 'demo@noretmy.com',
    password: 'demo123',
    name: 'Demo User',
    role: 'admin',
    avatar: 'https://images.pexels.com/photos/941693/pexels-photo-941693.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500'
  }
];

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockLoginAPI = async (email, password) => {
  // Simulate network delay
  await delay(1000);
  
  const user = MOCK_USERS.find(u => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  // Return user data without password
  const { password: _, ...userData } = user;
  
  return {
    success: true,
    token: `mock-jwt-token-${user.id}-${Date.now()}`,
    user: userData
  };
};

export const mockLogoutAPI = async () => {
  await delay(500);
  return { success: true };
}; 