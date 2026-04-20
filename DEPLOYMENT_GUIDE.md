# Deployment Guide — E-commerce Application

This guide walks you through **everything** we built: what each file does, the concepts behind it, and the exact commands to run the app — both locally with Docker Compose and on a local Kubernetes cluster with minikube.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [How Docker Works (Core Concepts)](#2-how-docker-works-core-concepts)
3. [Backend Dockerfile Explained](#3-backend-dockerfile-explained)
4. [Frontend Dockerfile + NGINX Explained](#4-frontend-dockerfile--nginx-explained)
5. [Docker Compose Explained](#5-docker-compose-explained)
6. [Running with Docker Compose](#6-running-with-docker-compose)
7. [How Kubernetes Works (Core Concepts)](#7-how-kubernetes-works-core-concepts)
8. [Kubernetes Files Explained](#8-kubernetes-files-explained)
9. [Running on Kubernetes (minikube)](#9-running-on-kubernetes-minikube)
10. [Troubleshooting](#10-troubleshooting)
11. [Common Commands Cheat Sheet](#11-common-commands-cheat-sheet)

---

## 1. Architecture Overview

```
                         ┌──────────────────────────────────┐
                         │         Your Browser              │
                         └──────────────┬───────────────────┘
                                        │ HTTP request
                                        ▼
                         ┌──────────────────────────────────┐
                         │   FRONTEND (NGINX container)      │
                         │   - Serves React app (HTML/JS/CSS)│
                         │   - Proxies /api/* to backend     │
                         └──────┬───────────────────────────┘
                                │ proxy_pass /api/ to http://backend:5000
                                ▼
                         ┌──────────────────────────────────┐
                         │   BACKEND (Node/Express container)│
                         │   - REST API on port 5000         │
                         │   - Session auth via MongoDB      │
                         └──────┬───────────────────────────┘
                                │ mongoose connection
                                ▼
                         ┌──────────────────────────────────┐
                         │   MONGODB container               │
                         │   - Data stored on persistent disk│
                         └──────────────────────────────────┘
```

**Key design decision — NGINX API Proxy:**

The frontend NGINX container does double duty: serve the React app AND forward API requests to the backend. This means:
- The browser talks to **one origin** only (the frontend URL). No CORS headaches.
- The same built Docker image works for both Docker Compose and Kubernetes.
- The backend is **never directly exposed** to the internet.

---

## 2. How Docker Works (Core Concepts)

### Image vs Container

| Term      | Analogy          | Description                                                         |
|-----------|------------------|---------------------------------------------------------------------|
| Image     | Recipe / Blueprint | Read-only snapshot of your app + OS + dependencies. Stored on disk. |
| Container | Running dish      | A live, running instance of an image. You can have many containers from one image. |

### Layers

Every instruction in a Dockerfile creates a new **layer** (a diff on top of the previous layer). Layers are cached. If you change line 15 of your Dockerfile, Docker only re-runs from line 15 downward — everything above is reused from cache. This is why we copy `package.json` and run `npm install` **before** copying source code.

### Build Context

When you run `docker build`, Docker sends all files in the current directory to the Docker daemon. The `.dockerignore` file excludes files from this transfer. Excluding `node_modules` (~200MB) makes builds much faster.

---

## 3. Backend Dockerfile Explained

**File:** `backend/Dockerfile`

```dockerfile
FROM node:20-alpine
```
Start from an official Node.js 20 image built on Alpine Linux (~160MB total vs ~900MB for full Ubuntu).

```dockerfile
WORKDIR /app
```
All subsequent commands run inside `/app`. Like doing `mkdir /app && cd /app`.

```dockerfile
COPY package*.json ./
RUN npm ci --only=production
```
Install dependencies first. Docker caches this layer. Code changes won't re-trigger npm install unless `package.json` changes. `npm ci` is stricter than `npm install` — it reads `package-lock.json` exactly for reproducible builds. `--only=production` skips devDependencies (nodemon, etc.).

```dockerfile
COPY src/ ./src/
```
Now copy source code. This layer is invalidated by code changes, but `npm ci` above is still cached.

```dockerfile
EXPOSE 5000
CMD ["node", "src/server.js"]
```
Document the port and set the startup command. Using array syntax `["node", ...]` means Node.js receives OS signals directly (important for clean shutdown).

**Backend .dockerignore** excludes `node_modules` and `.env` files so they're never included in the image.

---

## 4. Frontend Dockerfile + NGINX Explained

**File:** `frontend/Dockerfile`

This uses a **multi-stage build** — the single most important Docker pattern for frontend apps.

### Stage 1: Builder (Node.js)

```dockerfile
FROM node:20-alpine AS builder
```
Name this stage "builder" so Stage 2 can reference it.

```dockerfile
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
```
Vite bakes environment variables into the JavaScript bundle at **build time**. We set `VITE_API_URL` to an empty string `""` so the React app makes **relative** API calls like `/api/auth/login`. NGINX then proxies those to the backend. The same image works everywhere without rebuilding.

### Stage 2: Runner (NGINX)

```dockerfile
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```
Start fresh from a tiny NGINX image (~23MB). Copy only the built static files from Stage 1 (everything else is discarded — no Node.js, no source code, no `node_modules` in the final image).

### NGINX Configuration

**File:** `frontend/nginx.conf`

```nginx
location /api/ {
    proxy_pass http://backend:5000/api/;
}
```
Requests to `/api/...` are forwarded to the backend container. Both Docker Compose and Kubernetes name the backend service `"backend"` — so this config works in both without changes.

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```
React Router handles navigation client-side. If the user visits `/profile` directly or refreshes, NGINX can't find a file called `profile`. This directive says: "try the exact file, then a directory, then fall back to `index.html`". React's router reads the URL and renders the right page.

```nginx
location ~* \.(js|css|png|...)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```
Vite generates filenames with content hashes (e.g., `main.abc123.js`). Since the hash changes when content changes, browsers can safely cache these files for 1 year. This makes repeat visits load almost instantly.

---

## 5. Docker Compose Explained

**File:** `docker-compose.yml`

Docker Compose orchestrates multiple containers locally. All services share a Docker bridge network called `ecommerce-network`, so they can reach each other by service name.

| Service | Hostname (inside network) | External Port |
|---------|---------------------------|---------------|
| mongo | `mongo` | 27017 |
| mongo-express | `mongo-express` | 8081 |
| backend | `backend` | 5000 |
| frontend | `frontend` | 3000 → maps to container 80 |

The `depends_on` field controls startup order:
- `backend` waits for `mongo`
- `frontend` waits for `backend`

> **Note:** `depends_on` only waits for the container to **start**, not for the app to be **ready**. MongoDB takes a few seconds to initialize. The backend's connection retry logic handles this.

---

## 6. Running with Docker Compose

### Prerequisites
- Docker Desktop installed and running

### Commands

```bash
# Build all images and start all containers in the background
docker compose up --build -d

# View logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend

# Stop all containers (data is preserved)
docker compose down

# Stop and DELETE all data (wipes MongoDB)
docker compose down -v
```

### Verify it works

1. Open **http://localhost:3000** — React frontend
2. Open **http://localhost:8081** — MongoDB admin UI (username: admin, password: pass)
3. Test the API directly: `curl http://localhost:5000/api/health`

---

## 7. How Kubernetes Works (Core Concepts)

Kubernetes (K8s) is a container orchestration platform. Where Docker Compose runs containers on **your machine**, Kubernetes runs containers across a **cluster of machines** and manages:
- Automatic restarts if a container crashes
- Rolling updates with zero downtime
- Scaling (run 5 copies of the backend)
- Service discovery (containers find each other by name)
- Persistent storage management

### Key Objects

| Object | Purpose | Analogy |
|--------|---------|---------|
| **Pod** | The smallest deployable unit. One or more containers running together. | A running container |
| **Deployment** | Manages a set of identical pods. Ensures N replicas are always running. | A process manager (PM2) |
| **StatefulSet** | Like Deployment but for stateful apps. Pods get stable names and their own storage. | A database process manager |
| **Service** | Stable network endpoint (IP + DNS name) in front of pods. | A load balancer / DNS entry |
| **ConfigMap** | Non-sensitive configuration key-value pairs. | A `.env` file |
| **Secret** | Sensitive configuration (Base64 encoded). | An encrypted `.env` file |
| **PersistentVolumeClaim** | A request for disk storage. Kubernetes finds and binds actual storage. | A disk volume mount |

### How Kubernetes Networking Works

```
Browser → NodePort Service (port 30080) → Frontend Pod (NGINX on port 80)
                                               │
                              proxy_pass /api/ │
                                               ▼
                                      ClusterIP Service "backend"
                                               │
                                               ▼
                                        Backend Pod (Express on 5000)
                                               │
                                      mongoose │
                                               ▼
                                      ClusterIP Service "mongo"
                                               │
                                               ▼
                                         MongoDB Pod (port 27017)
```

### minikube

minikube runs a single-node Kubernetes cluster inside a VM on your machine. It's the easiest way to learn Kubernetes locally.

```bash
minikube start          # Start the cluster
minikube stop           # Pause the cluster
minikube delete         # Delete the cluster completely
minikube ip             # Get the VM's IP address (use this to access NodePort services)
minikube dashboard      # Open the Kubernetes web dashboard in browser
```

---

## 8. Kubernetes Files Explained

### k8s/configmap.yaml

Stores non-sensitive environment variables. All backend pods get these injected automatically.

```yaml
data:
  NODE_ENV: "development"      # Keep as dev for HTTP sessions to work
  PORT: "5000"
  CLIENT_ORIGIN: "http://localhost:30080"  # UPDATE with your minikube IP
```

**Important:** Update `CLIENT_ORIGIN` with your actual minikube IP:
```bash
echo "http://$(minikube ip):30080"
```

### k8s/secret.yaml

Stores sensitive values. Values are Base64 encoded (not encrypted — just encoded).

To generate your own values:
```bash
# Linux/Mac
echo -n "your-value-here" | base64

# Then update the secret.yaml with the output
```

To decode a value (verify it's correct):
```bash
echo "bW9uZ29kYi..." | base64 --decode
```

### k8s/mongo-statefulset.yaml

Defines two resources:
1. **Service** named `mongo` — backend uses this hostname to connect
2. **StatefulSet** — runs MongoDB with a PersistentVolumeClaim for data storage

The PVC (`mongo-data-mongo-0`) persists data across pod restarts. Even if you delete the pod, when it restarts it reconnects to the same disk.

### k8s/backend-deployment.yaml

Defines two resources:
1. **Service** named `backend` — NGINX uses this to proxy API calls
2. **Deployment** — runs the Express API, pulls config from ConfigMap + Secret

Health probes check `/api/health` every 20 seconds. If it fails 3 times, Kubernetes restarts the pod automatically.

### k8s/frontend-deployment.yaml

Defines two resources:
1. **Service** (NodePort, port 30080) — exposes the app to your browser
2. **Deployment** — runs the NGINX container that serves React + proxies API

---

## 9. Running on Kubernetes (minikube)

### Step 1: Start minikube

```bash
minikube start
```

### Step 2: Point Docker to minikube's daemon

This makes images you build available to minikube without pushing to Docker Hub.

```bash
# For bash/zsh (Linux/Mac)
eval $(minikube docker-env)

# For PowerShell (Windows)
minikube docker-env | Invoke-Expression
```

**Important:** Run all `docker build` commands in the same terminal window after this step.

### Step 3: Build the Docker images

```bash
# Build backend image
docker build -t ecommerce-backend:latest ./backend

# Build frontend image (VITE_API_URL is empty for K8s NGINX proxy)
docker build -t ecommerce-frontend:latest ./frontend
```

### Step 4: Update your minikube IP in ConfigMap

```bash
# Get your minikube IP
minikube ip

# Edit k8s/configmap.yaml and update CLIENT_ORIGIN:
# CLIENT_ORIGIN: "http://<your-minikube-ip>:30080"
```

### Step 5: Deploy everything

```bash
# Validate manifests first (dry run — nothing is created yet)
kubectl apply -f k8s/ --dry-run=client

# Deploy all resources
kubectl apply -f k8s/
```

Kubernetes reads all YAML files in the `k8s/` folder and creates the resources.

### Step 6: Watch the pods start up

```bash
# Watch pods status in real-time (Ctrl+C to stop)
kubectl get pods --watch

# You should see all pods reach "Running" status:
# NAME                                    READY   STATUS    RESTARTS
# mongo-0                                 1/1     Running   0
# backend-deployment-xxxxx-xxxxx          1/1     Running   0
# frontend-deployment-xxxxx-xxxxx         1/1     Running   0
```

**Note:** MongoDB takes ~15-20 seconds to initialize. The backend pod may restart once while waiting — this is normal.

### Step 7: Access the application

```bash
# Get the URL to open in your browser
minikube service frontend-service --url

# Or manually construct it:
echo "http://$(minikube ip):30080"
```

Open the URL in your browser. The app should be fully functional.

### Step 8: Verify everything is working

```bash
# Check all resources are healthy
kubectl get all

# View backend logs
kubectl logs deployment/backend-deployment

# View frontend logs
kubectl logs deployment/frontend-deployment

# Test the API through Kubernetes
curl http://$(minikube ip):30080/api/health
# Expected: {"ok":true}
```

### Cleaning Up

```bash
# Remove all K8s resources
kubectl delete -f k8s/

# Note: PersistentVolumeClaims are NOT deleted automatically (protects your data)
# To delete them too:
kubectl delete pvc --all
```

---

## 10. Troubleshooting

### Pod is stuck in "Pending" state

```bash
kubectl describe pod <pod-name>
# Look for "Events" section at the bottom
```

Common cause: PersistentVolumeClaim can't be provisioned. Ensure minikube started correctly.

### Pod keeps restarting (CrashLoopBackOff)

```bash
# Check the logs of the crashing pod
kubectl logs <pod-name> --previous
```

Common causes:
- Backend can't connect to MongoDB (MongoDB not ready yet — wait a minute and it self-heals)
- Wrong secret value in secret.yaml (decode and verify the base64 values)

### Can't reach the app in browser

```bash
# Ensure the service exists and has a NodePort
kubectl get service frontend-service
# Should show TYPE=NodePort and PORT(S)=80:30080/TCP

# Get the correct URL
minikube service frontend-service --url
```

### API calls return errors (login/register not working)

1. Check CLIENT_ORIGIN in configmap.yaml matches your minikube IP + port 30080
2. Apply the updated configmap: `kubectl apply -f k8s/configmap.yaml`
3. Restart the backend: `kubectl rollout restart deployment/backend-deployment`

### Image pull errors ("ErrImageNeverPull" or "ImagePullBackOff")

You forgot to point Docker to minikube's daemon before building:
```bash
eval $(minikube docker-env)
docker build -t ecommerce-backend:latest ./backend
docker build -t ecommerce-frontend:latest ./frontend
```

---

## 11. Common Commands Cheat Sheet

### Docker

```bash
docker compose up --build -d      # Build and start all services
docker compose down               # Stop all services
docker compose down -v            # Stop and delete all data
docker compose logs -f backend    # Stream backend logs
docker images                     # List built images
docker ps                         # List running containers
docker exec -it ecommerce-backend sh  # Open shell inside backend container
```

### Kubernetes (kubectl)

```bash
kubectl apply -f k8s/             # Deploy all manifests
kubectl delete -f k8s/            # Remove all resources
kubectl get pods                  # List pods
kubectl get pods --watch          # Watch pod status live
kubectl get all                   # List everything
kubectl describe pod <name>       # Detailed info + events for a pod
kubectl logs <pod-name>           # View pod logs
kubectl logs <pod-name> -f        # Stream pod logs
kubectl logs <pod-name> --previous # Logs from previous crashed container
kubectl exec -it <pod-name> -- sh # Open shell inside a pod
kubectl rollout restart deployment/<name>  # Restart all pods in a deployment
kubectl get pvc                   # List persistent volume claims
```

### minikube

```bash
minikube start                    # Start the cluster
minikube stop                     # Pause the cluster
minikube ip                       # Get node IP
minikube dashboard                # Open web UI
minikube service <name> --url     # Get URL for a NodePort service
eval $(minikube docker-env)       # Point Docker CLI to minikube (Linux/Mac)
minikube docker-env | Invoke-Expression  # Same for Windows PowerShell
```
