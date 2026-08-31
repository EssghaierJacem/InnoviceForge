variable "location" {
  description = "Azure region. Limited to whatever this subscription's regionrestriction policy allows — for an Azure for Students subscription, check with: az policy assignment list --query \"[?name=='sys.regionrestriction'].parameters.listOfAllowedLocations.value\". uksouth is the proven-working default here: germanywestcentral had zero B-series capacity and zero Dsv7-family quota for this subscription at deploy time."
  type        = string
  default     = "uksouth"
}

variable "vm_size" {
  description = "VM size. Standard_B2s (2 vCPU / 4GB RAM) would comfortably fit this stack (4 JVMs + Keycloak + Postgres x2 + RabbitMQ + Redis + MinIO + a Python service) but had zero capacity for this subscription at deploy time — landed on Standard_D2s_v7 (2 vCPU / 8GB) instead. This default must match whatever's actually live, or a bare `terraform apply` will try to resize the running VM back down."
  type        = string
  default     = "Standard_D2s_v7"
}

variable "admin_username" {
  description = "SSH admin username on the VM"
  type        = string
  default     = "invoiceforge"
}

variable "ssh_public_key" {
  description = "SSH public key (contents of e.g. ~/.ssh/id_ed25519.pub) for VM admin access. Terraform never sees the private key."
  type        = string
}

variable "allowed_ssh_source_ip" {
  description = "CIDR allowed to reach port 22. Defaults to \"*\" (any source) because deploy.yml's GitHub Actions runners need to SSH in from unpredictable IPs — there's no fixed range to allowlist instead. Password auth is disabled (key-only), which is the real mitigation for leaving this open. Narrow it to your own IP/32 if you want tighter access for manual work, at the cost of deploy.yml's SSH step failing again."
  type        = string
  default     = "*"
}
