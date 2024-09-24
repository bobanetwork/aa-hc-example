FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY tsconfig.json ./
COPY src ./src
EXPOSE ${OC_LISTEN_PORT:-1234}
CMD ["npm", "start"]