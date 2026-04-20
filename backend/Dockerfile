# =============================================================================
# BACKEND DOCKERFILE
# =============================================================================
# This file tells Docker how to package the Express API into a container image.
#
# WHAT IS A DOCKERFILE?
# Think of it as a recipe. Docker reads each instruction top-to-bottom and
# creates a layered "snapshot" of the filesystem at each step. The final
# result is a portable image you can run anywhere Docker is installed.
#
# WHY node:20-alpine?
# - node:20       → LTS (Long Term Support) version of Node.js = stable
# - alpine        → A minimal Linux distro (~5 MB vs ~900 MB for full Ubuntu)
#                   Smaller image = faster downloads, less attack surface
# =============================================================================

FROM node:20-alpine

# ---------------------------------------------------------------------------
# WORKDIR sets the "current directory" inside the container for all commands
# below. If it doesn't exist, Docker creates it.
# Think of it like: cd /app
# ---------------------------------------------------------------------------
WORKDIR /app

# ---------------------------------------------------------------------------
# COPY package files FIRST (before source code).
#
# WHY? Docker caches each layer. If package.json hasn't changed, Docker reuses
# the cached npm install layer and skips it → much faster rebuilds.
# If we copied everything at once, any code change would invalidate the cache
# and force a full npm install every time.
# ---------------------------------------------------------------------------
COPY package*.json ./

# ---------------------------------------------------------------------------
# npm ci vs npm install:
# - npm ci   → Clean install, reads package-lock.json exactly → reproducible
# - --only=production → Skip devDependencies (nodemon, etc.) to keep
#              the image lean. We don't need hot-reload in production.
# ---------------------------------------------------------------------------
RUN npm ci --only=production

# ---------------------------------------------------------------------------
# Now copy the actual source code. This layer is invalidated on code changes
# but that's fine since npm install (above) is already cached.
# ---------------------------------------------------------------------------
COPY src/ ./src/

# ---------------------------------------------------------------------------
# EXPOSE documents which port the app listens on.
# This is metadata only — it does NOT actually open a port.
# The actual port mapping happens in docker-compose.yml or Kubernetes.
# ---------------------------------------------------------------------------
EXPOSE 5000

# ---------------------------------------------------------------------------
# CMD is the command that runs when the container starts.
# We use the production start script (not nodemon — no hot reload needed).
# Using JSON array format ["node", "..."] is preferred over shell string form
# because it avoids spawning a shell, meaning signals (SIGTERM) reach Node
# directly → clean graceful shutdown.
# ---------------------------------------------------------------------------
CMD ["node", "src/server.js"]
