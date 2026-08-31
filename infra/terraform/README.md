# One-time bootstrap (run in Azure Cloud Shell)

Everything below is run once, by hand, in [Azure Cloud Shell](https://portal.azure.com) (the `>_` icon,
top right of the portal) — it already has `az`, `terraform`, and `ansible` installed. After this, the
`infra.yml` and `deploy.yml` GitHub Actions workflows handle everything else.

## 1. Terraform state storage account

GitHub Actions runners are ephemeral, so Terraform state can't live on the runner — it needs a
persistent backend. `invoiceforgetfstate` must be globally unique across all of Azure; if it's taken,
pick another name and update `storage_account_name` in `versions.tf` to match.

```bash
az group create --name invoiceforge-tfstate-rg --location westeurope

az storage account create \
  --name invoiceforgetfstate \
  --resource-group invoiceforge-tfstate-rg \
  --location germanywestcentral \
  --sku Standard_LRS \
  --allow-blob-public-access false

az storage container create \
  --name tfstate \
  --account-name invoiceforgetfstate \
  --auth-mode login
```

## 2. App registration for GitHub Actions OIDC (no stored secret)

```bash
1. Step 2 of the README, in Cloud Shell:
ssh-keygen -t ed25519 -f ~/.ssh/invoiceforge_vm -N ""
cat ~/.ssh/invoiceforge_vm.pub
2. Your public IP: curl -s ifconfig.me
3. Clone the repo and apply Terraform:
git clone https://github.com/EssghaierJacem/InnoviceForge.git
cd InnoviceForge/infra/terraform
terraform init
terraform apply \
  -var "ssh_public_key=$(cat ~/.ssh/invoiceforge_vm.pub)" \
  -var "allowed_ssh_source_ip=<your IP>/32"
```

