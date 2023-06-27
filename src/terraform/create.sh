#!/bin/bash

set -e

# Carga el mail con el que se va a acceder a GCP.
source .env

if [ -z $user_email ]; then

    echo 'Se debe definir la variable de entorno "user_email" con la casilla de correo del usuario que se conectará por SSH.'

else

    # Verifica y eventualmente crea el archivo con las llaves para conectarse por SSH con GCP.
    echo "Verificando llave SSH..."
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

    # Terraform init.
      # --reconfigure --var credentials_file_path=/tmp/gcloud-key.json \
    echo "Terraform init..."
    docker run --rm -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp/00-base init \
        --backend-config bucket="spgda-bucket" \
        --backend-config prefix="state/base" \
        --backend-config credentials=/tmp/gcloud-key.json

    # Terraform validate.
    echo "Validando configuración de Terraform..."
    docker run \
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

    # Establece el proyecto adecuado, si no está establecido aún.
    echo "Configurando el proyecto..."
    gcloud config set project spgda-389523
    echo "Proyecto configurado."

    # Obtiene el archivo config de Kubernetes, que permite utilizar Kubernetes, y lo almacena en ~/.kube/.
    echo "Obteniendo el archivo config de Kubernetes..."
    gcloud container clusters get-credentials primary --region=us-central1-a
    echo "Archivo obtenido."

    # Aplica los cambios de todos los archivos de configuración.
    echo "Aplicando los cambios de Kubernetes..."
    cd ../k8s
    kubectl apply \
      -f 01-deploy-front.yaml \
      -f 02-service-front.yaml \
      -f 03-nginx-ingress/common/ns-and-sa.yaml \
      -f 03-nginx-ingress/rbac/rbac.yaml \
      -f tls-secrets.yaml
    echo "Aplicando los cambios de Kubernetes del Ingress..."
    kubectl apply \
      -f 03-nginx-ingress/common/nginx-config.yaml \
      -f 03-nginx-ingress/common/ingress-class.yaml \
      -f 03-nginx-ingress/common/crds/k8s.nginx.org_virtualservers.yaml \
      -f 03-nginx-ingress/common/crds/k8s.nginx.org_virtualserverroutes.yaml \
      -f 03-nginx-ingress/common/crds/k8s.nginx.org_transportservers.yaml \
      -f 03-nginx-ingress/common/crds/k8s.nginx.org_policies.yaml \
      -f 03-nginx-ingress/deployment/nginx-ingress.yaml \
      -f 03-nginx-ingress/app-ingress.yaml
    kubectl apply -f 03-nginx-ingress/service/loadbalancer.yaml
    cd -
    echo "Todos los cambios de Kubernetes fueron aplicados."

    # Espera hasta que el controlador esté listo [https://kubernetes.github.io/ingress-nginx/deploy/#pre-flight-check].
    echo "Esperando a que el controlador nginx esté listo..."
    kubectl wait --namespace nginx-ingress \
      --for=condition=ready pod \
      --selector=app=nginx-ingress \
      --timeout=120s
    echo "Controlador listo."

    until
      kubectl get service nginx-ingress --namespace=nginx-ingress
    do
      echo
      echo "Esperando a que el balanceador de carga esté listo..."
      echo
      sleep 10
    done

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

    # Terraform init.
    echo "Terraform init..."
    docker run --rm -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp init \
        --backend-config bucket="spgda-bucket" \
        --backend-config prefix="state/dns" \
        --backend-config credentials=/tmp/gcloud-key.json

    # Terraform plan.
    echo "Ejecutando plan de Terraform..."
    docker run \
        --rm -it \
        --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp plan \
        -var "LOADBALANCER_IP=$LOADBALANCER_IP"
    echo "Plan ejecutado."

    # Terraform apply.
    echo "Aplicando cambios de Terraform..."
    docker run \
        --rm -it \
        --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp apply \
        -var "LOADBALANCER_IP=$LOADBALANCER_IP" \
        -lock=false \
        --auto-approve
    echo "Cambios aplicados."

fi