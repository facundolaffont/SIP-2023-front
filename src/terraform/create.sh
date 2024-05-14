#!/bin/bash

# Termina el script cuando se produce cualquier error.
set -e

###########
## DEBUG ##
###########

# Imprime cada instrucción en la terminal.
#set -x

# Habilita el DEBUG (mientras se depura, esta instrucción puede
# moverse a cualquier sitio del archivo desde el cual se quiere
# empezar a depurar, para evitar tener que estar presionando Enter
# por cada línea previa que no se quiera depurar).
#   trap read DEBUG

# Cuando se recibe una interrupción por teclado, se elimina el proceso
# generado al haber ejecutado el comando 'sleep 1h'.
#   echo "Presionar Ctrl + C para avanzar."
#   trap "pkill -f 'sleep 1h'" INT

# trap "set +x ; sleep 1h ; set -x" DEBUG

###############
## FIN DEBUG ##
###############

# Verifica que los comandos necesarios estén instalados.
if ! command -v helm &> /dev/null; then echo "Debe instalar helm"; fi
if ! command -v ssh-keygen &> /dev/null; then echo "Debe instalar ssh"; fi
if ! command -v ssh-add &> /dev/null; then echo "Debe instalar ssh"; fi
if ! command -v docker &> /dev/null; then echo "Debe instalar docker"; fi
if ! command -v gcloud &> /dev/null; then echo "Debe instalar gcloud"; fi
if ! command -v kubectl &> /dev/null; then echo "Debe instalar kubectl"; fi
if ! command -v jq &> /dev/null; then echo "Debe instalar jq"; fi

# Cambiar el directorio actual para que sea el mismo que el de este mismo script.
cd "$(dirname "$0")"

# Carga el mail con el que se va a acceder a Google Cloud.
source .env

# Si no se especificó el mail, notifica al usuario y finaliza la ejecución del script.
if [ -z $user_email ]; then
    echo 'Se debe definir la variable de entorno "user_email" con la casilla de correo del usuario que se conectará por SSH.'

