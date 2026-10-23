# ==========================================
# Stage 1: Build React + Vite Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
# Build production bundle
RUN npm run build

# ==========================================
# Stage 2: Python Backend with Playwright & Static Files
# ==========================================
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for Playwright headless Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libwayland-client0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    libxshmfence1 \
    xvfb \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browser
RUN playwright install chromium

# Copy backend application
COPY backend/ ./

# Copy built frontend assets from stage 1 into dist/
COPY --from=frontend-builder /app/frontend/dist ./dist

# Create screenshots directory
RUN mkdir -p screenshots

# Environment defaults
ENV PORT=10000
ENV PYTHONUNBUFFERED=1

EXPOSE 10000

# Start Uvicorn listening dynamically on Render's $PORT
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]
