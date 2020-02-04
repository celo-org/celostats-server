FROM node:13

ADD . /celostats-server
WORKDIR /celostats-server

ENV NODE_ENV=production

RUN yarn
RUN yarn global add grunt-cli typescript
RUN grunt --configPath="src/client/js/celoConfig.js"
RUN yarn compile:server
RUN rm -rf ./src

EXPOSE 3000
CMD ["yarn", "start"]

