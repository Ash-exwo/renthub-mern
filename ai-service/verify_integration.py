"""
End-to-End Verification Script: RentHub AI Microservice
=======================================================
Simulates the exact HTTP requests sent by the React frontend components
(CreateListing.jsx & EditListing.jsx) and measures actual response times,
token counts, and memory footprint.
"""

import sys
import time

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from main import app
from engine import engine

client = TestClient(app)


def run_verification():
    print("\n" + "=" * 60)
    print(" 🚀 RENTHUB AI LISTING GENERATOR: E2E VERIFICATION SUITE")
    print("=" * 60)

    # 1. Healthcheck
    print("\n[Test 1/4] Querying Microservice Health Check...")
    start = time.time()
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    health_data = res.json()
    print(f" Status: {health_data['status']}")
    print(f" Model: {health_data['engine']['model_name']}")
    print(f" Compute Device: {health_data['engine']['device_name']} ({health_data['engine']['device']})")
    print(f" Process RAM: {health_data['engine']['current_process_ram_mb']} MB")
    print(f" Healthcheck Response Time: {round((time.time() - start) * 1000, 2)} ms")

    # 2. Camera Gear Listing Simulation (from CreateListing.jsx Step 1)
    print("\n[Test 2/4] Simulating Listing Wizard: Camera Equipment...")
    camera_payload = {
        "title": "Sony Alpha A7 IV Full-Frame Camera + 24-70mm GM Lens",
        "category": "Photography & Cameras",
        "features": "24-70mm f/2.8 GM zoom lens, 2 rechargeable batteries, dual 128GB SD cards, padded shoulder bag",
        "condition": "Pristine / Like New",
        "location": "Indiranagar, Bangalore",
    }
    t0 = time.time()
    res = client.post("/api/generate-description", json=camera_payload)
    assert res.status_code == 200, f"Camera generation failed: {res.status_code} - {res.text}"
    camera_data = res.json()
    print(f" Output Tokens: {camera_data['metrics']['output_tokens']}")
    print(f" Inference Time: {camera_data['metrics']['inference_time_seconds']}s")
    print(f" Generated Text Preview:\n  \"{camera_data['description']}\"")

    # 3. Camping Gear Listing Simulation (Outdoor Category)
    print("\n[Test 3/4] Simulating Listing Wizard: Outdoor Camping Tent...")
    camping_payload = {
        "title": "Quechua 4-Person Waterproof Camping Tent + Sleeping Bags",
        "category": "Outdoor & Camping",
        "features": "Waterproof flysheet, groundsheet, fiberglass poles, 2 fleece sleeping bags, carrying duffel",
        "condition": "Good",
        "location": "Kochi, Kerala",
    }
    t0 = time.time()
    res = client.post("/api/generate-description", json=camping_payload)
    assert res.status_code == 200, f"Camping generation failed: {res.status_code} - {res.text}"
    camping_data = res.json()
    print(f" Output Tokens: {camping_data['metrics']['output_tokens']}")
    print(f" Inference Time: {camping_data['metrics']['inference_time_seconds']}s")
    print(f" Generated Text Preview:\n  \"{camping_data['description']}\"")

    # 4. Error & Edge Case Guard Simulation
    print("\n[Test 4/4] Testing Input Validation & Error Guards...")
    invalid_res = client.post("/api/generate-description", json={"title": "  ", "category": "General"})
    assert invalid_res.status_code in (400, 422), f"Validation guard failed: {invalid_res.status_code}"
    print(f" Correctly caught invalid empty title with HTTP {invalid_res.status_code}")

    print("\n" + "=" * 60)
    print(" ✅ ALL E2E VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    run_verification()
