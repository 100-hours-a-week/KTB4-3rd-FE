#!/usr/bin/env bash
set -Eeuo pipefail

release_image_ref="$IMAGE_REF"
release_id="$RELEASE_ID"

deploy_env_file="/etc/moyeota/frontend-deploy.env"

set -a
# shellcheck disable=SC1090
source "$deploy_env_file"
set +a

# 배포마다 바뀌는 값은 EC2 고정 환경설정보다 Runner가 전달한 값을 우선한다.
IMAGE_REF="$release_image_ref"
RELEASE_ID="$release_id"
export IMAGE_REF RELEASE_ID

cd "$DEPLOY_PATH"
mkdir -p .deploy

current_env=".deploy/frontend.env"
previous_env=".deploy/frontend.previous.env"

if [[ -f "$current_env" ]]; then
  cp "$current_env" "$previous_env"
fi

printf 'FRONTEND_IMAGE_REF=%s\nRELEASE_ID=%s\n' \
  "$IMAGE_REF" "$RELEASE_ID" > "$current_env"

load_release() {
  set -a
  # shellcheck disable=SC1090
  source "$1"
  set +a
}

rollback() {
  exit_code=$?

  if [[ "$exit_code" -ne 0 && -f "$previous_env" ]]; then
    cp "$previous_env" "$current_env"
    load_release "$current_env"
    docker compose --env-file .env pull "$APP_SERVICE" || true
    docker compose --env-file .env up -d --no-deps --force-recreate "$APP_SERVICE" || true
  fi

  rm -f "$previous_env"
  exit "$exit_code"
}

trap rollback EXIT

aws ecr get-login-password --region "$AWS_REGION" |
  docker login --username AWS --password-stdin "$ECR_REGISTRY"

load_release "$current_env"
docker compose --env-file .env pull "$APP_SERVICE"
docker compose --env-file .env up -d --no-deps --force-recreate "$APP_SERVICE"

for attempt in $(seq 1 60); do
  if curl --fail --silent --show-error "$HEALTHCHECK_URL" > /dev/null; then
    break
  fi

  if [[ "$attempt" -eq 60 ]]; then
    exit 1
  fi

  sleep 2
done

curl --fail --silent --show-error "$SMOKE_TEST_URL" > /dev/null

trap - EXIT
rm -f "$previous_env"
echo "Frontend deployment succeeded: $RELEASE_ID"
