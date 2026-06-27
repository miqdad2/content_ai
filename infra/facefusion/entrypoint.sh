#!/bin/sh
# Pre-pull the FaceFusion models once, then start the swap API.
#
# FaceFusion normally downloads models lazily on the first run, which makes the
# first face swap very slow. We instead pre-download them at container startup
# into /facefusion/.assets, which is a named docker volume — so the download
# happens once and persists across restarts (the marker file makes restarts a
# no-op).
#
# FaceFusion has no per-model download flag; `force-download` only supports a
# `lite` / `full` scope. `lite` is the minimal set and includes the face
# swapper, so that's what we pull.
set -e

ASSETS_DIR="/facefusion/.assets"
MARKER="${ASSETS_DIR}/.models-downloaded"

if [ -f "${MARKER}" ]; then
  echo "[facefusion] Models already present in ${ASSETS_DIR}; skipping download."
else
  echo "[facefusion] Pre-downloading models (lite scope) — runs once, persisted in the .assets volume…"
  if python facefusion.py force-download --download-scope lite; then
    touch "${MARKER}"
    echo "[facefusion] Model download complete."
  else
    echo "[facefusion] WARNING: pre-download failed; models will download lazily on first swap." >&2
  fi
fi

echo "[facefusion] Starting swap API on :7865"
exec uvicorn server:app --host 0.0.0.0 --port 7865 --app-dir /facefusion
