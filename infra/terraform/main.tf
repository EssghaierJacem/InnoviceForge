resource "azurerm_resource_group" "main" {
  name     = "invoiceforge-rg"
  location = var.location
}
