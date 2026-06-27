FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx tsc --outDir dist --skipLibCheck --noEmitOnError false
EXPOSE 3000
CMD ["node", "dist/index.js"]
