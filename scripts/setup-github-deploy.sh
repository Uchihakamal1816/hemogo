#!/usr/bin/env bash
# One-time setup, run once in Google Cloud Shell by a project owner.
# Lets only the main branch of this GitHub repository deploy, with no stored password.
set -euo pipefail

PROJECT_ID=hemogo-emergency
PROJECT_NUMBER=178128292194
# The numeric ID cannot be re-claimed if the repository is ever renamed or deleted.
REPO_ID=1333348394
POOL=github
PROVIDER=hemogo-repo
DEPLOYER=github-deployer
DEPLOYER_EMAIL="$DEPLOYER@$PROJECT_ID.iam.gserviceaccount.com"
POOL_NAME="projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL"

gcloud config set project "$PROJECT_ID"

gcloud services enable iamcredentials.googleapis.com sts.googleapis.com iam.googleapis.com \
  cloudresourcemanager.googleapis.com cloudbilling.googleapis.com cloudscheduler.googleapis.com \
  firebaseextensions.googleapis.com firebasehosting.googleapis.com firebaserules.googleapis.com

gcloud iam service-accounts describe "$DEPLOYER_EMAIL" >/dev/null 2>&1 ||
  gcloud iam service-accounts create "$DEPLOYER" --display-name="GitHub deployer"

gcloud iam workload-identity-pools describe "$POOL" --location=global >/dev/null 2>&1 ||
  gcloud iam workload-identity-pools create "$POOL" --location=global --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers describe "$PROVIDER" --location=global \
  --workload-identity-pool="$POOL" >/dev/null 2>&1 ||
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" --location=global \
    --workload-identity-pool="$POOL" \
    --display-name="HemoGo repository" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository_id=assertion.repository_id,attribute.ref=assertion.ref" \
    --attribute-condition="assertion.repository_id == '$REPO_ID' && assertion.ref == 'refs/heads/main'"

gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_EMAIL" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/$POOL_NAME/attribute.repository_id/$REPO_ID" \
  --condition=None >/dev/null

for role in \
  roles/firebase.developAdmin \
  roles/cloudfunctions.admin \
  roles/run.admin \
  roles/cloudscheduler.admin \
  roles/artifactregistry.admin \
  roles/secretmanager.viewer \
  roles/serviceusage.serviceUsageConsumer \
  roles/firebaseextensions.viewer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$DEPLOYER_EMAIL" --role="$role" --condition=None >/dev/null
  echo "Granted $role"
done

# Deploying functions means running them as the default runtime account, and nothing broader.
gcloud iam service-accounts add-iam-policy-binding "$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --member="serviceAccount:$DEPLOYER_EMAIL" --role=roles/iam.serviceAccountUser --condition=None >/dev/null

echo "Setup complete. Changes can take up to 5 minutes to apply."
