# VeriLens API Endpoints Documentation

## Authentication Endpoints

### POST `/api/auth/register`
- **Request:**
  ```json
  { "firstName": "string", "lastName": "string", "email": "string", "password": "string" }
  ```
- **Response:**
  - `201`: `{ "message": "User registered successfully. Please check your email to verify your account." }`
  - `400`: `{ "message": "User already exists" }`

---

### POST `/api/auth/login`
- **Request:**
  ```json
  { "email": "string", "password": "string" }
  ```
- **Response:**
  - `200`: `{ "accessToken", "refreshToken", "user": { "id", "firstName", "lastName", "email", "role" } }`
  - `400/401`: `{ "message": "Invalid credentials" | "Please verify your email before logging in." }`

---

### GET `/api/auth/verify-email?token=...`
- **Response:**
  - `200`: `{ "message": "Email verified successfully. You can now login." }`
  - `400`: `{ "message": "Invalid or expired verification token" }`

---

### POST `/api/auth/refresh`
- **Request:**
  ```json
  { "token": "refreshToken" }
  ```
- **Response:**
  - `200`: `{ "accessToken", "refreshToken" }`
  - `400/401`: `{ "message": "Refresh token is required" | "Invalid refresh token" }`

---

### GET `/api/auth/verify-token`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response:**
  - `200`: `{ "valid": true, "user": { ... } }`
  - `401`: `{ "valid": false, "message": "No token" | "Invalid token" }`

---

### POST `/api/auth/forgot-password`
- **Request:**
  ```json
  { "email": "string" }
  ```
- **Response:**
  - `200`: `{ "message": "Password reset link sent to your email." }`
  - `404`: `{ "message": "User not found" }`

---

### POST `/api/auth/reset-password`
- **Request:**
  ```json
  { "token": "string", "newPassword": "string" }
  ```
- **Response:**
  - `200`: `{ "message": "Password reset successful. You can now login." }`
  - `400`: `{ "message": "Invalid or expired reset token" }`

---

## News Analysis Endpoints

### POST `/api/analysis/analyze`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Form Data:**
  - `text`: News content (required)
  - `image`: Image file (optional)
- **Response:**
  - `200`:
    ```json
    {
      "verdict": "FAKE" | "REAL" | "SUSPICIOUS",
      "confidence": 0-100,
      "reason": "AI explanation",
      "supporting_sources": [...],
      "image_analysis": { "alignmentScore": number, "explanation": "string" } | undefined,
      "reverse_image": ..., 
      "sources_checked": number,
      "explanation": "AI Consensus: ..."
    }
    ```
  - `400/500`: `{ "error": "..." }`

---

### GET `/api/analysis/history`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response:**
  - `200`: `[ { ...analysisRecord }, ... ]`
  - `401`: `{ "error": "Unauthorized access to history." }`

---

## Admin Endpoints

### GET `/api/admin/users`
- **Headers:** `Authorization: Bearer <admin accessToken>`
- **Response:**
  - `200`: `[ { id, email, firstName, lastName, role, ... }, ... ]`
  - `403`: `{ "message": "Admin access required" }`

---

### PATCH `/api/admin/users/:id/promote`
- **Headers:** `Authorization: Bearer <admin accessToken>`
- **Response:**
  - `200`: `{ ...updatedUser }`
  - `404`: `{ "message": "User not found" }`
  - `403`: `{ "message": "Admin access required" }`

---

> For all endpoints requiring authentication, pass the JWT access token in the `Authorization` header as `Bearer <token>`.
