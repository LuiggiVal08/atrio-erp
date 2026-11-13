# Etapa de compilación (Build)
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY . .

# Paquetes del monorepo (contexto adicional definido en docker-compose.prod.yml)
COPY --from=packages . /packages
RUN for pkg in core-accounting l10n_ve l10n_co; do \
      cd /packages/$pkg && npm ci && npm run build; \
    done
RUN mkdir -p node_modules/@atrio \
 && ln -s /packages/core-accounting node_modules/@atrio/core-accounting \
 && ln -s /packages/l10n_ve node_modules/@atrio/l10n_ve \
 && ln -s /packages/l10n_co node_modules/@atrio/l10n_co

RUN npm run build

# Etapa de ejecución final (Runtime)
FROM node:24-alpine AS runtime
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /packages /packages
COPY --from=build /app/package.json ./

# Script de entrada para migraciones y arranque
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
