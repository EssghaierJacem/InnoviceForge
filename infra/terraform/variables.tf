variable "location" {
  description = "Azure region. Limited to whatever this subscription's regionrestriction policy allows — for an Azure for Students subscription, check with: az policy assignment list --query \"[?name=='sys.regionrestriction'].parameters.listOfAllowedLocations.value\""
  type        = string
  default     = "germanywestcentral"
}

variable "vm_size" {
  description = "VM size. Standard_B2s (2 vCPU / 4GB RAM) is the minimum that comfortably fits this stack (4 JVMs + Keycloak + Postgres x2 + RabbitMQ + Redis + MinIO + a Python service)."
  type        = string
  default     = "Standard_B2s"
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
  description = "Single public IP (CIDR, e.g. 203.0.113.5/32) allowed to reach port 22. Update this if your IP changes."
  type        = string
}
