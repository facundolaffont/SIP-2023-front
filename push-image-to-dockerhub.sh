# Construye la imagen de Docker y la sube al repositorio de Docker Hub.

if [ -z $1 ]; then

    echo "Debe especificar la versión de la imagen"

else

    set -e

    cp envs/.env.spgda-frontend-producción-nube .env
    docker build --no-cache -t facundol/sip-frontend:$1 .
    docker push facundol/sip-frontend:$1

fi