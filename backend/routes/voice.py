import tempfile
import logging
from pathlib import Path
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/voice", tags=["voice"])

# Lazy-loaded model — downloaded once on first use (~150 MB for "base")
_model = None

def _get_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        log.info("Loading Whisper base model (first-time download ~150 MB)…")
        # device="cpu", compute_type="int8" works on every Mac without a GPU
        _model = WhisperModel("base", device="cpu", compute_type="int8")
        log.info("Whisper model ready.")
    return _model


@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Receive a WebM/WAV audio blob and return the transcribed text."""
    try:
        # Write the uploaded audio to a temp file
        suffix = ".webm" if "webm" in (audio.content_type or "") else ".wav"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(await audio.read())
            tmp_path = tmp.name

        model = _get_model()
        segments, _info = model.transcribe(tmp_path, beam_size=5, language="en")
        text = " ".join(seg.text.strip() for seg in segments).strip()

        Path(tmp_path).unlink(missing_ok=True)
        return {"text": text}

    except Exception as e:
        log.exception("Transcription failed")
        return JSONResponse(status_code=500, content={"error": str(e), "text": ""})
