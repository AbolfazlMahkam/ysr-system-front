# Single-stage-context build (this repo IS apps/frontend — there is no workspace root).
# Build:
#   docker build -t ysr-frontend .
#   docker run -p 8080:80 ysr-frontend
#
# Vite env vars are BUILD-TIME: import.meta.env.VITE_* is statically inlined into the
# bundle by `vite build`. They are passed as ARG -> ENV BEFORE the build, NOT as
# runtime container env. Changing them requires a REBUILD of this image.
#
# VITE_BASE_PATH is the one that bites. `base` is baked into every asset URL, the
# react-router basename and the post-refresh redirect, so a build made for the wrong
# host still looks fine locally and then 404s on every asset in the browser. This
# image serves the app from the DOCUMENT ROOT, so its base must be "/".
# Override with --build-arg VITE_BASE_PATH=/ysr-system-front/ ONLY if you also mount
# the output under that sub-path (see the read-only note in scripts/verify-base.mjs).
# The build runs scripts/verify-base.mjs as a Vite plugin, so a mismatch fails the
# image build instead of shipping.

############################################################
# 1) deps — install from the lockfile for reproducible builds
############################################################
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

############################################################
# 2) build — vite build -> /app/dist (static assets)
############################################################
FROM node:22-alpine AS build
WORKDIR /app
# Build-time Vite vars (baked into the bundle). Public values only — never secrets.
ARG VITE_BASE_PATH=/
ARG VITE_NODE_ENV=production
ARG VITE_API_BASE_URL=https://api.rohanian-ysr.ir
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_BASE_PATH=$VITE_BASE_PATH \
    VITE_NODE_ENV=$VITE_NODE_ENV \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Config first, so a source-only edit does not invalidate the install layer.
COPY package.json package-lock.json ./
COPY index.html components.json postcss.config.js tailwind.config.js ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY vite.config.ts ./
COPY scripts ./scripts
COPY public ./public
COPY src ./src

COPY --from=deps /app/node_modules ./node_modules
# Fails the build if the emitted base does not match VITE_BASE_PATH.
RUN npm run build

############################################################
# 3) runtime — nginx static server (SPA fallback + /uploads proxy)
############################################################
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# nginx:alpine default CMD already runs: nginx -g 'daemon off;'
