"""
Unit & Integration Tests for RentHub AI Microservice
====================================================

Tests cover:
1. Model loading & health endpoint diagnostics
2. Request validation (title required, max-length boundaries)
3. Inference generation format and metrics
4. Error handling on edge-case inputs
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from engine import engine

client = TestClient(app)


def test_healthcheck_endpoint():
    """Verify that the /api/health endpoint returns 200 and system status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "service" in data
    assert data["service"] == "renthub-ai-microservice"
    assert "engine" in data
    assert "device" in data["engine"]


def test_generate_description_validation_missing_title():
    """Verify that omitting the title returns a 422 Unprocessable Entity error."""
    response = client.post(
        "/api/generate-description",
        json={"category": "Cameras", "features": "24-70mm lens"},
    )
    assert response.status_code == 422


def test_generate_description_validation_empty_title():
    """Verify that an empty or whitespace-only title is rejected."""
    response = client.post(
        "/api/generate-description",
        json={"title": "   ", "category": "Cameras"},
    )
    assert response.status_code in (400, 422)


def test_generate_description_validation_title_too_long():
    """Verify that excessively long titles exceeding boundaries are rejected."""
    long_title = "A" * 151
    response = client.post(
        "/api/generate-description",
        json={"title": long_title},
    )
    assert response.status_code == 422


def test_generate_description_success():
    """Verify end-to-end local text generation returns formatted description and performance metrics."""
    payload = {
        "title": "Sony Alpha A7 IV Camera",
        "category": "Electronics",
        "features": "24-70mm lens, 2 extra batteries, 64GB SD card",
        "condition": "Excellent",
        "location": "Kochi",
    }
    response = client.post("/api/generate-description", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "description" in data
    assert len(data["description"]) >= 20
    assert "metrics" in data
    assert "inference_time_seconds" in data["metrics"]
    assert "output_tokens" in data["metrics"]
    assert data["metrics"]["output_tokens"] > 0
