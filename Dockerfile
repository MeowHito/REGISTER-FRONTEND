# Multi-stage build: build the Vite SPA, then serve it with nginx.
#
# IMPORTANT: Vite bakes VITE_* env vars into the bundle AT BUILD TIME.
# Create .env.production (from .env.production.example) in this folder BEFORE building.
#
#   docker build -t membership-fe .
# (or use deploy/docker-compose.yml which also runs the return-2c2p bridge)

FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
# The committed package-lock.json pins a wrong-platform rollup binary (android-arm),
# which breaks `npm ci` on linux/x64. Drop the lockfile so npm resolves the correct
# native module (@rollup/rollup-linux-x64-musl) for this platform. See npm/cli#4828.
RUN --mount=type=cache,target=/root/.npm \
    rm -f package-lock.json && npm install
COPY . .
RUN npm run build            # reads .env.production, outputs dist/

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
