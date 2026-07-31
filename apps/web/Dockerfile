# syntax=docker/dockerfile:1
# Build du front + image Caddy (HTTPS + fichiers statiques + proxy /api)

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN npm ci

COPY apps/web apps/web
RUN npm run build -w @leafitome/web

FROM caddy:2.9-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/web/dist /srv
EXPOSE 80 443
