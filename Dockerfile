# FROM node:alpine AS builder
# RUN npm i -g pnpm
# RUN mkdir -p /src
# COPY . /src/
# WORKDIR /src/packages/gui
# RUN pnpm i --force && npm run build
# WORKDIR /src/packages/service
# RUN pnpm i --force && npm run build

# FROM node:alpine
# RUN mkdir -p /app
# COPY --from=builder /src/packages/service/package.json /app/package.json
# COPY --from=builder /src/packages/service/dist /app/dist
# COPY --from=builder /src/packages/service/node_modules /app/node_modules
# COPY --from=builder /src/packages/service/public /app/public
# COPY --from=builder /src/packages/service/schemas /app/schemas
# WORKDIR /app
# CMD ["node", "./dist/index.js"]

FROM node:8 AS builder
COPY . .
RUN yarn global add @vue/cli
RUN yarn
RUN yarn build
# RUN cd packages/gui && yarn
# RUN cd packages/gui && yarn build
# RUN cd packages/service && yarn
# RUN cd packages/service && yarn build

# RUN npm i -g yarn
# # RUN mkdir -p /src
# # COPY . /src/
# # WORKDIR /src/packages/gui
# RUN npm install
# RUN npm run build
# WORKDIR /src/packages/service
# RUN pnpm i --force && npm run build

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
CMD ["node index.js"]
