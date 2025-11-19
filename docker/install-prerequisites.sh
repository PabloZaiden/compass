#!/usr/bin/env bash

set -e

NODE_VERSION=${1:-24}

# install from apt prerequisites
apt-get update && apt-get install -y curl git

# install nvm and node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source /root/.nvm/nvm.sh
nvm install $NODE_VERSION

# install github copilot cli
npm install -g @github/copilot

# install openai codex cli
npm install -g @openai/codex