FROM node:13

ADD . /celostats-server
WORKDIR /celostats-server

ENV NODE_ENV=production

RUN npm install
RUN npm install -g grunt-cli typescript
RUN grunt --configPath="src/client/js/celoConfig.js"
RUN npm run compile:server
RUN rm -rf ./src

EXPOSE 3000
CMD ["npm", "start"]

