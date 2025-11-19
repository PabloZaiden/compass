# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY Compass/Compass.csproj Compass/
RUN dotnet restore Compass/Compass.csproj

COPY Compass/. ./Compass/
RUN dotnet publish Compass/Compass.csproj -c ${BUILD_CONFIGURATION} -o /app/publish

FROM mcr.microsoft.com/dotnet/runtime:9.0 AS final
ARG NODE_VERSION=24
WORKDIR /workspace

COPY --from=build /src/Compass/config ./Compass/config
COPY --from=build /app/publish ./app

RUN apt-get update && apt-get install -y curl git

# install node
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION"

# install github copilot cli
RUN bash -c "source $NVM_DIR/nvm.sh && npm install -g @github/copilot"

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
