FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8080
ENV TERRAPULSE_DEMO_MODE=true

CMD exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
