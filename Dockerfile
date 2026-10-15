FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    tesseract-ocr \
    tesseract-ocr-vie \
    tesseract-ocr-eng \
    fonts-noto \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/main.py ./main.py
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
