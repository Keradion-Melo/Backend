# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Stage 2: Production Dependencies
FROM node:18-alpine AS prod-deps

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

# Stage 3: Run
FROM node:18-alpine

# Install Python3 + pip + yt-dlp for YouTube stream extraction
RUN apk add --no-cache python3 py3-pip ffmpeg && \
    pip3 install --break-system-packages yt-dlp

WORKDIR /usr/src/app

COPY --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
