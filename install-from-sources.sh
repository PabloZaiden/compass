#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Compass - Install from Sources${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "${RED}⚠️  WARNING: You are building from the main branch!${NC}"
echo -e "${RED}   This is a development build and may contain:${NC}"
echo -e "${RED}   - Unstable or untested features${NC}"
echo -e "${RED}   - Breaking changes${NC}"
echo -e "${RED}   - Bugs not present in official releases${NC}"
echo ""
echo -e "${YELLOW}   For production use, consider installing a stable release:${NC}"
echo -e "${YELLOW}   curl -fsSL -H \"Authorization: token \$(gh auth token)\" https://raw.githubusercontent.com/pablozaiden/compass/main/install.sh | bash${NC}"
echo ""
echo -e "${YELLOW}   Note: This installation will overwrite any existing 'compass' binary${NC}"
echo -e "${YELLOW}   in your bun global bin directory. To remove it later, run:${NC}"
echo -e "${YELLOW}   rm \"\$(bun pm bin -g)/compass\"${NC}"
echo ""

# Ask for confirmation
read -p "Do you want to continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Installation cancelled.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Starting installation...${NC}"

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${RED}Error: Bun is not installed.${NC}"
    echo "Please install Bun from: https://bun.sh/"
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git is not installed.${NC}"
    echo "Please install Git from: https://git-scm.com/"
    exit 1
fi

# Create temp directory
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Cloning repository to $TEMP_DIR...${NC}"

# Clone the repository
git clone --depth 1 https://github.com/pablozaiden/compass.git "$TEMP_DIR/compass"

# Change to the cloned directory
cd "$TEMP_DIR/compass"

echo -e "${YELLOW}Building compass from sources...${NC}"

# Run bun compile (using the compile script from package.json)
bun run compile

# Get bun global bin directory
BUN_BIN_DIR=$(bun pm bin -g)

# Create the bin directory if it doesn't exist
mkdir -p "$BUN_BIN_DIR"

echo -e "${YELLOW}Installing compass to $BUN_BIN_DIR...${NC}"

# Copy the compiled binary
cp out/compass "$BUN_BIN_DIR/compass"
chmod +x "$BUN_BIN_DIR/compass"

echo -e "${YELLOW}Cleaning up...${NC}"

# Clean up: go back and remove temp directory
cd /
rm -rf "$TEMP_DIR"

echo ""
echo -e "${GREEN}✓ Compass installed successfully from sources!${NC}"
echo -e "Binary location: ${YELLOW}$BUN_BIN_DIR/compass${NC}"
echo ""
echo -e "Run ${YELLOW}compass${NC} to get started."
echo ""
echo -e "${YELLOW}To uninstall this build, run:${NC}"
echo -e "  rm \"$BUN_BIN_DIR/compass\""
