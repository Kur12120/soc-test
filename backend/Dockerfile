FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx tsc --outDir dist --skipLibCheck --noEmitOnError false
EXPOSE 3000
CMD ["sh", "-c", "npx ts-node --transpile-only src/db/seed.ts --init && npx ts-node --transpile-only src/db/seed.ts && node dist/index.js"]