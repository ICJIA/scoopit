FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy project files
COPY . .

# Make CLI executable
RUN chmod +x ./cli.js

# Create output directory
RUN mkdir -p /app/output

# Set entrypoint to the CLI
ENTRYPOINT ["./cli.js"]

# Default command (can be overridden)
CMD []