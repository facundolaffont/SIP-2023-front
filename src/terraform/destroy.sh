#!/bin/bash

# Termina la ejecución del script, si algún comando termina con un código de salida diferente de cero.
set -e

# Se asegura de que el CWD sea el del directorio de este script.
cd "$(dirname "$0")"

## Carga el mail con el que se va a acceder a GCP.
#source .env

#if [ -z $user_email ]
#then

#    echo 'Se debe definir la variable de entorno "user_email" con la casilla de correo del usuario que se conectará por SSH.'
    
#else

#    # Verifica y eventualmente crea el archivo con las llaves para conectarse por SSH con GCP.
#    echo "Verificando llave SSH..."
#    sshkey_name=$HOME/.ssh/gcp
#    if [ -f "$sshkey_name" ]
#    then
#        echo "Archivo de clave SSH verificado."
#    else
#    echo "El archivo de clave SSH no existe."
#    echo "Creando archivo de clave..."
#    ssh-keygen -f $sshkey_name -t rsa -N '' -C $user_email
#    ssh-add $sshkey_name
#    echo "Archivo creado."
#    fi

    #Obtiene IP del balanceador de cargas, si existe; si no, quedará vacía (es obligatorio definir la variable).
    echo "Obteniendo IP pública del balanceador de cargas..."
    LOADBALANCER_IP=$(kubectl get -o json service nginx-ingress | jq -r .status.loadBalancer.ingress\[0\].ip)
    if [ -z "$LOADBALANCER_IP" ]; then
        echo "No existe IP pública del balanceador de cargas."
    else
        echo "IP pública del balanceador de cargas = $LOADBALANCER_IP."
    fi

    # Inicializa Terraform en carpeta de estado de la configuración del DNS.
    echo "Inicializando Terraform..."
    docker run --rm -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp init \
        -reconfigure \
        --backend-config bucket="bucket-project-1468504d-445e-406d-838" \
        --backend-config prefix="state/dns" \
        --backend-config credentials=/tmp/gcloud-key.json
    echo "Terraform inicializado."

    # Destruye infra del DNS.
    echo "Desactivando infraestructura..."
    docker run --rm -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp destroy \
        --auto-approve \
        -lock=false \
        -var "LOADBALANCER_IP=$LOADBALANCER_IP" # Esta variable es obligatoria definirla, aunque no tenga valor.
    echo "Infraestructura desactivada."

    # Inicializa Terraform en carpeta de estado de la base de la infraestructura.
    echo "Inicializando Terraform..."
    docker run --rm -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp/00-base init \
        -reconfigure \
        --backend-config bucket="bucket-project-1468504d-445e-406d-838" \
        --backend-config prefix="state/base" \
        --backend-config credentials=/tmp/gcloud-key.json
    echo "Terraform inicializado."

    # Destruye infra del DNS.
    echo "Desactivando infraestructura..."
    docker run --rm -it --mount type=bind,src=./,dst=/tmp hashicorp/terraform \
        -chdir=/tmp/00-base destroy \
        --auto-approve \
        -lock=false
    echo "Infraestructura desactivada."

#fi