# Stage 1: Build the application
FROM node:18 AS builder

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY ./package*.json ./

# Install dependencies
RUN npm i

# Copy the rest of the application code
COPY *.ts .

# Expose the port the app runs on
EXPOSE ${OC_LISTEN_PORT:-1234}

# Build the TypeScript application
CMD ["npm", "start"]
