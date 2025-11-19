# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY Compass/Compass.csproj Compass/
RUN dotnet restore Compass/Compass.csproj

COPY Compass/. ./Compass/
RUN dotnet publish Compass/Compass.csproj -c ${BUILD_CONFIGURATION} -o /app/publish

FROM mcr.microsoft.com/dotnet/runtime:9.0 AS final
WORKDIR /workspace

COPY --from=build /src/Compass/config ./Compass/config
COPY --from=build /app/publish ./app
COPY docker/install-prerequisites.sh ./install-prerequisites.sh

RUN bash ./install-prerequisites.sh
ENV NVM_DIR=/root/.nvm

COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
