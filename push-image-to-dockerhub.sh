# Construye la app, la imagen de Docker y la sube al repositorio de Docker Hub.

set -e

npm build
docker build -t facundol/sip-frontend:latest .
docker push facundol/sip-frontend:latest