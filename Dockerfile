# =========================
# STAGE 1 - BUILD
# =========================
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 👉 Build Expo Web / Vite / React
RUN npm run build

# =========================
# STAGE 2 - NGINX
# =========================
FROM nginx:alpine

# Supprimer config par défaut
RUN rm -rf /etc/nginx/conf.d/default.conf

# Ajouter config nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 👉 IMPORTANT : Expo / Vite = dist (PAS build)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]