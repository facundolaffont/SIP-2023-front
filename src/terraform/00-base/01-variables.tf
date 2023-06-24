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

variable "credentials_file_path" {
  description = "Ruta del archivo de credenciales para la cuenta de servicios de GCP"
  default     = "../gcloud-key.json"
  sensitive   = true
}