#!/usr/bin/env bash

set -e

NODE_VERSION=${1:-24}

# install nvm and node
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
	# ensure nvm function is available in this shell
	# shellcheck disable=SC1090
	source "$NVM_DIR/nvm.sh"
fi

if ! command -v nvm >/dev/null 2>&1; then
	echo "installing nvm"
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
	# shellcheck disable=SC1090
	source "$NVM_DIR/nvm.sh"
	if ! grep -q "source \$NVM_DIR/nvm.sh" "$HOME/.bashrc" 2>/dev/null; then
		echo "source \$NVM_DIR/nvm.sh" >> "$HOME/.bashrc"
	fi
else
	echo "nvm already installed"
fi

nvm install $NODE_VERSION

# install github copilot cli
npm install -g @github/copilot

# install openai codex cli
npm install -g @openai/codex

# install claude code
curl -fsSL https://claude.ai/install.sh | bash

# install az cli
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# install opencode
curl -fsSL https://opencode.ai/install | bash
