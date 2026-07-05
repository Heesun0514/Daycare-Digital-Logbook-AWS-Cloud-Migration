# BEFORE:
# FROM node:18-slim

# AFTER: Use Node 20 or 22 slim, which includes updated system libraries
FROM node:22-slim


# Install the minimal tools required to compile native C++ binaries
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy lock files from backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --only=production --build-from-source=sqlite3

# Copy both backend and frontend directories into the image
COPY backend/ ./backend/
COPY frontend/ ./frontend/

EXPOSE 8080

# Run the server from inside the backend directory
CMD [ "node", "backend/server.js" ]