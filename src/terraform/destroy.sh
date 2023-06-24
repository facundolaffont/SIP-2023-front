#!/bin/bash

set -e

source .env

if [ -z $user_email ]
then

    echo 'Se debe definir la variable de entorno "user_email" con la casilla de correo del usuario que se conectará por SSH.'
    
else

    # Verifica y eventualmente crea el archivo con las llaves para conectarse por SSH con GCP.
    echo "Verificando llave SSH..."
    sshkey_name=$HOME/.ssh/gcp
    if [ -f "$sshkey_name" ]
    then
        echo "Archivo de clave SSH verificado."
    else
    echo "El archivo de clave SSH no existe."
    echo "Creando archivo de clave..."
    ssh-keygen -f $sshkey_name -t rsa -N '' -C $user_email
    ssh-add $sshkey_name
    echo "Archivo creado."
    fi

    # Inicializa Terraform en carpeta de estado de la configuración del DNS.
    echo "Inicializando Terraform..."
    docker run -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp init \
        --backend-config bucket="spgda-bucket" \
        --backend-config prefix="state/dns" \
        --backend-config credentials=/tmp/gcloud-key.json
    echo "Terraform inicializado."

    # Destruye infra del DNS.
    echo "Desactivando infraestructura..."
    docker run -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp destroy \
        --auto-approve \
        -lock=false
    echo "Infraestructura desactivada."

    # Inicializa Terraform en carpeta de estado de la base de la infraestructura.
    echo "Inicializando Terraform..."
    docker run -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp/00-base init \
        --backend-config bucket="spgda-bucket" \
        --backend-config prefix="state/base" \
        --backend-config credentials=/tmp/gcloud-key.json
    echo "Terraform inicializado."

    # Destruye infra del DNS.
    echo "Desactivando infraestructura..."
    docker run -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp/00-base destroy \
        --auto-approve \
        -lock=false
    echo "Infraestructura desactivada."

fi