FROM node:22-alpine AS build
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

ARG VITE_API_BASE_URL
ARG VITE_KEYCLOAK_ISSUER
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_KEYCLOAK_ISSUER=${VITE_KEYCLOAK_ISSUER}

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html
EXPOSE 80
