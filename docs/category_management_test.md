# Category Management API Test Results

Base URL: `https://savr-backend.onrender.com`

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Test Results

### 1. Get All Categories
**Endpoint:** `GET /api/categories`

**Test Case 1: Get all categories without filter**
```http
GET /api/categories
```
**Expected Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Food",
            "type": "expense",
            "icon": "restaurant",
            "color": "#FF5733",
            "description": "Food and dining expenses"
        },
        // ... other categories
    ]
}
```

**Test Case 2: Get categories filtered by type**
```http
GET /api/categories?type=expense
```
**Expected Response:**
```json
{
    "success": true,
    "data": [
        // Only expense categories
    ]
}
```

### 2. Create New Category
**Endpoint:** `POST /api/categories`

**Test Case 1: Create valid category**
```http
POST /api/categories
Content-Type: application/json

{
    "name": "Subscriptions",
    "type": "expense",
    "icon": "subscriptions",
    "color": "#9C27B0",
    "description": "Monthly subscription services"
}
```
**Expected Response:**
```json
{
    "success": true,
    "message": "Category created successfully",
    "data": {
        "id": 18,
        "name": "Subscriptions",
        "type": "expense",
        "icon": "subscriptions",
        "color": "#9C27B0",
        "description": "Monthly subscription services"
    }
}
```

**Test Case 2: Create category with invalid type**
```http
POST /api/categories
Content-Type: application/json

{
    "name": "Test",
    "type": "invalid",
    "icon": "test",
    "color": "#000000"
}
```
**Expected Response:**
```json
{
    "success": false,
    "message": "Invalid category type. Must be either 'expense' or 'income'",
    "errors": [
        {
            "field": "type",
            "message": "Invalid category type"
        }
    ]
}
```

### 3. Update Category
**Endpoint:** `PUT /api/categories/:id`

**Test Case 1: Update existing category**
```http
PUT /api/categories/18
Content-Type: application/json

{
    "name": "Digital Subscriptions",
    "icon": "cloud_subscription",
    "color": "#673AB7",
    "description": "Digital and cloud subscription services"
}
```
**Expected Response:**
```json
{
    "success": true,
    "message": "Category updated successfully",
    "data": {
        "id": 18,
        "name": "Digital Subscriptions",
        "type": "expense",
        "icon": "cloud_subscription",
        "color": "#673AB7",
        "description": "Digital and cloud subscription services"
    }
}
```

### 4. Delete Category
**Endpoint:** `DELETE /api/categories/:id`

**Test Case 1: Delete existing category**
```http
DELETE /api/categories/18
```
**Expected Response:**
```json
{
    "success": true,
    "message": "Category deleted successfully"
}
```

**Test Case 2: Delete non-existent category**
```http
DELETE /api/categories/999
```
**Expected Response:**
```json
{
    "success": false,
    "message": "Category not found"
}
```

## Validation Rules

1. Category Name:
   - Required
   - String
   - Length: 2-50 characters
   - Must be unique within the same type (expense/income)

2. Category Type:
   - Required
   - Must be either 'expense' or 'income'

3. Icon:
   - Optional
   - String
   - Length: 1-50 characters

4. Color:
   - Optional
   - String
   - Must be a valid hex color code (e.g., '#FF5733')
   - Length: 7 characters

5. Description:
   - Optional
   - String
   - Maximum length: 255 characters

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

Error responses include:
```json
{
    "success": false,
    "message": "Error description",
    "errors": [
        {
            "field": "fieldName",
            "message": "Specific error message"
        }
    ]
}
```

## Notes
- Categories cannot be deleted if they are being used by any expense or income records
- The type of a category cannot be changed after creation
- Default categories are created during migration and cannot be deleted
