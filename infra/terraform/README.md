# Provisioning the VM (Azure Cloud Shell)

Terraform + Ansible are run **by hand, in [Azure Cloud Shell](https://portal.azure.com)** (the `>_`
icon, top right of the portal — it already has `az`, `terraform`, and `ansible` installed), not from
GitHub Actions. Reason: this Azure subscription is under a university tenant that doesn't allow
students to self-register the Entra app GitHub's OIDC auth would need. Since infra changes are rare
(not on every deploy), running these two commands by hand when needed is a fine tradeoff.

Only `deploy.yml` runs unattended in GitHub Actions — it builds/pushes images to GHCR and SSHes into
the VM, neither of which touches an Azure API, so it was never affected by this restriction.

## 0. Check your allowed regions

Azure for Students subscriptions are locked to a small, account-specific set of regions via a
`sys.regionrestriction` policy:

```bash
az policy assignment list --query "[?name=='sys.regionrestriction'].parameters.listOfAllowedLocations.value" -o tsv
```

If the result doesn't include `uksouth` (this repo's default), pick one from your actual list and
swap it in via `-var "location=<region>"` below, or update `variables.tf`'s default. Also check VM
size capacity/quota for your chosen region+size combo before assuming `Standard_D2s_v7` (the current
default) will just work — `germanywestcentral` had zero B-series capacity *and* zero Dsv7-family quota
for this subscription; `uksouth` didn't. If you hit `SkuNotAvailable` or `OperationNotAllowed` quota
errors, list what's actually free:
```bash
az vm list-skus --location <region> --resource-type virtualMachines --all false -o table
```

## 1. Terraform state storage account

Persistent state, separate from the VM itself — needed since Cloud Shell sessions are ephemeral.
`invoiceforgetfstate` must be globally unique across all of Azure; if it's taken, pick another name
and update `storage_account_name` in `versions.tf` to match.

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

**RSA specifically** — Terraform's `admin_ssh_key` argument (`azurerm` provider) rejects ed25519 keys
even though Azure itself supports them.

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/invoiceforge_vm -N ""
cat ~/.ssh/invoiceforge_vm.pub
```
You'll need the public key for `terraform apply` below, and the private key for the GitHub secret
`SSH_PRIVATE_KEY` (used by `deploy.yml` and by `ansible-playbook` in step 4).

## 3. Clone the repo and apply

```bash
git clone https://github.com/EssghaierJacem/InnoviceForge.git
cd InnoviceForge/infra/terraform

terraform init

terraform apply \
  -var "ssh_public_key=$(cat ~/.ssh/invoiceforge_vm.pub)" \
  -parallelism=1
```

`ssh_public_key` is the only flag you actually need to supply — `location`, `vm_size`, and
`allowed_ssh_source_ip` all have working defaults now (`uksouth`, `Standard_D2s_v7`, `*` — SSH is
open to any source because `deploy.yml`'s GitHub Actions runners connect from unpredictable IPs, with
no fixed range to allowlist instead; key-only auth, password login disabled, is the actual mitigation).
Override any of them with `-var "name=value"` if your situation differs.

`-parallelism=1` matters: the azurerm provider has a known eventual-consistency bug where a resource
creates successfully in Azure, then the immediate read-back to populate Terraform state 404s
("Provider produced inconsistent result after apply") — far more likely when multiple resources are
being created concurrently in a brand-new resource group. If you still hit it:
1. Just retry the same `terraform apply` — often transient.
2. If retrying says a resource "already exists" (it really was created, state just doesn't know),
   import it directly using the ID from the error message, then re-apply:
   ```bash
   terraform import -var "ssh_public_key=$(cat ~/.ssh/invoiceforge_vm.pub)" \
     <resource_address_from_the_error> <id_from_the_error>
   ```
3. Repeat as needed — each apply makes real progress even when it errors, you're never starting over.

Note the `public_ip_address` output at the end — that's the VM's IP.

## 4. Provision the VM with Ansible

Still in Cloud Shell, from the repo root:

```bash
cd ../..   # back to repo root

echo "invoiceforge-vm ansible_host=<public_ip_address> ansible_user=invoiceforge ansible_ssh_private_key_file=~/.ssh/invoiceforge_vm ansible_ssh_common_args='-o StrictHostKeyChecking=no'" > /tmp/inventory.ini

ansible-playbook -i /tmp/inventory.ini infra/ansible/provision.yml \
  --extra-vars "image_tag=latest" \
  --extra-vars "postgres_password=<pick one>" \
  --extra-vars "keycloak_admin_password=<pick one>" \
  --extra-vars "keycloak_admin_client_secret=<see keycloak/realm-export.json's backend-admin client 'secret' field — must match exactly>" \
  --extra-vars "gemini_api_key=<your Gemini key>"
```

This installs Docker, deploys the compose files + Caddyfile + realm import (with the VM's IP and
`nip.io` domain already templated into the redirect URIs), and brings up the infra containers
(Postgres, RabbitMQ, Redis, MinIO, Keycloak). The app-service images won't exist in GHCR yet on a
brand-new repo, so those fail to pull on this first run — expected, `deploy.yml` fills them in on the
next push to `main`.

Because this is a genuinely **fresh** Keycloak import (unlike patching an already-running instance),
the `gateway` client's redirect URIs already include the `https://<ip-with-dashes>.nip.io/*` entry
from the template — no manual `kcadm` patch needed here, only ever needed when retrofitting an
instance that already has old data.

## 5. GitHub repo secrets & variables

**Secrets** (Settings > Secrets and variables > Actions > Secrets): `SSH_PRIVATE_KEY` (from step 2).

**Variables** (same page, Variables tab): `AZURE_VM_IP` — the IP from step 3's Terraform output.
`deploy.yml` derives the `nip.io` HTTPS domain from this automatically; no separate domain variable
needed.

## 6. First deploy

Push to `main` (or manually run `deploy.yml` from the Actions tab) so the app images actually get
built and pushed, then in each of the 5 GHCR packages (repo's Packages tab), Package settings >
Change visibility > Public — done once per package so the VM can pull without credentials.

Once that finishes, `https://<ip-with-dashes>.nip.io` (e.g. `51-11-159-171.nip.io` for `51.11.159.171`)
should be live with real HTTPS via Caddy + Let's Encrypt — login, signup, and anonymous upload should
all work with no further manual steps.

## Re-provisioning later

If you change `infra/terraform/*.tf` or `infra/ansible/provision.yml`, repeat steps 3-4 from Cloud
Shell (or your own machine with `az`/`terraform`/`ansible` installed and `az login` run). Routine app
deploys (code changes) never need this — they go through `deploy.yml` automatically.

Before running `terraform apply` again against an **existing** deployment (not a fresh resource
group), double check `variables.tf`'s defaults still match what's actually live — `vm_size` in
particular, since a mismatched default there means Terraform will try to resize/recreate the running
VM. Update the defaults if you've changed something out-of-band (e.g. switched size due to a capacity
error) so they don't drift from reality.
