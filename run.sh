#!/bin/bash

# Ensure the script is executable
chmod +x run.sh

# Change directory to contracts or exit if it fails
cd contracts/ || exit

# Fund on L2
echo
echo "→ Funding L2 Contracts..."
node script/fundL2.js > deploy.log
printf "\033[0;32m ✓ (1/4) Contracts Funded\033[0m\n"

# Deploy Contracts on L2
echo
echo "→ Deploying L2 Contracts..."
forge script scripts/deterministic-deploy.s.sol:DeployExample broadcast rpc-url http://localhost:9545 > deploy.log 2>&1
printf "\033[0;32m ✓ (2/4) Contracts Deployed\033[0m\n"

# Grab Contracts and parse into ENV file
echo
echo "→ Parsing logs..."
node script/parseEnvironment.js
printf "\033[0;32m ✓ (3/4) Contracts addresses parsed into .env\033[0m\n"

# Final step, deploy the rundler
echo
echo "→ Deploying Rundler..."
docker-compose up
printf "\033[0;32m ✓ (4/4) (TODO) Rundler deployed\033[0m\n"

echo
