# Stage 1: Build the React application
FROM --platform=$BUILDPLATFORM node:20.12.2 AS builder
# Set the working directory
WORKDIR /app
# Copy package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm ci
# Copy the rest of the necessary files
COPY . .
# Build the application
RUN npm run build

# Stage 2: Deploy the React application using Nginx
FROM nginx:stable-alpine
# Copy the results from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

RUN sed -i '/location \/ {/a \\ttry_files $uri $uri/ /index.html;' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
