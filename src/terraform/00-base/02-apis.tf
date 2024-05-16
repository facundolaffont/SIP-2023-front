# https://developer.hashicorp.com/terraform/language/resources

# https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/google_project_service
resource "google_project_service" "compute" {
  service = "compute.googleapis.com"

  disable_dependent_services = true

#   provisioner "local-exec" {
#     command = <<EOF
#         echo "Verificando que el servicio compute.googleapis.com se haya habilitado..."
#         for i in {1..5}; do
#         sleep $i
#         if gcloud services list --project="${var.project_id}" | grep "compute.googleapis.com"; then
#             echo "Servicio habilitado."
#             exit 0
#         fi
#         done

#         echo "El servicio no fue habilitado luego de 15s."
#         exit 1
#     EOF
#   }

  disable_on_destroy = false

}

resource "google_project_service" "container" {

  # https://cloud.google.com/kubernetes-engine/docs/reference/rest#service:-container.googleapis.com
  service = "container.googleapis.com"

#   provisioner "local-exec" {
#     command = <<EOF
#         echo "Verificando que el servicio container.googleapis.com se haya habilitado..."
#         for i in {1..5}; do
#         sleep $i
#         if gcloud services list --project="${var.project_id}" | grep "container.googleapis.com"; then
#             echo "Servicio habilitado."
#             exit 0
#         fi
#         done

#         echo "El servicio no fue habilitado luego de 15s."
#         exit 1
#     EOF
#   }

  disable_on_destroy = false

}

resource "google_project_service" "cloud_resource_manager" {

  # https://cloud.google.com/resource-manager/reference/rest#service:-cloudresourcemanager.googleapis.com
  service            = "cloudresourcemanager.googleapis.com"

#   provisioner "local-exec" {
#     command = <<EOF
#         echo "Verificando que el servicio cloudresourcemanager.googleapis.com se haya habilitado..."
#         for i in {1..5}; do
#         sleep $i
#         if gcloud services list --project="${var.project_id}" | grep "cloudresourcemanager.googleapis.com"; then
#             echo "Servicio habilitado."
#             exit 0
#         fi
#         done

#         echo "El servicio no fue habilitado luego de 15s."
#         exit 1
#     EOF
#   }

  disable_on_destroy = false

}