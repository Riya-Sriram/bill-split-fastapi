// API Service for FastAPI Backend Communication
// Centralized API calls for better maintainability

const BACKEND_URL = import.meta.env.VITE_backend_url || 'http://localhost:8000';

// Helper function to get headers with authorization
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = localStorage.getItem('Token');
    if (token) {
      headers['Authorization'] = token;
    }
  }

  return headers;
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.status}`);
  }
  return response.json();
};

// Authentication APIs
export const authAPI = {
  signup: async (signupData) => {
    const response = await fetch(`${BACKEND_URL}/signup`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(signupData),
    });
    return handleResponse(response);
  },

  login: async (loginData) => {
    const response = await fetch(`${BACKEND_URL}/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(loginData),
    });
    return handleResponse(response);
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${BACKEND_URL}/forgot_password`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },
};

// User Profile APIs
export const profileAPI = {
  getDetails: async (username) => {
    const response = await fetch(`${BACKEND_URL}/profile_details`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ username }),
    });
    return handleResponse(response);
  },

  updateDetails: async (updateData) => {
    // When sending FormData, don't stringify and don't set Content-Type
    const headers = {
      'Authorization': localStorage.getItem('Token')
    };
    
    const response = await fetch(`${BACKEND_URL}/update_profile_details`, {
      method: 'POST',
      headers: headers,
      body: updateData, // FormData is sent as-is
    });
    return handleResponse(response);
  },

  checkPassword: async (passwordData) => {
    const response = await fetch(`${BACKEND_URL}/passwordcheck`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(passwordData),
    });
    return handleResponse(response);
  },

  deleteAccount: async (username) => {
    const response = await fetch(`${BACKEND_URL}/delete`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ myname: username }),
    });
    return handleResponse(response);
  },
};

// User Search and Friends APIs
export const searchAPI = {
  search: async (searchKey) => {
    const response = await fetch(`${BACKEND_URL}/search`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ username: searchKey }),
    });
    return handleResponse(response);
  },

  addFriend: async (friendUsername) => {
    const response = await fetch(`${BACKEND_URL}/addfriend`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ name: friendUsername, myname: localStorage.getItem("Username") }),
    });
    return handleResponse(response);
  },

  getFriendsRequest: async () => {
    const response = await fetch(`${BACKEND_URL}/friend`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ username: localStorage.getItem("Username") }),
    });
    return handleResponse(response);
  },

  acceptFriendRequest: async (username) => {
    const response = await fetch(`${BACKEND_URL}/acceptfriend`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ name: username, myname: localStorage.getItem("Username") }),
    });
    return handleResponse(response);
  },

  rejectFriendRequest: async (username) => {
    const response = await fetch(`${BACKEND_URL}/deletefriendinv`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ name: username, myname: localStorage.getItem("Username") }),
    });
    return handleResponse(response);
  },

  getFriendsList: async () => {
    const response = await fetch(`${BACKEND_URL}/friendlist`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ username: localStorage.getItem("Username") }),
    });
    return handleResponse(response);
  },

  deleteFriend: async (friendUsername) => {
    const response = await fetch(`${BACKEND_URL}/deletefriend`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ name: friendUsername, myname: localStorage.getItem("Username") }),
    });
    return handleResponse(response);
  },
};

// Main Page / Dashboard APIs
export const mainAPI = {
  getMainData: async () => {
    const response = await fetch(`${BACKEND_URL}/main`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({}),
    });
    return handleResponse(response);
  },
};

// Group APIs
export const groupAPI = {
  createGroup: async (groupData) => {
    const response = await fetch(`${BACKEND_URL}/create_group`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(groupData),
    });
    return handleResponse(response);
  },

  getGroups: async () => {
    const response = await fetch(`${BACKEND_URL}/groups`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({}),
    });
    return handleResponse(response);
  },

  getGroupInfo: async (groupId) => {
    const response = await fetch(`${BACKEND_URL}/group_all_details`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ groupId }),
    });
    return handleResponse(response);
  },

  getMainPageGroups: async (username) => {
    const response = await fetch(`${BACKEND_URL}/main_page_group_details`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ username }),
    });
    return handleResponse(response);
  },

  addGroupMember: async (groupId, username) => {
    const response = await fetch(`${BACKEND_URL}/add_group_member`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ groupId, username }),
    });
    return handleResponse(response);
  },

  deleteGroup: async (groupId) => {
    const response = await fetch(`${BACKEND_URL}/deletegroup`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ groupId }),
    });
    return handleResponse(response);
  },

  removeGroupMember: async (groupId, username) => {
    const response = await fetch(`${BACKEND_URL}/removemember`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ groupId, username }),
    });
    return handleResponse(response);
  },
};

// Expense APIs
export const expenseAPI = {
  addExpense: async (expenseData) => {
    const response = await fetch(`${BACKEND_URL}/addexpense`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(expenseData),
    });
    return handleResponse(response);
  },

  getExpenses: async (groupId) => {
    const response = await fetch(`${BACKEND_URL}/expense_details`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ groupId }),
    });
    return handleResponse(response);
  },

  deleteExpense: async (expenseId) => {
    const response = await fetch(`${BACKEND_URL}/delete_expense`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ expenseId }),
    });
    return handleResponse(response);
  },

  settleExpense: async (expenseId) => {
    const response = await fetch(`${BACKEND_URL}/settle_expense`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ expense_id: expenseId }),
    });
    return handleResponse(response);
  },

  settleDebt: async (creditor, groupId) => {
    const response = await fetch(`${BACKEND_URL}/settle_debt`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ 
        username: localStorage.getItem('Username'),
        creditor: creditor,
        groupId: groupId
      }),
    });
    return handleResponse(response);
  },

  getSettlements: async (groupId) => {
    const response = await fetch(`${BACKEND_URL}/get_settlements`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ 
        username: localStorage.getItem('Username'),
        groupId: groupId
      }),
    });
    return handleResponse(response);
  },
};

// Export combined API object for convenience
export const api = {
  auth: authAPI,
  profile: profileAPI,
  search: searchAPI,
  main: mainAPI,
  group: groupAPI,
  expense: expenseAPI,
};

export default api;
