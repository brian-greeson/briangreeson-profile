FROM node:25-alpine AS build
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# COPY src/views ./views
RUN npm run build

FROM node:25-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY  .env ./.env
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# COPY --from=build /app/views ./views

EXPOSE 3000
CMD ["node", "dist/server.js"]
