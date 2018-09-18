FROM node:alpine AS builder
RUN npm i -g pnpm
RUN npm i -g yarn
RUN mkdir -p /src
COPY . /src/
WORKDIR /src/packages/gui
RUN yarn && yarn build
WORKDIR /src/packages/service
RUN pnpm i --force && npm run build

FROM node:alpine
RUN mkdir -p /app
COPY --from=builder /src/packages/service/package.json /app/package.json
COPY --from=builder /src/packages/service/dist /app/dist
COPY --from=builder /src/packages/service/node_modules /app/node_modules
COPY --from=builder /src/packages/service/public /app/public
COPY --from=builder /src/packages/service/schemas /app/schemas
WORKDIR /app
CMD ["node", "./dist/index.js"]
