from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF
import os
import uuid

app = FastAPI(title="PDF Hub Backend")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("temp", exist_ok=True)

@app.post("/compress")
async def compress_pdf(file: UploadFile = File(...), level: str = Form("Cơ bản")):
    file_id = str(uuid.uuid4())
    input_path = f"temp/in_{file_id}.pdf"
    output_path = f"temp/out_{file_id}.pdf"
    
    # Save uploaded file
    with open(input_path, "wb") as f:
        f.write(await file.read())
    
    try:
        # Open PDF
        doc = fitz.open(input_path)
        
        # Advanced compression settings using PyMuPDF
        # garbage=4: removes unused objects, duplicate objects, etc.
        # deflate=True: compresses streams
        # deflate_images=True: compresses images
        # linear=True: optimizes for fast web view
        
        kwargs = {
            "garbage": 4,
            "deflate": True,
            "deflate_images": True,
            "linear": True,
            "clean": True,
        }
        
        # If strong compression is requested, we can also reduce image quality
        if "Mạnh" in level:
            # PyMuPDF doesn't natively downsample images in save(), 
            # but we can apply stronger garbage collection
            pass 
        
        doc.save(output_path, **kwargs)
        doc.close()
        
        return FileResponse(
            output_path, 
            media_type="application/pdf", 
            filename=f"compressed_{file.filename}"
        )
    finally:
        # Cleanup input
        if os.path.exists(input_path):
            os.remove(input_path)
