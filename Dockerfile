# The service and GUI are running in one docker container (overkill to create two containers)


FROM node:8 AS builder
ARG VUE_APP_PATH
ENV VUE_APP_PATH ${VUE_APP_PATH}
# Allow to run as root
ENV	NPM_CONFIG_UNSAFE_PERM=true
WORKDIR /build_app/
COPY package*.json /build_app/
RUN npm i -g add @vue/cli
COPY . /build_app/
RUN npm i
RUN npm run build
CMD [ "/bin/bash" ]

FROM node:8

RUN mkdir -p /app
RUN apt-get update && apt-get install dos2unix
# install simple http server for serving static content
RUN npm install -g http-server
RUN apt-get update && apt-get install -y dos2unix

WORKDIR /app
COPY docker-entrypoint.sh /app/
COPY --from=builder /build_app/packages/service/package.json /app/package.json
COPY --from=builder /build_app/packages/service/dist /app/dist
COPY --from=builder /build_app/packages/service/node_modules /app/node_modules
COPY --from=builder /build_app/packages/service/public /app/public
COPY --from=builder /build_app/packages/service/schemas /app/schemas
COPY --from=builder /build_app/packages/service/swagger.json /app
COPY --from=builder /build_app/packages/service/swagger.json /app/dist
RUN dos2unix /app/docker-entrypoint.sh&& chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
# CMD [ "--help" ]
#CMD [ "" ]