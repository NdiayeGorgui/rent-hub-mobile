# =========================
# STAGE 1 - BUILD REACT
# =========================
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# =========================
# STAGE 2 - NGINX
# =========================
FROM nginx:alpine

# Supprimer config par défaut
RUN rm -rf /etc/nginx/conf.d/default.conf

# Ajouter ta config custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier build React
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]