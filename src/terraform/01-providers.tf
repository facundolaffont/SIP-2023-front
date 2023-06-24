# https://developer.hashicorp.com/terraform/language/settings
terraform {
  
  # https://developer.hashicorp.com/terraform/language/settings#specifying-provider-requirements
  required_providers {

    google = {
      source  = "hashicorp/google"
      version = ">=4.60.0"
    }

    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = ">= 4.8.0"
    }

  }

  # # https://developer.hashicorp.com/terraform/language/settings/backends/configuration
  # # Crea la carpeta .terraform y sus archivos.
  # backend "gcs" {}

  # https://developer.hashicorp.com/terraform/language/settings#specifying-a-required-terraform-version
  required_version = ">= 1.4.5"
}

# https://developer.hashicorp.com/terraform/language/providers/configuration
provider "google" {

   # https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/provider_reference#authentication-configuration
  credentials = file(var.credentials_file_path)

  project     = var.project_id
  region      = var.region
  zone        = var.zone
}

# Define el proveedor de Cloudflare para crear los registros que permitirán resolver el nombre de dominio,
# devolviendo la IP pública del balanceador de cargas.
provider "cloudflare" {
  api_token = file("./cloudflare-token.txt")
}