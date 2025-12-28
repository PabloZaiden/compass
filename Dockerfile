# syntax=docker/dockerfile:1

FROM oven/bun:1 AS build
WORKDIR /src

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

COPY src ./src
COPY tsconfig.json ./
RUN bun build src/index.ts --compile --outfile compass

FROM debian:bookworm-slim AS final
WORKDIR /workspace

COPY --from=build /src/compass ./compass
COPY Compass/config ./Compass/config
COPY docker/install-prerequisites.sh ./install-prerequisites.sh

RUN apt-get update && apt-get install -y curl git sudo && rm -rf /var/lib/apt/lists/*

RUN bash ./install-prerequisites.sh
ENV NVM_DIR=/root/.nvm

COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
