FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY backend ./backend

# Expose port
EXPOSE 8080

# Start backend server
CMD ["node", "backend/server.js"]
