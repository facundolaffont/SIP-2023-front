# Crea el registro DNS que resuelve el nombre spgda.fl.com.ar
# a la IP del balanceador de cargas.
resource "cloudflare_record" "app_loadbalancer" {
  zone_id = data.cloudflare_zone.spgda.zone_id
  name    = "spgda"
  type    = "A"
  value   = var.LOADBALANCER_IP
  ttl     = 1
  proxied = true
}