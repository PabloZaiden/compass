# syntax=docker/dockerfile:1

ARG BASE_IMAGE=ghcr.io/pablozaiden/compass-base:latest
FROM ${BASE_IMAGE} AS base
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

# tests & build
ENV NODE_ENV=production
RUN bun test
RUN bun build --compile --outfile=compass ./src/index.ts

# copy compiled binary into final image
FROM base AS release

COPY --from=prerelease /usr/src/app/compass .

# run the app
ENTRYPOINT ["./compass"]
