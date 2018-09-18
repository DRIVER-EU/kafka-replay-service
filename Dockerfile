FROM node:8 AS builder
# RUN npm i -g pnpm
COPY . .
RUN yarn global add @vue/cli
RUN yarn global add -g
RUN yarn
RUN yarn build

# RUN npm i -g yarn
# # RUN mkdir -p /src
# # COPY . /src/
# # WORKDIR /src/packages/gui
# RUN npm install
# RUN npm run build
# WORKDIR /src/packages/service
# RUN pnpm i --force && npm run build

FROM node:8-alpine
RUN mkdir -p /app
COPY --from=builder ./packages/service/package.json /app/package.json
COPY --from=builder ./packages/service/dist /app/dist
COPY --from=builder ./packages/service/node_modules /app/node_modules
COPY --from=builder ./packages/service/public /app/public
COPY --from=builder ./packages/service/schemas /app/schemas
COPY --from=builder ./packages/gui/dist /gui/dist
WORKDIR /app
CMD ["node"]
