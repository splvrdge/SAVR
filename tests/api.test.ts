import { API_URL } from '@/constants/API';

// Test user credentials
const TEST_USER = {
  user_email: 'test@example.com',
  user_password: 'Test123!',
};

// API base URL for tests
const TEST_API_URL = API_URL;

// Test data
const TEST_INCOME = {
  amount: 1000,
  category: 'Salary',
  description: 'Monthly salary',
  date: new Date().toISOString().split('T')[0]
};

const TEST_EXPENSE = {
  amount: 500,
  category: 'Food',
  description: 'Groceries',
  date: new Date().toISOString().split('T')[0]
};

const TEST_GOAL = {
  title: 'Test Goal',
  description: 'Test goal description',
  target_amount: 5000,
  target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
};

const TEST_CONTRIBUTION = {
  amount: 100,
  date: new Date().toISOString().split('T')[0]
};

// Global variables to store tokens and user ID
let accessToken: string;
let refreshToken: string;
let userId: number;

// Helper function for making API requests
async function makeRequest(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  } catch (error: any) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw error;
  }
}

// Test functions
async function testAuth() {
  console.log('\n🔐 Testing Authentication...');
  try {
    // Register new user first
    const registerResponse = await makeRequest(`${TEST_API_URL}/api/auth/signup`, {
      method: 'POST',
      body: JSON.stringify({
        user_name: 'Test User',
        user_email: TEST_USER.user_email,
        user_password: TEST_USER.user_password
      })
    });
    console.log('✅ Register successful');

    // Login
    const loginResponse = await makeRequest(`${TEST_API_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        user_email: TEST_USER.user_email,
        user_password: TEST_USER.user_password
      })
    });
    console.log('✅ Login successful');
    
    const { access_token, refresh_token, user_id } = loginResponse;
    
    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      userId: user_id
    };
  } catch (error: any) {
    console.error('❌ Auth test failed:', error.message);
    throw error;
  }
}

async function testIncome(accessToken: string, userId: number) {
  console.log('\n💰 Testing Income API...');
  try {
    // Add income
    const addResponse = await makeRequest(`${TEST_API_URL}/api/income/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ ...TEST_INCOME, user_id: userId })
    });
    console.log('✅ Add income successful');
    
    // Get all incomes
    await makeRequest(`${TEST_API_URL}/api/income/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Get incomes successful');
    
    // Update income
    const incomeId = addResponse.income_id;
    await makeRequest(`${TEST_API_URL}/api/income/${incomeId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ ...TEST_INCOME, amount: 1500 })
    });
    console.log('✅ Update income successful');
    
    // Delete income
    await makeRequest(`${TEST_API_URL}/api/income/${incomeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Delete income successful');
  } catch (error: any) {
    console.error('❌ Income test failed:', error.message);
    throw error;
  }
}

async function testExpense(accessToken: string, userId: number) {
  console.log('\n💸 Testing Expense API...');
  try {
    // Add expense
    const addResponse = await makeRequest(`${TEST_API_URL}/api/expense/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ ...TEST_EXPENSE, user_id: userId })
    });
    console.log('✅ Add expense successful');
    
    // Get all expenses
    await makeRequest(`${TEST_API_URL}/api/expense/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Get expenses successful');
    
    // Update expense
    const expenseId = addResponse.expense_id;
    await makeRequest(`${TEST_API_URL}/api/expense/${expenseId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ ...TEST_EXPENSE, amount: 600 })
    });
    console.log('✅ Update expense successful');
    
    // Delete expense
    await makeRequest(`${TEST_API_URL}/api/expense/${expenseId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Delete expense successful');
  } catch (error: any) {
    console.error('❌ Expense test failed:', error.message);
    throw error;
  }
}

async function testGoals(accessToken: string, userId: number) {
  console.log('\n🎯 Testing Goals API...');
  try {
    // Add goal
    const addResponse = await makeRequest(`${TEST_API_URL}/api/goals/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ ...TEST_GOAL, user_id: userId })
    });
    console.log('✅ Add goal successful');
    
    // Get all goals
    await makeRequest(`${TEST_API_URL}/api/goals/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Get goals successful');
    
    // Update goal
    const goalId = addResponse.goal_id;
    await makeRequest(`${TEST_API_URL}/api/goals/${goalId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ ...TEST_GOAL, target_amount: 6000 })
    });
    console.log('✅ Update goal successful');
    
    // Add contribution
    await makeRequest(`${TEST_API_URL}/api/goals/contribution/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ ...TEST_CONTRIBUTION, goal_id: goalId })
    });
    console.log('✅ Add goal contribution successful');
    
    // Delete goal
    await makeRequest(`${TEST_API_URL}/api/goals/${goalId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Delete goal successful');
  } catch (error: any) {
    console.error('❌ Goals test failed:', error.message);
    throw error;
  }
}

async function testAnalytics(accessToken: string, userId: number) {
  console.log('\n📊 Testing Analytics API...');
  try {
    // Get financial summary
    await makeRequest(`${TEST_API_URL}/api/financial/summary/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Get financial summary successful');
    
    // Get expense analytics
    await makeRequest(`${TEST_API_URL}/api/analytics/expenses/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Get expense analytics successful');

    // Get income analytics
    await makeRequest(`${TEST_API_URL}/api/analytics/income/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Get income analytics successful');

    // Get trends
    await makeRequest(`${TEST_API_URL}/api/analytics/trends/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Get trends analytics successful');
  } catch (error: any) {
    console.error('❌ Analytics test failed:', error.message);
    throw error;
  }
}

describe('API Integration Tests', () => {
  jest.setTimeout(60000); // Set timeout to 60 seconds

  test('Authentication', async () => {
    const result = await testAuth();
    accessToken = result.accessToken;
    refreshToken = result.refreshToken;
    userId = result.userId;
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    expect(userId).toBeDefined();
  });

  test('Income Management', async () => {
    await testIncome(accessToken, userId);
  });

  test('Expense Management', async () => {
    await testExpense(accessToken, userId);
  });

  test('Goals Management', async () => {
    await testGoals(accessToken, userId);
  });

  test('Analytics', async () => {
    await testAnalytics(accessToken, userId);
  });

  console.log('\n✨ All tests completed successfully!');
});
