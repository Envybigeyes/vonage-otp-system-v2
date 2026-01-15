FROM node:18-alpine

WORKDIR /app

# Copy and install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy and install frontend dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy all backend files
COPY backend ./backend

# Copy all frontend files
COPY frontend ./frontend

# Build the React frontend
RUN cd frontend && npm run build

# Move build to backend/public so Express can serve it
RUN mv frontend/build backend/public

# Expose port
EXPOSE 8080

# Start backend server
CMD ["node", "backend/server.js"]
