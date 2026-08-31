terraform {
  required_version = ">= 1.7"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
  }

  backend "azurerm" {
    resource_group_name  = "invoiceforge-tfstate-rg"
    storage_account_name = "invoiceforgetfstate"
    container_name       = "tfstate"
    key                  = "invoiceforge.tfstate"
  }
}

provider "azurerm" {
  features {}
}
