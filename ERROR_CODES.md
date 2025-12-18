# API Error Codes & Responses

This document describes all possible error codes and responses from the Instagram Profile Info API.

## Success Response

**Status Code:** `200 OK`

```json
{
  "success": true,
  "data": {
    "name": "Mark Zuckerberg",
    "username": "zuck",
    "user_id": "123456789",
    "bio": "...",
    "verified": true,
    "private": false,
    "posts": 120,
    "followers": 15000000,
    "following": 500,
    "business": false,
    "category": null,
    "external_url": null,
    "profile_pic_url": "https://..."
  },
  "responseTime": "150ms",
  "method": "API",
  "note": "attempt:1",
  "credits": {
    "author": "@pluggerpy",
    "poweredBy": "@vexelsocials"
  }
}
```

---

## Error Responses

### 1. User Not Found
**Status Code:** `404 Not Found`

**Description:** The Instagram account does not exist.

```json
{
  "success": false,
  "error": "User not found",
  "message": "This Instagram account does not exist",
  "code": "USER_NOT_FOUND"
}
```

---

### 2. Account Suspended
**Status Code:** `403 Forbidden`

**Description:** The account has been suspended for violating Instagram's community guidelines.

```json
{
  "success": false,
  "error": "Account suspended",
  "message": "This account has been suspended for violating Instagram's community guidelines",
  "code": "ACCOUNT_SUSPENDED"
}
```

---

### 3. Account Not Available
**Status Code:** `410 Gone`

**Description:** The account is not available. It may have been banned, deleted, or suspended.

```json
{
  "success": false,
  "error": "Account not available",
  "message": "This account is not available. It may have been banned, deleted, or suspended",
  "code": "ACCOUNT_NOT_AVAILABLE"
}
```

---

### 4. Account Deactivated
**Status Code:** `410 Gone`

**Description:** The account has been deactivated or deleted by the user.

```json
{
  "success": false,
  "error": "Account deactivated",
  "message": "This account has been deactivated or deleted by the user",
  "code": "ACCOUNT_DEACTIVATED"
}
```

---

### 5. Temporarily Unavailable
**Status Code:** `503 Service Unavailable`

**Description:** The account is temporarily unavailable. Try again later.

```json
{
  "success": false,
  "error": "Temporarily unavailable",
  "message": "This account is temporarily unavailable. Please try again later",
  "code": "TEMPORARILY_UNAVAILABLE"
}
```

---

### 6. Rate Limited
**Status Code:** `429 Too Many Requests`

**Description:** Too many requests have been made. Please wait before trying again.

```json
{
  "success": false,
  "error": "Rate limited",
  "message": "Too many requests. Please try again later",
  "code": "RATE_LIMITED",
  "responseTime": "50ms"
}
```

---

### 7. Invalid Username Format
**Status Code:** `400 Bad Request`

**Description:** The provided username is not in a valid format.

```json
{
  "success": false,
  "error": "Invalid username format"
}
```

---

### 8. Username Required
**Status Code:** `400 Bad Request`

**Description:** No username was provided in the request.

```json
{
  "success": false,
  "error": "Username required"
}
```

---

### 9. Method Not Allowed
**Status Code:** `405 Method Not Allowed`

**Description:** The HTTP method used is not allowed (only GET is supported).

```json
{
  "success": false,
  "error": "Method not allowed"
}
```

---

### 10. Service Unavailable
**Status Code:** `503 Service Unavailable`

**Description:** The service is unable to fetch account information at this time.

```json
{
  "success": false,
  "error": "Service unavailable",
  "message": "Unable to fetch account information at this time",
  "code": "FETCH_FAILED",
  "debug": [
    {
      "attempt": 1,
      "error": "..."
    }
  ]
}
```

---

### 11. Internal Error
**Status Code:** `500 Internal Server Error`

**Description:** An unexpected error occurred on the server.

```json
{
  "success": false,
  "error": "Internal error",
  "message": "An unexpected error occurred",
  "code": "INTERNAL_ERROR",
  "responseTime": "100ms"
}
```

---

## HTTP Status Code Summary

| Status Code | Error Type | Meaning |
|-------------|------------|---------|
| `200` | Success | Account data retrieved successfully |
| `400` | Client Error | Invalid request (username required/invalid format) |
| `403` | Client Error | Account suspended (community guidelines violation) |
| `404` | Client Error | User not found |
| `405` | Client Error | HTTP method not allowed |
| `410` | Client Error | Account permanently unavailable (banned/deactivated) |
| `429` | Client Error | Rate limited (too many requests) |
| `500` | Server Error | Internal server error |
| `503` | Server Error | Service temporarily unavailable |

---

## Error Code Quick Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `USER_NOT_FOUND` | 404 | Account does not exist |
| `ACCOUNT_SUSPENDED` | 403 | Account suspended for violations |
| `ACCOUNT_NOT_AVAILABLE` | 410 | Account banned/deleted/suspended |
| `ACCOUNT_DEACTIVATED` | 410 | Account deactivated by user |
| `TEMPORARILY_UNAVAILABLE` | 503 | Account temporarily unavailable |
| `RATE_LIMITED` | 429 | Too many requests |
| `FETCH_FAILED` | 503 | Unable to fetch data |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Best Practices

### Error Handling in Your Application

```javascript
async function getInstagramProfile(username) {
  try {
    const response = await fetch(`https://your-api.com/api/user?username=${username}`);
    const data = await response.json();
    
    if (data.success) {
      // Handle success
      console.log('Profile:', data.data);
      return data.data;
    } else {
      // Handle different error types
      switch (data.code) {
        case 'USER_NOT_FOUND':
          console.error('Account does not exist');
          break;
        case 'ACCOUNT_SUSPENDED':
          console.error('Account was suspended');
          break;
        case 'ACCOUNT_NOT_AVAILABLE':
        case 'ACCOUNT_DEACTIVATED':
          console.error('Account is no longer available');
          break;
        case 'RATE_LIMITED':
          console.error('Rate limited. Wait before retrying');
          break;
        default:
          console.error('Error:', data.message);
      }
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}
```

### Retry Logic

For `RATE_LIMITED` (429) or `TEMPORARILY_UNAVAILABLE` (503) errors, implement exponential backoff:

```javascript
async function fetchWithRetry(username, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(`/api/user?username=${username}`);
    const data = await response.json();
    
    if (data.success) return data;
    
    if (data.code === 'RATE_LIMITED' || data.code === 'TEMPORARILY_UNAVAILABLE') {
      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    // Don't retry for permanent errors
    break;
  }
  
  return null;
}
```

---

## Credits

- **Author:** [@pluggerpy](https://t.me/pluggerpy)
- **Powered by:** [@vexelsocials](https://t.me/vexelsocials)
