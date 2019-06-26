FROM node:11

WORKDIR /usr/src/app
COPY package*.json ./

# Installing packages for production only
RUN npm install --production

# Second Stage
FROM node:11-alpine
# Bundle app source
COPY . .

EXPOSE 8080
USER node
CMD ["node","index.js"]
