# Provisioning the VM (Azure Cloud Shell)

Terraform + Ansible are run **by hand, in [Azure Cloud Shell](https://portal.azure.com)** (the `>_`
icon, top right of the portal — it already has `az`, `terraform`, and `ansible` installed), not from
GitHub Actions. Reason: this Azure subscription is under a university tenant (`esprit.tn`) that doesn't
allow students to self-register the Entra app that GitHub's OIDC auth would need, and there's no way
around that requirement short of asking IT. Since infra changes are rare anyway (not on every deploy),
running these two commands by hand when needed is a fine tradeoff.

Only `deploy.yml` runs unattended in GitHub Actions — it builds/pushes images to GHCR and SSHes into the
VM, neither of which touches an Azure API, so it was never affected by this restriction.

## 0. Check your allowed regions

Azure for Students subscriptions are locked to a small, account-specific set of regions via a
`sys.regionrestriction` policy — `westeurope` is commonly *not* on it. Check yours before anything else:

```bash
az policy assignment list --query "[?name=='sys.regionrestriction'].parameters.listOfAllowedLocations.value" -o tsv
```

If the result doesn't include `uksouth` (this repo's default, set in `variables.tf`), pick one from your
actual list and swap it in everywhere `uksouth` appears below and in `infra/terraform/variables.tf`'s
`location` default. `uksouth` is the default because it's what actually worked for this subscription —
`germanywestcentral` (also on the allowed list) had zero `Standard_B2s` capacity *and* zero quota for the
`Dsv7` family at deploy time; if you hit the same on your list's first choice, just try another entry
from it.

## 1. Terraform state storage account

Persistent state, separate from the VM itself. `invoiceforgetfstate` must be globally unique across all
of Azure; if it's taken, pick another name and update `storage_account_name` in `versions.tf` to match.

```bash
az group create --name invoiceforge-tfstate-rg --location uksouth

az storage account create \
  --name invoiceforgetfstate \
  --resource-group invoiceforge-tfstate-rg \
  --location uksouth \
  --sku Standard_LRS \
  --allow-blob-public-access false

az storage container create \
  --name tfstate \
  --account-name invoiceforgetfstate \
  --auth-mode login
```

## 2. SSH keypair

RSA specifically — Terraform's `admin_ssh_key` argument (`azurerm` provider) rejects ed25519 keys even
though Azure itself supports them.

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/invoiceforge_vm -N ""
cat ~/.ssh/invoiceforge_vm.pub
```
Keep this Cloud Shell session around (or re-generate) — you'll need both the public key (for
`terraform apply` below) and the private key (pasted into the GitHub secret `SSH_PRIVATE_KEY` for
`deploy.yml`, and used by `ansible-playbook` in step 4).

## 3. Your current public IP (for the SSH NSG rule)

```bash
curl -s ifconfig.me
```
Note it as a `/32` CIDR, e.g. `203.0.113.5/32` — used as `allowed_ssh_source_ip` below. If your IP
changes later (new network, VPN, etc.), you'll need to re-apply Terraform with the new value.

## 4. Clone the repo and apply

```bash
git clone https://github.com/EssghaierJacem/InnoviceForge.git
cd InnoviceForge/infra/terraform

terraform init

terraform apply \
  -var "ssh_public_key=$(cat ~/.ssh/invoiceforge_vm.pub)" \
  -var "allowed_ssh_source_ip=<your IP>/32" \
  -parallelism=1
```

Note the `public_ip_address` output at the end — that's the VM's IP.

### If apply errors mid-way ("Provider produced inconsistent result", or "already exists")

Hit this live: the azurerm provider occasionally creates a resource successfully in Azure, then the
immediate read-back to populate Terraform state 404s (an Azure Resource Manager propagation-lag issue,
not a config problem — `-parallelism=1` above reduces how often it happens by not racing multiple
creates at once, but doesn't eliminate it). The error message names the resource type; the fix is:

1. Just retry the same `terraform apply` — often it's transient and succeeds on the next try.
2. If retrying says the resource "already exists" (meaning it really did get created, state just
   doesn't know), import it directly using the ID from the error message, then re-apply:
   ```bash
   terraform import \
     -var "ssh_public_key=$(cat ~/.ssh/invoiceforge_vm.pub)" \
     -var "allowed_ssh_source_ip=<your IP>/32" \
     <resource_address_from_the_error> <id_from_the_error>
   ```
3. Repeat for however many resources it happens to (it can cascade through several in one deploy) — each
   apply makes real progress even when it errors, so you're never starting over.

## 5. Provision the VM with Ansible

Still in Cloud Shell, from the repo root:

```bash
cd ../..   # back to repo root

echo "invoiceforge-vm ansible_host=<public_ip_address> ansible_user=invoiceforge ansible_ssh_private_key_file=~/.ssh/invoiceforge_vm ansible_ssh_common_args='-o StrictHostKeyChecking=no'" > /tmp/inventory.ini

ansible-playbook -i /tmp/inventory.ini infra/ansible/provision.yml \
  --extra-vars "image_tag=latest" \
  --extra-vars "postgres_password=<pick one>" \
  --extra-vars "keycloak_admin_password=<pick one>" \
  --extra-vars "keycloak_admin_client_secret=<see .env.example — must match keycloak/realm-export.json>" \
  --extra-vars "gemini_api_key=<your Gemini key>"
```

This brings up the infra containers (Postgres, RabbitMQ, Redis, MinIO, Keycloak). The app-service images
(api-gateway, ingestion-service, analytics-service, parsing-service, frontend) won't exist in GHCR yet on
a brand-new repo, so those will fail to pull on this first run — that's expected, `deploy.yml` fills them
in on the next push to `main`.

## 6. GitHub repo secrets & variables

**Secrets** (Settings > Secrets and variables > Actions > Secrets): `SSH_PRIVATE_KEY` (from step 2).

**Variables** (same page, Variables tab): `AZURE_VM_IP` — the IP from step 4's Terraform output.

## 7. First deploy

Push to `main` (or manually re-run `deploy.yml`) so the app images actually get built and pushed, then
in each of the 5 GHCR packages (repo's Packages tab), Package settings > Change visibility > Public —
done once per package so the VM can pull without credentials.

## Re-provisioning later

If you change `infra/terraform/*.tf` or `infra/ansible/provision.yml`, repeat steps 4-5 from Cloud Shell
(or your own machine with `az`/`terraform`/`ansible` installed and `az login` run). Routine app deploys
(code changes) never need this — they go through `deploy.yml` automatically.
