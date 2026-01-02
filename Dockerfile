# syntax=docker/dockerfile:1

FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# [optional] tests & build
ENV NODE_ENV=production
RUN bun build --compile --outfile=compass ./src/index.ts
# copy production dependencies and source code into final image
FROM base AS release

RUN apt-get update && apt-get install -y curl git sudo

# install az cli here, since it requires sudo permissions
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

COPY docker/install-prerequisites.sh ./install-prerequisites.sh

USER bun
RUN bash ./install-prerequisites.sh

USER root
RUN rm ./install-prerequisites.sh

USER bun

ENV PATH="/home/bun/.local/bin:/home/bun/.bun/bin:/home/bun/.bun/global/bin:${PATH}"

COPY --from=prerelease /usr/src/app/compass .

# run the app
ENTRYPOINT ["./compass"]