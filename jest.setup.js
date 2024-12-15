const fetch = require('cross-fetch');
global.fetch = fetch;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock URL
global.URL = class URL {
  constructor(url, base) {
    return url;
  }
  static createObjectURL(blob) {
    return 'blob:test';
  }
  static revokeObjectURL(url) {}
};

// Set default timeout for all tests
jest.setTimeout(30000);
