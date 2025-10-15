FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build argument for API URL (with fallback to .env.production)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Debug: Print API URL being used
RUN echo "Building with API URL: $VITE_API_URL"

# Build the application
RUN npm run build

# Install serve to serve the built files
RUN npm install -g serve

# Expose port
EXPOSE 5173

# Start the application
CMD ["serve", "-s", "dist", "-l", "5173"]