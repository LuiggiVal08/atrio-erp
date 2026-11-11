# Etapa de compilación (Build)
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Etapa de ejecución con Nginx (Runtime)
FROM nginx:alpine AS runtime

# Copia los archivos estáticos compilados al directorio web de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia tu configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
