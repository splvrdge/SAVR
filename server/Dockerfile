FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN bun install

# Copy the rest of the application
COPY . .

# Expose the port from environment variable (default to 3000)
ARG PORT=3000
ENV PORT=$PORT
EXPOSE $PORT

# Start the application
CMD ["bun", "run", "start"]
