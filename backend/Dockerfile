FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .
EXPOSE ${OC_LISTEN_PORT:-1234}
CMD ["npm", "start"]