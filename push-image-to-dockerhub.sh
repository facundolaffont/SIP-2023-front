# Construye la imagen de Docker y la sube al repositorio de Docker Hub.

set -e

docker build -t facundol/sip-frontend:latest .
docker push facundol/sip-frontend:latest