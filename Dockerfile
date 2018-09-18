FROM node:8 AS builder
COPY . .
RUN npm i -g add @vue/cli
RUN npm
RUN npm run build

FROM node:8
RUN mkdir -p /app
COPY --from=builder ./packages/service/package.json /app/package.json
COPY --from=builder ./packages/service/dist /app/dist
COPY --from=builder ./packages/service/node_modules /app/node_modules
COPY --from=builder ./packages/service/public /app/public
COPY --from=builder ./packages/service/schemas /app/schemas
COPY --from=builder ./packages/service/swagger.json /app
COPY --from=builder ./packages/service/swagger.json /app/dist
WORKDIR /app
CMD ["node dist/index.js"]
