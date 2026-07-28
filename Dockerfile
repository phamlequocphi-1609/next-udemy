# Base image
From node:24.14.1-alpine

# Create app directory
WORKDIR /hoidanit/backend-nest

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install --legacy-peer-deps

RUN npm i -g @nestjs/cli@11.0.0

# Bundle app source
COPY . .

#Create a "dist" folder with the production build
RUN npm run build

# Start the server using the production build
CMD ["node", "dist/main.js"]


# tất cả các devDependencies ko được tự động cài đặt , để sử dụng
# keyword nest -> require install cli