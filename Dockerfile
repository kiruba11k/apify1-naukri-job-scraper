FROM apify/actor-node:20

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --quiet --only=prod

COPY . ./

CMD ["npm", "start"]
