# Ecommerce DevOps Deployment Guide

This project is a MERN ecommerce web app:

- Frontend: React + Vite, built into static files and served by NGINX
- Backend: Node.js + Express API on port `5000`
- Database: MongoDB
- Container runtime: Docker
- Orchestration: Kubernetes
- Cloud target: AWS EKS

## Architecture

```text
Browser
  |
  v
Frontend Service
  |
  v
Frontend Pod: NGINX + React
  |
  | /api requests are proxied to http://backend:5000
  v
Backend Service
  |
  v
Backend Pods: Express API
  |
  v
Mongo Service
  |
  v
MongoDB StatefulSet + PersistentVolumeClaim
```

The backend and MongoDB are internal `ClusterIP` services. Only the frontend is exposed.

## Important Files

```text
backend/Dockerfile              Builds the Express API image
frontend/Dockerfile             Builds the React app and serves it with NGINX
frontend/nginx.conf             Proxies /api requests to the backend service
docker-compose.yml              Runs the full stack locally with Docker
k8s/configmap.yaml              Non-secret backend environment variables
k8s/secret.yaml                 MongoDB URI, Mongo password, session secret
k8s/mongo-statefulset.yaml      MongoDB StatefulSet with persistent storage
k8s/backend-deployment.yaml     Backend Deployment and internal Service
k8s/frontend-deployment.yaml    Frontend Deployment and NodePort Service
k8s/aws-loadbalancer-service.yaml Exposes frontend on AWS EKS
```

## Run With Docker Compose

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f backend
```

Open:

```text
http://localhost:3000
```

Health check:

```bash
curl http://localhost:3000/api/health
```

Stop:

```bash
docker compose down
```

Delete containers and MongoDB data:

```bash
docker compose down -v
```

## Run Locally With Kubernetes / Minikube

Start minikube:

```bash
minikube start
```

Point Docker to minikube's Docker engine.

PowerShell:

```powershell
minikube docker-env | Invoke-Expression
```

Build images inside minikube:

```bash
docker build -t ecommerce-backend:latest ./backend
docker build -t ecommerce-frontend:latest ./frontend
```

Deploy the Kubernetes resources:

```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/mongo-statefulset.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

Check status:

```bash
kubectl get pods
kubectl get svc
kubectl get pvc
```

Open the frontend:

```bash
minikube service frontend-service --url
```

Test through Kubernetes:

```bash
curl http://$(minikube ip):30080/api/health
```

## Deploy To AWS EKS

Create an ECR repository for each app image:

```bash
aws ecr create-repository --repository-name ecommerce-backend
aws ecr create-repository --repository-name ecommerce-frontend
```

Authenticate Docker to ECR:

```bash
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-south-1.amazonaws.com
```

Build, tag, and push:

```bash
docker build -t ecommerce-backend:latest ./backend
docker build -t ecommerce-frontend:latest ./frontend

docker tag ecommerce-backend:latest <account-id>.dkr.ecr.ap-south-1.amazonaws.com/ecommerce-backend:latest
docker tag ecommerce-frontend:latest <account-id>.dkr.ecr.ap-south-1.amazonaws.com/ecommerce-frontend:latest

docker push <account-id>.dkr.ecr.ap-south-1.amazonaws.com/ecommerce-backend:latest
docker push <account-id>.dkr.ecr.ap-south-1.amazonaws.com/ecommerce-frontend:latest
```

Create or connect to your EKS cluster, then deploy the app:

```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/mongo-statefulset.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/aws-loadbalancer-service.yaml
```

Point the deployments to your ECR images:

```bash
kubectl set image deployment/backend backend=<account-id>.dkr.ecr.ap-south-1.amazonaws.com/ecommerce-backend:latest
kubectl set image deployment/frontend frontend=<account-id>.dkr.ecr.ap-south-1.amazonaws.com/ecommerce-frontend:latest
```

Get the AWS public URL:

```bash
kubectl get svc frontend-loadbalancer
```

Use the `EXTERNAL-IP` or hostname shown by AWS.

For a real AWS deployment, update `CLIENT_ORIGIN` in `k8s/configmap.yaml` to the load balancer URL and restart the backend:

```bash
kubectl apply -f k8s/configmap.yaml
kubectl rollout restart deployment/backend
```

## Review Explanation Points

- Docker packages the frontend, backend, and database into isolated containers.
- Docker Compose runs the full stack locally for development.
- Kubernetes runs the same containers with self-healing, scaling, and service discovery.
- MongoDB uses a StatefulSet because it needs stable storage.
- Backend and MongoDB use `ClusterIP` because they should stay private.
- Frontend uses `NodePort` for local minikube and `LoadBalancer` for AWS.
- NGINX serves React and reverse proxies `/api` requests to the backend.
- ConfigMap stores non-sensitive configuration.
- Secret stores database and session credentials.
- Readiness and liveness probes allow Kubernetes to restart unhealthy pods and route traffic only to ready pods.

## Cleanup

Local Kubernetes:

```bash
kubectl delete -f k8s/frontend-deployment.yaml
kubectl delete -f k8s/backend-deployment.yaml
kubectl delete -f k8s/mongo-statefulset.yaml
kubectl delete -f k8s/secret.yaml
kubectl delete -f k8s/configmap.yaml
kubectl delete pvc --all
```

AWS LoadBalancer only:

```bash
kubectl delete -f k8s/aws-loadbalancer-service.yaml
```
