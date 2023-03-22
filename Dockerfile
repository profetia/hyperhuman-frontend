FROM node:18 AS builder

WORKDIR /app

COPY package.json ./

RUN yarn install
RUN yarn add serve

COPY . ./

RUN yarn run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist .

ENTRYPOINT [ "serve", "-s", "build" ]
