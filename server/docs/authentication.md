# Authentication

## Overview

Savr-FinTracker uses JWT (JSON Web Tokens) for authentication. The authentication flow consists of:
1. User signup/login to obtain tokens
2. Using access token for API requests
3. Refreshing tokens when they expire

## Endpoints

### 1. User Signup

**POST** `/api/auth/signup`

Create a new user account.

#### Request Body
```json
{
  "user_name": "John Doe",
  "user_email": "john@example.com",
  "user_password": "securePassword123"
}
```

#### Response
```json
{
  "success": true,
  "message": "Signup successful",
  "accessToken": "eyJhbGciOiJIUzI1...",
  "refreshToken": "eyJhbGciOiJIUzI1...",
  "user_name": "John Doe",
  "user_id": 123
}
```

### 2. User Login

**POST** `/api/auth/login`

Authenticate an existing user.

#### Request Body
```json
{
  "user_email": "john@example.com",
  "user_password": "securePassword123"
}
```

#### Response
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1...",
  "refreshToken": "eyJhbGciOiJIUzI1...",
  "user": {
    "user_id": 123,
    "user_name": "John Doe",
    "user_email": "john@example.com"
  }
}
```

### 3. Refresh Token

**POST** `/api/auth/refresh-token`

Get a new access token using a refresh token.

#### Request Headers
```
Authorization: Bearer REFRESH_TOKEN
```

#### Response
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1...",
  "refreshToken": "eyJhbGciOiJIUzI1..."
}
```

## Token Management

### Access Token
- Used for API authentication
- Short lifespan (15 minutes)
- Include in request header:
  ```
  Authorization: Bearer ACCESS_TOKEN
  ```

### Refresh Token
- Used to obtain new access tokens
- Longer lifespan (7 days)
- Store securely
- Invalidated on logout

## Security Considerations

1. Password Requirements:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

2. Token Storage:
   - Never store tokens in localStorage
   - Use secure HTTP-only cookies
   - Clear tokens on logout

3. Rate Limiting:
   - Login attempts are limited
   - Temporary lockout after failed attempts

4. Error Handling:
   - Generic error messages for security
   - No sensitive data in responses

## Example Usage

### Login Flow
```javascript
async function login(email, password) {
  const response = await fetch('https://savr-backend.onrender.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_email: email,
      user_password: password
    })
  });
  
  const data = await response.json();
  if (data.success) {
    // Store tokens securely
    setAuthTokens(data.accessToken, data.refreshToken);
    return data.user;
  }
  throw new Error(data.message);
}
```

### Authenticated Request
```javascript
async function getFinancialSummary(userId) {
  const response = await fetch(`https://savr-backend.onrender.com/api/financial/summary/${userId}`, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`
    }
  });
  
  const data = await response.json();
  if (data.success) {
    return data.data;
  }
  throw new Error(data.message);
}
```

## Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| AUTH001 | Invalid credentials | Check email and password |
| AUTH002 | Token expired | Refresh your access token |
| AUTH003 | Invalid token | Re-authenticate |
| AUTH004 | Account locked | Contact support |

## Best Practices

1. Implement token refresh before expiration
2. Use secure password storage
3. Implement proper logout
4. Handle token expiration gracefully
5. Use HTTPS for all requests
