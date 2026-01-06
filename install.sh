#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Installing @pablozaiden/compass...${NC}"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if gh is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI is not authenticated.${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

# Get GitHub token
GH_TOKEN=$(gh auth token)

if [ -z "$GH_TOKEN" ]; then
    echo -e "${RED}Error: Could not retrieve GitHub token.${NC}"
    exit 1
fi

# Determine package manager
if command -v bun &> /dev/null; then
    PKG_MANAGER="bun"
    echo -e "${YELLOW}Using Bun as package manager...${NC}"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    echo -e "${YELLOW}Using npm as package manager...${NC}"
else
    echo -e "${RED}Error: Neither Bun nor npm is installed.${NC}"
    echo "Please install one of the following:"
    echo "  - Bun: https://bun.sh/"
    echo "  - Node.js/npm: https://nodejs.org/"
    exit 1
fi

echo -e "${YELLOW}Removing old version (if installed)...${NC}"

# Try to uninstall any existing version first (ignore errors)
$PKG_MANAGER uninstall -g @pablozaiden/compass 2>/dev/null || true

echo -e "${YELLOW}Installing package...${NC}"

NPM_CONFIG_TOKEN="$GH_TOKEN" $PKG_MANAGER install -g @pablozaiden/compass --registry=https://npm.pkg.github.com/

echo -e "${GREEN}✓ @pablozaiden/compass installed successfully!${NC}"
echo -e "Run ${YELLOW}compass${NC} to get started."
