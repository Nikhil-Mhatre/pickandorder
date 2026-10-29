# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Base image
# ---------------------------------------------------------------------------
# Use the same OS and Node version in build and runtime to reduce native-module
# compatibility issues. Prisma needs OpenSSL; TLS connections also need trusted
# root certificates. For production releases, pin this image to a tested digest.
FROM node:22-bookworm-slim AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       openssl \
       ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app


# ---------------------------------------------------------------------------
# Build stage
# ---------------------------------------------------------------------------
# This stage contains development dependencies, TypeScript, and the Prisma CLI.
# None of the build-stage filesystem is copied wholesale into the runtime image.
FROM base AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

# Corepack uses the pnpm version declared in the repository's packageManager
# field when one is present. Keep that version committed and consistent in CI.
RUN corepack enable

# Copy the monorepo. Make sure the repository-root .dockerignore excludes local
# node_modules, dist output, .git, .env files, and local certificates.
COPY . .

# Use a BuildKit cache for pnpm's package store. This speeds up subsequent builds
# without adding the package cache to the final image.
RUN --mount=type=cache,id=pickandorder-pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store

# Generate Prisma Client in the workspace so the TypeScript build can resolve it.
# Then compile the Product Service.
RUN pnpm --filter @pickandorder/product-service exec prisma generate \
    && pnpm --filter @pickandorder/product-service build

# Create a deployable package containing this service and production dependencies,
# instead of copying the entire monorepo into the runtime image.
RUN pnpm deploy \
    --filter=@pickandorder/product-service \
    --prod \
    /out/product-service

# Generate Prisma Client for the isolated deployment. The Prisma CLI is taken from
# the build workspace because `pnpm deploy --prod` omits the Prisma CLI devDependency.
# Keep this step unless you validate a different approach with a clean build and
# runtime database tests; the generated client must exist in the deployed package.
RUN cd /out/product-service \
    && node /app/services/product-service/node_modules/prisma/build/index.js generate \
       --schema=prisma/schema.prisma


# ---------------------------------------------------------------------------
# Runtime stage
# ---------------------------------------------------------------------------
# Start from the small shared base and copy only the isolated production package.
# The runtime image does not contain the monorepo, TypeScript compiler, or Prisma CLI.
FROM base AS runtime

ENV NODE_ENV=production \
    PORT=3001

WORKDIR /app/services/product-service

# Copy only the deployed service, production dependencies, and generated client.
# Set ownership so the application can read its files as the non-root user.
COPY --from=build --chown=node:node /out/product-service/ ./

# Compose mounts the Aiven CA certificate here at runtime. Create the mount point,
# but do not bake the certificate or any application secrets into the image.
RUN mkdir -p /app/services/product-service/certs \
    && chown node:node /app/services/product-service/certs

# Drop root privileges before starting the application.
USER node

# Documents the port used by the application; Compose still needs to publish it.
EXPOSE 3001

# Let Node receive container termination signals for graceful shutdown.
STOPSIGNAL SIGTERM

CMD ["node", "dist/server.js"]
