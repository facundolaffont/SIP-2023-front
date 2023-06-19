# https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_managed_ssl_certificate.html
resource "google_compute_managed_ssl_certificate" "load_balancer_cert" {
  provider = google-beta
  name     = "front-lb-ssl-cert"

  managed {
    domains = [data.cloudflare_zone.spgda.name]
  }

}