else


    #########################################
    ### Configuración de las credenciales ###
    #########################################

    # Verifica, y eventualmente crea, el archivo con las llaves para conectarse por SSH con Google Cloud.
    echo "Verificando clave SSH..."
    sshkey_name=$HOME/.ssh/gcp
    if [ -f "$sshkey_name" ]; then
        echo "Archivo de clave SSH verificado."
    else
        echo "El archivo de clave SSH no existe."
        echo "Creando archivo de clave SSH..."
        ssh-keygen -f $sshkey_name -t rsa -N '' -C $user_email
        ssh-add $sshkey_name
        echo "Archivo creado."
    fi


    ######################################################
    ### Creación de la infraestructura base de la nube ###
    ######################################################

    # Terraform init.
    echo "Terraform init..."
    docker run --rm -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp/00-base init \
        -reconfigure \
        --backend-config bucket="spgda-ac-bucket" \
        --backend-config prefix="state/base" \
        --backend-config credentials=/tmp/gcloud-key.json

    # Terraform validate.
    echo "Validando configuración de Terraform..."
    docker run \
      --rm -it \
      --rm -it \
      --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
      -chdir=/tmp/00-base validate
    echo "Configuración validada."

    # Terraform plan.
    echo "Verificando plan de Terraform..."
    docker run --rm -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform -chdir=/tmp/00-base plan
    echo "Plan verificado."

    # Terraform apply.
    echo "Aplicando la configuración de Terraform..."
    docker run --rm -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform -chdir=/tmp/00-base apply --auto-approve -lock=false
    echo "Configuración aplicada."


    ###############################################
    ### Aplicación de los cambios de Kubernetes ###
    ###############################################

    # Establece el proyecto adecuado, si no está establecido aún.
    echo "Configurando el proyecto..."
    gcloud config set project ultimate-flare-420416
    echo "Proyecto configurado."

    # Obtiene el archivo config de Kubernetes, que permite utilizar Kubernetes, y lo almacena en ~/.kube/.
    echo "Obteniendo el archivo config de Kubernetes..."
    gcloud container clusters get-credentials primary --region=us-central1-a
    echo "Archivo obtenido."

    # Crea los recursos del frontend.
    echo "Aplicando los cambios de Kubernetes..."
    cd ../k8s
    kubectl apply \
      -f debug.yaml \
      -f 01-deploy-front.yaml \
      -f 02-service-front.yaml

    # Despliega el controlador NGINX.
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    helm install quickstart ingress-nginx/ingress-nginx

    # Despliega el cert-manager.
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.5/cert-manager.yaml

    # Espera hasta que los objetos de cert-manager estén listos. [https://kubernetes.github.io/ingress-nginx/deploy/#pre-flight-check]
    echo "Esperando a que cert-manager esté listo..."
    kubectl wait --namespace cert-manager \
      --for=condition=ready pod \
      --selector=app=cert-manager \
      --timeout=120s
    kubectl wait --namespace cert-manager \
      --for=condition=ready pod \
      --selector=app=webhook \
      --timeout=120s
    kubectl wait --namespace cert-manager \
      --for=condition=ready pod \
      --selector=app=cainjector \
      --timeout=120s
    echo "cert-manager listo."

    # Despliega el secreto con las credenciales para Cloudflare.
    kubectl apply -f cloudflare-secrets.yaml

    # Despliega recurso que representa la autoridad de certificación (ClusterIssuer).
    kubectl apply -f letsencrypt-staging-issuer.yaml
    kubectl apply -f letsencrypt-production-issuer.yaml

    pwd
    cd ../k8s # DEBUG

    # Despliega el certificado.
    kubectl apply -f certificate.yaml

    # Despliega el recurso Ingress.
    kubectl apply -f nginx-ingress.yaml

    # Espera hasta que el controlador NGINX esté listo. [https://kubernetes.github.io/ingress-nginx/deploy/#pre-flight-check]
    echo "Esperando a que el controlador NGINX esté listo..."
    kubectl wait \
      --for=condition=ready pod \
      --selector=app.kubernetes.io/name=ingress-nginx \
      --timeout=120s
    echo "Controlador listo."

    # Espera hasta que el balanceador de carga exista.
    until
      kubectl get service quickstart-ingress-nginx-controller
    do
      echo
      echo "Esperando a que el balanceador de carga esté listo..."
      echo
      sleep 10
    done

    # Espera hasta que el balanceador de carga tenga IP pública.
    while
      LOADBALANCER_IP=$(kubectl get -o json service quickstart-ingress-nginx-controller | jq -r .status.loadBalancer.ingress\[0\].ip)
      [ $LOADBALANCER_IP = null ]
    do
      echo
      echo "Esperando a que esté disponible la IP pública del balanceador de carga..."
      echo
      sleep 10
    done

    echo
    echo "IP pública del balanceador de cargas = $LOADBALANCER_IP."
    echo


    # ###################################################
    # ### Configuración de la infraestructura del DNS ###
    # ###################################################

    cd ../terraform

    # Terraform init.
    echo "Terraform init..."
    docker run --rm -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp init \
        --backend-config bucket="spgda-ac-bucket" \
        --backend-config prefix="state/dns" \
        --backend-config credentials=/tmp/gcloud-key.json

    # Terraform plan.
    echo "Ejecutando plan de Terraform..."
    docker run \
        --rm -it \
        --rm -it \
        --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp plan \
        -var "LOADBALANCER_IP=$LOADBALANCER_IP"
    echo "Plan ejecutado."

    # Terraform apply.
    echo "Aplicando cambios de Terraform..."
    docker run \
        --rm -it \
        --rm -it \
        --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp apply \
        -var "LOADBALANCER_IP=$LOADBALANCER_IP" \
        -lock=false \
        --auto-approve
    echo "Cambios aplicados."

fi