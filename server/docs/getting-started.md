# Getting Started with Savr-FinTracker API

## Base URL

All API endpoints are accessible via:
```
https://savr-backend.onrender.com
```

## Authentication

All endpoints except for signup and login require authentication. To authenticate your requests:

1. Obtain an access token by signing up or logging in
2. Include the token in your request headers:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Request Format

- All requests should be in JSON format
- Set the Content-Type header:
```
Content-Type: application/json
```

## Response Format

All responses follow this standard format:

```json
{
  "success": true|false,
  "message": "Description of the response",
  "data": {} | [] | null
}
```

## Error Handling

When an error occurs, you'll receive:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

The API implements rate limiting to ensure fair usage:
- 100 requests per minute per IP address
- Rate limit headers are included in responses:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 99
  X-RateLimit-Reset: 1608234567
  ```

## Data Validation

- All monetary amounts should be positive numbers
- Dates should be in ISO 8601 format
- Strings have maximum lengths (see specific endpoint documentation)
- Required fields must not be null or empty

## Best Practices

1. Always validate response status
2. Implement proper error handling
3. Store tokens securely
4. Refresh tokens before they expire
5. Use HTTPS for all requests
6. Follow rate limiting guidelines

## Example Request

Here's a complete example using curl:

```bash
curl -X POST https://savr-backend.onrender.com/api/expense/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "user_id": 123,
    "amount": 100.50,
    "description": "Grocery shopping",
    "category": "Food"
  }'
```

## Next Steps

- Review the [Authentication](./authentication.md) documentation
- Check out the [API Test Results](./api_test_results.md)
- Set up your development environment
- Try the example requests in Postman
