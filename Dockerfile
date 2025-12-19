FROM node:18-alpine

WORKDIR /app

COPY . .

EXPOSE 90

CMD ["node", "server.js"]

