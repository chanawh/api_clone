from fastapi import FastAPI
import requests
from pydantic import BaseModel
from typing import Optional, Dict
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use specific origins in production (e.g., ["https://your-frontend-domain.com"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RequestBody(BaseModel):
    url: str
    method: Optional[str] = "GET"
    payload: Optional[Dict] = {}


def send_test_request(url, method="GET", payload=None):
    try:
        if method == "GET":
            response = requests.get(url, params=payload, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=payload, timeout=5)

        response.raise_for_status()
        return response.json()

    except requests.Timeout:
        return {"error": "Request timed out"}
    except requests.ConnectionError:
        return {"error": "Failed to connect to the server"}
    except requests.HTTPError as http_err:
        return {"error": f"HTTP error occurred: {http_err}"}
    except requests.RequestException as e:
        return {"error": f"Request failed: {e}"}


@app.post("/troubleshoot/")
def troubleshoot_api(request: RequestBody):
    url = request.url
    method = request.method
    payload = request.payload

    result = send_test_request(url, method, payload)

    if "error" in result:
        error_message = result["error"]
        if "timeout" in error_message:
            suggestion = "Check if the API server is down or check your internet connection."
        elif "Connection" in error_message:
            suggestion = "Check if the URL is correct and the API server is reachable."
        elif "HTTP error" in error_message:
            suggestion = "Check the API documentation for expected responses and error codes."
        else:
            suggestion = "Review the API documentation for required parameters."
        result["suggestion"] = suggestion

    return result
