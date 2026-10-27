"""
RentHub AI Microservice - FastAPI Web Server
============================================

Academic Context & Architectural Notes:
---------------------------------------
1. Polyglot Microservice Architecture:
   RentHub utilizes a Node.js/Express service for transactional database persistence
   (MongoDB) and business logic, while offloading neural text generation to this
   Python FastAPI microservice. This decouples the Node.js event loop from intensive
   CPU/GPU tensor arithmetic.

2. Lifespan Model Management:
   Modern FastAPI (using `lifespan` context managers) guarantees that heavy machine
   learning model weights are loaded into RAM once when the server boots. Incoming
   HTTP requests directly query the pre-warmed in-memory model, yielding low-latency
   responses without re-initializing weights.

3. Cross-Origin Resource Sharing (CORS):
   Enables secure browser-to-service communication from RentHub's Vite/React frontend
   (port 5173) and Node.js backend (port 5000).
"""

import os
import sys

# Ensure the ai-service directory is in sys.path even when launched from root
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import logging
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from engine import engine

# Configure structured logging
logger = logging.getLogger("RentHubAI.API")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan event handler.
    Loads the Hugging Face model weights once on startup before accepting requests.
    """
    logger.info("Initializing RentHub AI Microservice...")
    try:
        # Pre-warm model in memory
        engine.load_model()
        logger.info("AI Model successfully initialized in memory.")
    except Exception as e:
        logger.error(f"Error during model initialization: {str(e)}", exc_info=True)
    yield
    logger.info("Shutting down RentHub AI Microservice...")


app = FastAPI(
    title="RentHub AI Description Generator API",
    description=(
        "Local, offline-capable AI microservice for generating grounded rental marketplace "
        "descriptions using open-source Hugging Face models."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Requirement 4: CORS Configuration
# ---------------------------------------------------------------------------
# Allow requests from RentHub frontend (Vite default :5173) and local services
ALLOWED_ORIGINS = os.getenv(
    "RENTHUB_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5000,http://127.0.0.1:5000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Requirement 4 & 6: Request & Response Validation Schemas
# ---------------------------------------------------------------------------
class GenerateDescriptionRequest(BaseModel):
    """
    Strict input validation schema with length limits to protect local hardware
    from memory exhaustion (DoS prevention).
    """

    title: str = Field(
        ...,
        min_length=3,
        max_length=150,
        description="The primary name/brand/model of the rental asset.",
        json_schema_extra={"example": "Sony Alpha A7 IV Camera + 24-70mm GM Lens"},
    )
    category: Optional[str] = Field(
        default=None,
        max_length=80,
        description="The category the asset belongs to.",
        json_schema_extra={"example": "Photography & Cameras"},
    )
    features: Optional[str] = Field(
        default=None,
        max_length=400,
        description="Comma-separated or bullet list of included accessories and key specs.",
        json_schema_extra={"example": "24-70mm lens, 2 rechargeable batteries, 128GB SD card, padded case"},
    )
    condition: Optional[str] = Field(
        default="Good",
        max_length=60,
        description="Physical condition of the item.",
        json_schema_extra={"example": "Like New"},
    )
    location: Optional[str] = Field(
        default=None,
        max_length=120,
        description="General city or neighborhood for pickup.",
        json_schema_extra={"example": "Indiranagar, Bangalore"},
    )


class GenerateDescriptionResponse(BaseModel):
    description: str
    metrics: dict
    source: str = "local_open_source_model"


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health", summary="Healthcheck and Model Status")
def healthcheck():
    """
    Returns microservice health status, memory consumption, active compute device
    (CPU vs CUDA), and model readiness.
    """
    status_info = engine.get_status()
    return {
        "status": "healthy" if status_info["is_loaded"] else "degraded",
        "service": "renthub-ai-microservice",
        "engine": status_info,
    }


@app.post(
    "/api/generate-description",
    response_model=GenerateDescriptionResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a Grounded Rental Listing Description",
)
def generate_description(request: GenerateDescriptionRequest):
    """
    Generates a natural, professional description for a rental item using only
    the provided attributes to prevent hallucinated specifications.
    """
    if not request.title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing title cannot be empty or solely whitespace.",
        )

    try:
        result = engine.generate_description(
            title=request.title,
            category=request.category,
            features=request.features,
            condition=request.condition,
            location=request.location,
        )
        return GenerateDescriptionResponse(
            description=result["description"],
            metrics=result["metrics"],
        )
    except Exception as e:
        logger.error(f"Inference error during description generation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Local AI inference failed: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn
    # Pass app instance directly so it runs reliably from any working directory
    uvicorn.run(app, host="127.0.0.1", port=8000)
