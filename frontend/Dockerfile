# Frontend build (Vite + React)
FROM node:20-alpine AS build

WORKDIR /app

# Build-time env vars for Vite (override at build with --build-arg/compose args)
ARG VITE_API_BASE_URL=http://localhost:4000
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GEMINI_MODEL=gemini-2.5-flash

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV VITE_GEMINI_MODEL=${VITE_GEMINI_MODEL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image (nginx serving the static build)
FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
