# =========================
# STAGE 1 - BUILD
# =========================
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install deps (plus fiable en CI)
RUN npm ci

# Copy app
COPY . .

# Build Expo Web
RUN npm run build

# =========================
# STAGE 2 - NGINX
# =========================
FROM nginx:alpine

# Remove default config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Add custom config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]