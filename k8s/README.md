# Kubernetes Manifests for Riot

This directory contains Kustomize-based manifests for local development (dev overlay) and production-like deployments (prod overlay).

## Structure

- `base/` — all shared resources (Deployments, Services, StatefulSets, ConfigMaps, Secrets, PVCs, Ingress)
- `overlays/dev/` — development profile: NodePorts for frontend and Mosquitto, relaxed CORS
- `overlays/prod/` — production profile: image overrides, replicas scale-out, custom host/TLS for Ingress

## Prerequisites

- Kubernetes cluster (e.g., Minikube)
- NGINX Ingress controller (for Ingress to work)

## Apply base

```bash
kubectl apply -k k8s/base
```

## Development profile

This exposes:

- Frontend on NodePort 30080
- Mosquitto on NodePort 31883 (MQTT) and 30901 (WebSocket)

```bash
kubectl apply -k k8s/overlays/dev

# If using minikube, you can access the frontend via:
minikube service -n riot riot-frontend-service --url
```

If using an Ingress with host `riot.local`, add it to your `/etc/hosts` pointing to the ingress controller IP.

## Production profile

Set your image registry and tags in `k8s/overlays/prod/kustomization.yaml` before applying.

```bash
kubectl apply -k k8s/overlays/prod
```

The prod overlay also scales up replicas and patches the Ingress host (set to `riot.example.com` by default). Uncomment the TLS section and add cert-manager annotations as needed.

## Notes

- Secrets in `base/secrets/` are sample/dev values. Replace them in real environments.
- The backend is routed under `/api` via the Ingress with regex rewrite to the backend service.# RIoT Kubernetes Manifests

This directory contains a Kustomize-based setup for the RIoT stack.

## Prerequisites

- kubectl v1.26+
- A default StorageClass for PVCs
- An ingress controller (e.g., NGINX) if you want to use Ingress

## Deploy (base)

```
kubectl apply -k k8s/base
```

## Access

- Frontend Service: `riot-frontend` port 80 (ClusterIP). Port-forward:
  - `kubectl port-forward -n riot svc/riot-frontend 8080:80` → http://localhost:8080
- Backend Service: `riot-backend-core` port 9090. Port-forward:
  - `kubectl port-forward -n riot svc/riot-backend-core 9090:9090` → http://localhost:9090
- Grafana: `kubectl port-forward -n riot svc/grafana 3000:3000` → http://localhost:3000 (admin/password)
- Prometheus: `kubectl port-forward -n riot svc/prometheus 9091:9090` → http://localhost:9091
- RabbitMQ mgmt: `kubectl port-forward -n riot svc/rabbitmq-service 15672:15672` → http://localhost:15672

## Notes

- Secrets are for development only and base64-encoded; rotate for production.
- Ingress resource exists at `base/ingress/ingress.yaml` using host `riot.local`. Add a hosts entry and install an Ingress Controller to use it.

## Delete

```
kubectl delete -k k8s/base
```
