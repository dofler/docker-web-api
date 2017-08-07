FROM node:6.10-alpine

ENV PROJECT_PATH /app

RUN mkdir $PROJECT_PATH

WORKDIR $PROJECT_PATH

COPY app .

RUN npm install # Install dev dependencies so that we can run gulp

RUN ./node_modules/.bin/gulp build # Run tests and linting

RUN rm -rf node_modules # Clear out node_modules

RUN npm install --production # Only install the production dependencies

EXPOSE 8080

CMD ["node", "./index.js"]
