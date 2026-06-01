# Gunakan base image Node.js LTS berbasis Alpine Linux yang sangat ringan
FROM node:20-alpine

# Set zona waktu default ke Asia/Jakarta (dapat disesuaikan)
RUN apk add --no-cache tzdata
ENV TZ=Asia/Jakarta

# Tetapkan direktori kerja aplikasi di dalam container
WORKDIR /app

# Salin manifest dependensi terlebih dahulu untuk memanfaatkan caching Docker layer
COPY package.json pnpm-lock.yaml* tsconfig.json ./

# Install pnpm secara global dan install dependensi aplikasi
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Salin seluruh kode proyek ke dalam direktori kerja container
COPY . .

# Pastikan folder auth_session ada
RUN mkdir -p auth_session

# Ekspos port Express Web Dashboard (sesuai port di index.ts)
EXPOSE 3001

# Jalankan bot WhatsApp menggunakan perintah start pnpm
CMD ["pnpm", "start"]
