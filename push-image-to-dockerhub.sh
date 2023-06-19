# Construye la app y la sube al repositorio de Docker Hub.

set -e

docker build -t facundol/sip-frontend:latest .
docker push facundol/sip-frontend:latest