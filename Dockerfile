FROM node:13

ADD . /celostats-server
WORKDIR /celostats-server

ENV NODE_ENV=production

RUN npm install
RUN npm install -g typescript
RUN npm run build
RUN rm -rf ./src

EXPOSE 3000
CMD ["npm", "start"]

