FROM node:14

WORKDIR /home/app

ADD . .

RUN npm install


