variable "region" {
  type    = string
  default = "us-central1"
}

variable "zone" {
  type    = string
  default = "us-central1-a"
}

variable "project_id" {
  type    = string
  default = "spgda-389523"
}

variable "LOADBALANCER_IP" {
  type = string
}

# Obtiene la información de la zona del dominio de Cloudflare.
data "cloudflare_zone" "spgda" {
  name = "fl.com.ar"
}

variable "credentials_file_path" {
  description = "Ruta del archivo de credenciales para la cuenta de servicios de GCP"
  default     = "./gcloud-key.json"
  sensitive   = true
}