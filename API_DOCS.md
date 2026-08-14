# Melo API Documentation

This document outlines the API endpoints, expected request/response contracts, and authentication requirements for the Melo backend. It serves as a comprehensive guide for frontend developers to integrate with the Melo backend seamlessly.

---

## General Information

- **Base URL:** `http://localhost:3000/api`
- **Authentication:** Most endpoints are protected and require a Bearer token. Send it in the header: `Authorization: Bearer <your_access_token>`.
- **Global Responses:** All successful responses (HTTP 200/201) are wrapped via a global interceptor:
  ```json
  {
    "statusCode": 200,
    "message": "Success",
    "data": { ... }
  }
  ```
  *(Note: To keep this doc concise, the `data` wrapper is implied in the examples below.)*

---

## 1. Authentication Module

### Register a User
- **Method:** `POST /auth/register`
- **Description:** Creates a new user account and returns access tokens.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "username": "musiclover99",
    "password": "securepassword123"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "accessToken": "eyJhb...",
    "refreshToken": "eyJhb..."
  }
  ```

### Login
- **Method:** `POST /auth/login`
- **Description:** Authenticates a user and issues JWT tokens.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Response (200 OK):** *(Same token structure as Register)*

### Refresh Token
- **Method:** `POST /auth/refresh`
- **Description:** Issues a new access token using a valid refresh token.
- **Request Body:**
  ```json
  {
    "refreshToken": "eyJhb..."
  }
  ```
- **Response (200 OK):** *(Same token structure as Register)*

### Logout
- **Method:** `POST /auth/logout`
- **Requires Auth:** Yes
- **Description:** Invalidates the current refresh token.
- **Response (200 OK):**
  ```json
  { "message": "Logged out successfully" }
  ```

---

## 2. Users Module

### Get Current User Profile
- **Method:** `GET /users/me`
- **Requires Auth:** Yes
- **Description:** Returns the authenticated user's profile and preferences.
- **Response:**
  ```json
  {
    "_id": "60b9...",
    "email": "user@example.com",
    "username": "musiclover99",
    "profile": {
      "displayName": "Music Lover",
      "bio": "I love pop music",
      "avatarUrl": "https://example.com/avatar.jpg"
    },
    "preferences": {
      "defaultService": "jamendo",
      "theme": "dark",
      "autoplay": true,
      "quality": "high"
    }
  }
  ```

### Update Profile
- **Method:** `PATCH /users/me`
- **Requires Auth:** Yes
- **Description:** Updates the user's profile and preferences.
- **Request Body (Partial):**
  ```json
  {
    "displayName": "New Name",
    "preferences": {
      "theme": "light"
    }
  }
  ```

---

## 3. Streaming Module

### Get Stream URL & Metadata
- **Method:** `POST /stream`
- **Requires Auth:** Yes
- **Description:** The core playback engine. Fetches the MP3 stream URL and metadata for a track, and automatically logs it in the user's history.
- **Request Body:**
  ```json
  {
    "trackId": "112345",
    "service": "jamendo" // or "youtube"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "streamUrl": "https://api.jamendo.com/v3.0/tracks/file/?id=112345&client_id=...",
    "metadata": {
      "title": "Awesome Track",
      "artist": "Awesome Band",
      "albumArt": "https://...",
      "duration": 215,
      "genre": ["pop", "rock"]
    }
  }
  ```

---

## 4. Search Module

### Search Tracks
- **Method:** `GET /search`
- **Requires Auth:** Yes
- **Description:** Cross-platform search. If `service` is omitted, defaults to user's preferred service.
- **Query Params:**
  - `q` (required): Search term
  - `service` (optional): `jamendo` or `youtube`
  - `limit` (optional): Default 20
- **Example Request:** `GET /search?q=lofi&service=youtube&limit=10`
- **Response (200 OK):**
  ```json
  {
    "results": [
      {
        "trackId": "dQw4w9WgXcQ",
        "service": "youtube",
        "title": "Never Gonna Give You Up",
        "artist": "Rick Astley",
        "albumArt": "https://...",
        "duration": 213
      }
    ]
  }
  ```

---

## 5. Playlists Module

### Create Playlist
- **Method:** `POST /playlists`
- **Requires Auth:** Yes
- **Request Body:**
  ```json
  {
    "name": "Summer Vibes",
    "description": "Chill songs",
    "isPublic": true,
    "isCollaborative": false
  }
  ```

### Get User & Public Playlists
- **Method:** `GET /playlists`
- **Requires Auth:** Yes
- **Response:** Array of Playlist objects.

### Add Track to Playlist
- **Method:** `POST /playlists/:id/tracks`
- **Requires Auth:** Yes (Must be owner or collaborator)
- **Description:** Appends a track. Background system will automatically cache its metadata.
- **Request Body:**
  ```json
  {
    "trackId": "112345",
    "service": "jamendo",
    "title": "Track Name",
    "artist": "Artist",
    "duration": 180
  }
  ```

### Reorder Tracks
- **Method:** `PUT /playlists/:id/tracks/reorder`
- **Requires Auth:** Yes
- **Request Body:**
  ```json
  {
    "order": [2, 0, 1] // Maps old index to new index
  }
  ```

---

## 6. Queue Module (Session Based)

The Queue utilizes `sessionId` in the query to allow a user to have different queues on different devices (e.g., Desktop vs Mobile). If no `sessionId` is provided, a default one is automatically generated and returned.

### Get Queue
- **Method:** `GET /queue?sessionId=desktop-1`
- **Requires Auth:** Yes
- **Response:**
  ```json
  {
    "userId": "60b9...",
    "sessionId": "desktop-1",
    "currentIndex": 0,
    "status": "playing",
    "currentTime": 15.5,
    "tracks": [ ... ]
  }
  ```

### Add to Queue
- **Method:** `POST /queue/add?sessionId=desktop-1`
- **Requires Auth:** Yes
- **Request Body:**
  ```json
  {
    "trackId": "112345",
    "service": "jamendo",
    "title": "Track Name",
    "artist": "Artist",
    "duration": 180
  }
  ```

### Update Current State
- **Method:** `PATCH /queue/current?sessionId=desktop-1`
- **Requires Auth:** Yes
- **Description:** Used to sync playback state (e.g., scrubbing, pausing).
- **Request Body:**
  ```json
  {
    "currentIndex": 1,
    "status": "paused",
    "currentTime": 45.2
  }
  ```

### Sync Entire Queue
- **Method:** `PUT /queue/sync?sessionId=desktop-1`
- **Requires Auth:** Yes
- **Description:** Completely replaces the current queue array.

---

## 7. Recommendations Module

### Get Personalized Recommendations
- **Method:** `GET /recommendations`
- **Requires Auth:** Yes
- **Description:** Calculates recommendations based on top artists/genres from recent history and favorites. Cached for 1 hour per user.
- **Response (200 OK):**
  ```json
  [
    {
      "trackId": "67890",
      "service": "jamendo",
      "title": "Recommended Song",
      "artist": "Similar Artist",
      "genre": ["pop"],
      "duration": 210
    }
  ]
  ```

---

## 8. Favorites Module

### Add Favorite
- **Method:** `POST /favorites`
- **Requires Auth:** Yes
- **Request Body:**
  ```json
  {
    "trackId": "112345",
    "service": "jamendo",
    "title": "Awesome Track",
    "artist": "Awesome Band"
  }
  ```

### Get All Favorites
- **Method:** `GET /favorites`
- **Requires Auth:** Yes
- **Response:** Array of Favorited Tracks.

### Remove Favorite
- **Method:** `DELETE /favorites/:trackId?service=jamendo`
- **Requires Auth:** Yes

---

## 9. History Module

### Get Recent History
- **Method:** `GET /history?limit=20&offset=0`
- **Requires Auth:** Yes
- **Description:** Paginated playback history. (Note: History entries are auto-generated when you hit `POST /stream`).

### Clear Entire History
- **Method:** `DELETE /history`
- **Requires Auth:** Yes

---

## Summary for Frontend Devs:
1. **Login Workflow:** Call `/auth/login`, save `accessToken`. Attach `Authorization: Bearer <token>` to all subsequent requests.
2. **Streaming:** To play a song, call `POST /stream` with the `trackId`. It returns the direct audio URL to pass to the `<audio>` tag and saves the history log simultaneously.
3. **Queue Logic:** Pass a unique UUID (e.g., `localStorage.getItem('sessionId')`) in query params to `/queue` endpoints to manage playback state.
4. **Discover:** Populate your feed using `/recommendations` or `/search`.
