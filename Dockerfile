FROM node:20-alpine

RUN apk add --no-cache git &&\
    apk upgrade --no-cache

ADD . /celostats-server
WORKDIR /celostats-server

ENV NODE_ENV=production

# rehydrate git
RUN git init

RUN yarn
RUN yarn global add grunt-cli typescript
RUN grunt --configPath="src/client/js/celoConfig.js"
RUN yarn compile:server
RUN rm -rf ./src

EXPOSE 3000
CMD ["yarn", "start"]

