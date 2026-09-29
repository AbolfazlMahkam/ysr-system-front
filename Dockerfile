# BUILD CONTEXT = repo ROOT (the single root package-lock.json must be visible).
# Build:
#   docker build -f apps/frontend/Dockerfile \
#     --build-arg VITE_API_BASE_URL=https://api.example.com \
#     --build-arg VITE_GOOGLE_CLIENT_ID= \
#     -t ysr-frontend .
#
# Vite env vars are BUILD-TIME: import.meta.env.VITE_* is statically inlined into the
# bundle by `vite build`. They are passed as ARG -> ENV BEFORE the build, NOT as
# runtime container env. Changing them requires a REBUILD of this image.

############################################################
# 1) deps — full install from the root lockfile
############################################################
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/package.json                 apps/backend/package.json
COPY apps/frontend/package.json                apps/frontend/package.json
COPY packages/ui/package.json                  packages/ui/package.json
COPY packages/eslint-config/package.json       packages/eslint-config/package.json
COPY packages/typescript-config/package.json   packages/typescript-config/package.json
RUN npm ci

############################################################
# 2) build — tsc -b && vite build -> apps/frontend/dist (static assets)
############################################################
FROM node:22-alpine AS build
WORKDIR /app
# Build-time Vite vars (baked into the bundle). Public values only — never secrets.
ARG VITE_NODE_ENV=production
ARG VITE_API_BASE_URL=http://localhost:3000
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_NODE_ENV=$VITE_NODE_ENV \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
COPY package.json package-lock.json ./
COPY apps/frontend ./apps/frontend
# Hoisted deps at the workspace root...
COPY --from=deps /app/node_modules ./node_modules
# ...plus any NON-hoisted deps npm nested under the workspace (vite/tsc bins land
# in apps/frontend/node_modules/.bin when they can't hoist). Copied AFTER the
# source so it is not clobbered by the `COPY apps/frontend` above.
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
RUN npm run build --workspace=frontend

############################################################
# 3) runtime — nginx static server (SPA fallback + /uploads proxy)
############################################################
FROM nginx:1.27-alpine AS runtime
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
# nginx:alpine default CMD already runs: nginx -g 'daemon off;'
