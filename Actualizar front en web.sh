# Construye la imagen de Docker, la sube al repositorio de Docker Hub,
# y la despliega en la nube.

if [ -z $1 ]; then

    echo "Debe especificar la versión de la imagen."

else

    set -e

    # Copia el entorno de la nube al archivo .env.
    echo "Copiando el entorno de la nube al archivo .env..."
    cp envs/.env.spgda-frontend-producción-nube .env
    echo "Entorno copiado."

    # Construye la imagen de Docker.
    echo "Construyendo la imagen de Docker..."
    docker build --no-cache -t facundol/sip-frontend:$1 .
    docker push facundol/sip-frontend:$1
    echo "Imagen de Docker construida."

    # Despliega la imagen en la nube.
    echo "Desplegando la imagen en la nube..."
    kubectl delete -f src/k8s/01-deploy-front.yaml
    kubectl apply -f src/k8s/01-deploy-front.yaml
    echo "Imagen desplegada en la nube."

fi