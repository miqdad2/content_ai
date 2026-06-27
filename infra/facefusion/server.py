"""Thin HTTP wrapper around FaceFusion's `headless-run` CLI.

FaceFusion 3.6.1 ships only a Gradio UI and a CLI (no built-in REST API), so we
expose a tiny FastAPI service that the backend can call like any other provider:

    POST /swap   (multipart: source + target images) -> swapped image bytes
    GET  /health

`source` is the face to apply; `target` is the base image being modified.
"""

import os
import subprocess
import tempfile

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

app = FastAPI(title="FaceFusion Swap API")

FACEFUSION_DIR = "/facefusion"
# Models download on first use, then face processing runs — both can be slow on CPU.
TIMEOUT_SECONDS = 14 * 60


def _extension(upload: UploadFile, default: str = "jpg") -> str:
    name = upload.filename or ""
    if "." in name:
        return name.rsplit(".", 1)[1].lower()
    mime_map = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
    return mime_map.get(upload.content_type or "", default)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/swap")
async def swap(source: UploadFile = File(...), target: UploadFile = File(...)) -> FileResponse:
    with tempfile.TemporaryDirectory() as work_dir:
        source_path = os.path.join(work_dir, f"source.{_extension(source)}")
        target_ext = _extension(target)
        target_path = os.path.join(work_dir, f"target.{target_ext}")
        output_path = os.path.join(work_dir, f"output.{target_ext}")

        with open(source_path, "wb") as f:
            f.write(await source.read())
        with open(target_path, "wb") as f:
            f.write(await target.read())

        command = [
            "python",
            "facefusion.py",
            "headless-run",
            "--processors",
            "face_swapper",
            "--face-swapper-model",
            "inswapper_128",
            "--execution-providers",
            "cpu",
            "--source-paths",
            source_path,
            "--target-path",
            target_path,
            "--output-path",
            output_path,
        ]

        try:
            result = subprocess.run(
                command,
                cwd=FACEFUSION_DIR,
                capture_output=True,
                text=True,
                timeout=TIMEOUT_SECONDS,
            )
        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=504, detail="Face swap timed out")

        if result.returncode != 0 or not os.path.exists(output_path):
            detail = (result.stderr or result.stdout or "Face swap failed").strip()[-2000:]
            raise HTTPException(status_code=500, detail=detail)

        # Copy out of the temp dir so it survives after the context manager exits.
        persisted = tempfile.NamedTemporaryFile(suffix=f".{target_ext}", delete=False)
        with open(output_path, "rb") as src:
            persisted.write(src.read())
        persisted.close()

    media_type = "image/png" if target_ext == "png" else "image/jpeg"
    return FileResponse(persisted.name, media_type=media_type, filename=f"swap.{target_ext}")
