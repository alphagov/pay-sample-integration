FROM node:0.12.7

ENV PORT 8080

ADD . /app
WORKDIR /app
RUN npm install --production
CMD npm start
