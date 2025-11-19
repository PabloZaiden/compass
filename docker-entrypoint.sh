#!/usr/bin/env bash
set -e

source $NVM_DIR/nvm.sh
dotnet /workspace/app/Compass.dll "$@"
