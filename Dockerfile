FROM node:13

ADD . /celostats-server
WORKDIR /celostats-server

ENV NODE_ENV=production

RUN yarn
RUN yarn global add typescript
RUN yarn run build
RUN rm -rf ./src

EXPOSE 3000
CMD ["yarn", "start"]

