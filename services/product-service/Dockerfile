FROM node:22-alpine
WORKDIR /app
RUN corepack enable
COPY package.json ./
RUN pnpm install --no-frozen-lockfile
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN pnpm db:generate && pnpm build
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/server.js"]
