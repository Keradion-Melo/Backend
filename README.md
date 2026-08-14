# Melo Backend API

The Melo Backend API is a robust, modular music streaming infrastructure built with NestJS, TypeScript, and MongoDB. It seamlessly orchestrates music playback queues, tracks historical listening sessions, builds personalized recommendations, and connects strictly typed endpoints to various streaming services like Jamendo and YouTube.

## Prerequisites
- Node.js v18+
- MongoDB instance (local or Atlas)
- YouTube Data API Key
- Jamendo API Key (`client_id`)

## Getting Started

1. **Clone and Install**
   ```bash
   git clone <repository>
   cd Melo/Backend
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root of `Melo/Backend` and populate it:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/melo

   # Security
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=15m
   REFRESH_SECRET=your_refresh_secret_here
   REFRESH_EXPIRES_IN=7d

   # Jamendo API (Primary Data Source)
   JAMENDO_CLIENT_ID=your_jamendo_client_id
   JAMENDO_API_BASE=https://api.jamendo.com/v3.0

   # YouTube API (Beta Feature)
   YOUTUBE_API_KEY=your_youtube_api_key
   ```

3. **Running the Application**
   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

## API Documentation
Once the server is running, you can explore the fully documented API via Swagger UI:
- **Swagger UI**: `http://localhost:3000/api/docs`

## Features & Modules

- **Auth & Users**: JWT-based authentication, token refreshing, profile management, and global rate-limiting.
- **Playlists**: Full CRUD capabilities for user playlists with collaborator tracking and metadata enrichment.
- **Queue**: Session-based, highly dynamic queue engine supporting robust track reordering, syncing, and stateless initialization.
- **Streaming & Metadata**: Connects to the Jamendo APIs and YouTube (via `youtube-dl-exec`) natively. Metadata is automatically pulled and cached for 7 days in a TTL-indexed MongoDB collection.
- **History & Recommendations**: Records every track played. Daily Cron jobs purge 30-day-old history. High-performance caching layers fetch personalized recommendations based on the user's top artists, genres, and favorites.

## Testing & Linting
- **Test**: `npm test`
- **Coverage**: `npm run test:cov`
- **Lint**: `npm run lint`

Pre-commit hooks are configured using Husky & Lint-Staged to automatically format (Prettier) and fix (ESLint) TypeScript files.
