FROM node:18.20.4-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install -g typescript@5.4.5 && npm install

COPY frontend/ ./
RUN npm run build

FROM python:3.10-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

COPY backend/ ./
RUN mkdir -p ./static

COPY --from=frontend-builder /app/frontend/dist /app/backend/static

EXPOSE 5000

CMD ["python3", "main.py"]
