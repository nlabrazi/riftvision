# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:20-bullseye-slim

FROM ${NODE_IMAGE} AS base
WORKDIR /app

# deps
COPY package*.json ./
RUN npm ci

# code
COPY . .

FROM base AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

FROM base AS build
ENV NODE_ENV=production
RUN npm run build

FROM ${NODE_IMAGE} AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
