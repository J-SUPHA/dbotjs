# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Create a .env file from example.env if it doesn't exist
RUN cp -n example.env .env || true

# Create a config.json file from example-config.json if it doesn't exist
RUN cp -n example-config.json config.json || true

# Command to run the application
CMD ["npm", "run", "dev"]