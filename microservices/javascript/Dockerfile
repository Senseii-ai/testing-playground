# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory in the Docker image
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into the image
COPY package*.json ./

# Install the application's dependencies inside the Docker image
RUN yarn

# Copy the rest of the application's code into the image
COPY . .

# Expose port 9090 to the outside world
EXPOSE 9090

# Start the application
CMD [ "node", "index.js" ]