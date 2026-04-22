# ----------- build stage -----------
FROM node:20-alpine AS build

WORKDIR /app
COPY package.json ./
# Use npm install rather than `npm ci` because we don't ship a lockfile
RUN npm install --no-audit --no-fund --legacy-peer-deps

COPY public ./public
COPY src ./src
# Disable CRA's treat-warnings-as-errors for production builds
ENV CI=false
RUN npm run build

# ----------- runtime stage -----------
FROM nginx:1.27-alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
