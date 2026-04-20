# =============================================================================
# FRONTEND DOCKERFILE — Multi-Stage Build
# =============================================================================
# This Dockerfile uses TWO stages. This is the most important pattern to
# understand for frontend containers.
#
# STAGE 1 (builder): Full Node.js environment → compiles/bundles the React app
# STAGE 2 (runner):  Tiny NGINX image         → serves the compiled HTML/JS/CSS
#
# WHY TWO STAGES?
# The Node.js image (~160 MB) is only needed to BUILD the app.
# The final image only needs NGINX (~23 MB) to SERVE static files.
# Without multi-stage builds, the final image would contain Node, npm, all
# source code, and devDependencies — easily 500+ MB. With this approach,
# the final image is ~30 MB.
#
# HOW IT WORKS:
# Docker runs Stage 1 → produces a /app/dist folder of static files.
# Docker runs Stage 2 → copies ONLY that /app/dist folder from Stage 1.
# Everything else from Stage 1 is discarded. The final image has no Node.js.
# =============================================================================


# =============================================================================
# STAGE 1: Build the React app
# =============================================================================
# "AS builder" gives this stage a name so Stage 2 can reference it.
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first to leverage Docker layer caching.
# If package.json is unchanged, Docker skips npm ci on the next build.
COPY package*.json ./

# Install ALL dependencies (including devDependencies like Vite, TypeScript)
# because we need them to build the app.
RUN npm ci

# ---------------------------------------------------------------------------
# VITE_API_URL Build Argument
#
# Vite bakes environment variables into the JavaScript bundle at BUILD TIME.
# This means the API URL is hardcoded into the JS files in the final image.
#
# We default VITE_API_URL to an empty string "".
# WHY EMPTY? When it's empty, axios calls like:
#   api.post("/api/auth/login")
# ...go to the SAME origin as the page — e.g., http://localhost:3000/api/auth/login
# NGINX then proxies that /api/ request to the backend service.
# This means the SAME Docker image works in both Docker Compose and Kubernetes!
#
# For local dev (npm run dev), the .env file sets VITE_API_URL=http://localhost:5000
# so Vite's dev server talks directly to the backend. No NGINX needed locally.
# ---------------------------------------------------------------------------
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Copy all source files
COPY . .

# Build the production bundle. Output goes to /app/dist
RUN npm run build


# =============================================================================
# STAGE 2: Serve with NGINX
# =============================================================================
# We start fresh from a tiny NGINX image. Nothing from Stage 1 carries over
# except what we explicitly COPY.
FROM nginx:1.27-alpine

# Copy the compiled static files from the builder stage.
# /usr/share/nginx/html is NGINX's default web root directory.
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace NGINX's default config with our custom one.
# Our custom config handles:
#   1. React Router (SPA routing)
#   2. API proxying to the backend service
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Document that this container listens on port 80
EXPOSE 80

# Start NGINX in the foreground.
# "daemon off" keeps NGINX as the main process (PID 1) so Docker can manage
# its lifecycle. Without this, NGINX would daemonize, the container would
# exit immediately thinking the process finished.
CMD ["nginx", "-g", "daemon off;"]
