#!/bin/bash

set -e

# Se asegura de que el CWD sea el del directorio de este script.
cd "$(dirname "$0")"

# Carga el mail con el que se va a acceder a GCP.
source .env

if [ -z $user_email ]; then

    echo 'Se debe definir la variable de entorno "user_email" con la casilla de correo del usuario que se conectará por SSH.'

else

    # Verifica y eventualmente crea el archivo con las llaves para conectarse por SSH con GCP.
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
    ### Configuración de la base de la infraestructura ###
    ######################################################

    # Terraform init.
    echo "Terraform init..."
    docker run --rm -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp/00-base init \
        --backend-config bucket="spgda-fg" \
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
    docker run --rm -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform -chdir=/tmp/00-base plan
    echo "Plan verificado."

    # Terraform apply.
    echo "Aplicando la configuración de Terraform..."
    docker run --rm -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform -chdir=/tmp/00-base apply --auto-approve -lock=false
    docker run --rm -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform -chdir=/tmp/00-base apply --auto-approve -lock=false
    echo "Configuración aplicada."


    ###############################################
    ### Aplicación de los cambios de Kubernetes ###
    ###############################################

    # Establece el proyecto adecuado, si no está establecido aún.
    echo "Configurando el proyecto..."
    gcloud config set project spheric-almanac-409420
    echo "Proyecto configurado."

    # Obtiene el archivo config de Kubernetes, que permite utilizar Kubernetes, y lo almacena en ~/.kube/.
    echo "Obteniendo el archivo config de Kubernetes..."
    gcloud container clusters get-credentials primary --region=us-central1-a
    echo "Archivo obtenido."

    # Aplica los cambios de la primera tanda de archivos de configuración de Kubernetes.
    echo "Aplicando los cambios de Kubernetes..."
    cd ../k8s
    kubectl apply \
      -f debug.yaml \
      -f 01-deploy-front.yaml \
      -f 02-service-front.yaml \
      -f 03-nginx-ingress/common/ns-and-sa.yaml \
      -f 03-nginx-ingress/rbac/rbac.yaml \
      -f tls-secrets.yaml \
      -f 03-nginx-ingress/common/nginx-config.yaml \
      -f 03-nginx-ingress/common/ingress-class.yaml \
      -f 03-nginx-ingress/common/crds/k8s.nginx.org_virtualservers.yaml \
      -f 03-nginx-ingress/common/crds/k8s.nginx.org_virtualserverroutes.yaml \
      -f 03-nginx-ingress/common/crds/k8s.nginx.org_transportservers.yaml \
      -f 03-nginx-ingress/common/crds/k8s.nginx.org_policies.yaml \
      -f 03-nginx-ingress/deployment/nginx-ingress.yaml \
      -f 03-nginx-ingress/app-ingress.yaml \
      -f 03-nginx-ingress/service/loadbalancer.yaml \
      -f 04-tls/dns01/00-cert-manager.yaml \
      -f 04-tls/dns01/01-cloudflare-secrets.yaml

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
    
    # Aplica los cambios de la segunda tanda de archivos de configuración de Kubernetes.
    kubectl apply \
      -f 04-tls/dns01/02-issuer.yaml \
      -f 04-tls/dns01/03-certificate.yaml
    cd -
    echo "Cambios aplicados."

    # Espera hasta que el controlador NGINX esté listo. [https://kubernetes.github.io/ingress-nginx/deploy/#pre-flight-check]
    echo "Esperando a que el controlador NGINX esté listo..."
    kubectl wait --namespace nginx-ingress \
      --for=condition=ready pod \
      --selector=app=nginx-ingress \
      --timeout=120s
    echo "Controlador listo."

    # Espera hasta que el balanceador de carga exista.
    until
      kubectl get service nginx-ingress --namespace=nginx-ingress
    do
      echo
      echo "Esperando a que el balanceador de carga esté listo..."
      echo
      sleep 10
    done

    # Espera hasta que el balanceador de carga tenga IP pública.
    while
      LOADBALANCER_IP=$(kubectl get -o json service nginx-ingress --namespace=nginx-ingress | jq -r .status.loadBalancer.ingress\[0\].ip)
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


    ###################################################
    ### Configuración de la infraestructura del DNS ###
    ###################################################

    # Terraform init.
    echo "Terraform init..."
    docker run --rm -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
    docker run --rm -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp init \
        --backend-config bucket="spgda-fg" \
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