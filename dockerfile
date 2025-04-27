# Use a node image for the base
FROM node:20

# Set working directory inside the container
WORKDIR /app

# Copy your package.json and package-lock.json (or yarn.lock) to the container
COPY package.json package-lock.json ./

# Install dependencies inside the container (this ensures platform-specific binaries are installed)
RUN npm ci

# Now copy the rest of your app
COPY . .

# Expose port 3000 for the frontend
EXPOSE 5173

# Start the app
CMD ["npm", "run", "dev"]
