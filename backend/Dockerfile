FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx tsc --outDir dist --skipLibCheck --noEmitOnError false

RUN chmod +x start-prod.sh

EXPOSE 3000

CMD ["sh", "start-prod.sh"]