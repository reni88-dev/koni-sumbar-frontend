# build stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Set build arguments for environment variables
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build application with increased memory limit
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# production stage
FROM nginx:stable-alpine as production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# production stage
# FROM nginx:stable as production
# COPY --from=build /app/dist /usr/share/nginx/html
# COPY ./dockerizer/nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]