import asyncio
import base64
import os
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Marker PDF Converter", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConvertResponse(BaseModel):
    markdown: str
    images: list[dict[str, str]]
    metadata: dict[str, str | int | list[str]]


class HealthResponse(BaseModel):
    status: str
    version: str


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", version="1.0.0")


@app.post("/convert", response_model=ConvertResponse)
async def convert_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    with tempfile.TemporaryDirectory() as tmpdir:
        pdf_path = os.path.join(tmpdir, file.filename or "input.pdf")
        content = await file.read()
        with open(pdf_path, "wb") as f:
            f.write(content)

        try:
            markdown, images = await run_marker(pdf_path, tmpdir)
        except Exception as e:
            raise HTTPException(502, f"Marker conversion failed: {e}")

    return ConvertResponse(
        markdown=markdown,
        images=images,
        metadata={
            "pages": len(images) if images else 0,
            "languages": ["English"],
            "source": file.filename,
        },
    )


async def run_marker(pdf_path: str, tmpdir: str) -> tuple[str, list[dict[str, str]]]:
    output_dir = os.path.join(tmpdir, "output")
    os.makedirs(output_dir, exist_ok=True)

    proc = await asyncio.create_subprocess_exec(
        "marker_single",
        pdf_path,
        output_dir,
        "--langs", "English",
        "--batch_multiplier", "2",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()

    if proc.returncode != 0:
        err_msg = stderr.decode().strip() if stderr else "Unknown error"
        if "not found" in err_msg.lower() or "No such file" in err_msg:
            raise RuntimeError(
                "marker_single command not found. Ensure marker-pdf is installed."
            )
        raise RuntimeError(err_msg)

    md_files = list(Path(output_dir).rglob("*.md"))
    if not md_files:
        raise RuntimeError("No markdown output produced by marker")

    md_content = md_files[0].read_text(encoding="utf-8")

    images_dir = Path(output_dir) / "images"
    images: list[dict[str, str]] = []
    if images_dir.exists():
        for img_path in sorted(images_dir.iterdir()):
            if img_path.suffix.lower() in (".png", ".jpg", ".jpeg", ".gif", ".webp"):
                img_data = base64.b64encode(img_path.read_bytes()).decode("utf-8")
                ext = img_path.suffix[1:]
                images.append(
                    {
                        "filename": f"images/{img_path.name}",
                        "data": f"data:image/{ext};base64,{img_data}",
                    }
                )

    return md_content, images
