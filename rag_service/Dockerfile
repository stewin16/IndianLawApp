# Use a slim Python image for smaller size
FROM python:3.9-slim

# Install system dependencies for Tesseract, Poppler, and OpenCV
# libgl1 and libglib2.0-0 are needed for many ML libraries
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-hin \
    poppler-utils \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the Sentence Transformer model during build
# This saves time on startup and ensures the model is baked into the image
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy the application code
COPY . .

# Copy the pre-populated database if it exists
# (Assuming it's in chroma_db/ as per our check)
# If you ignore this in .dockerignore, it won't be copied.

# Port is dynamic on Render
ENV PORT=10000
EXPOSE 10000

# Run the application using uvicorn
CMD ["python", "main.py"]
