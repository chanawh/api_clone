from fastapi import FastAPI
import requests
from pydantic import BaseModel
from typing import Optional, Dict
from fastapi.middleware.cors import CORSMiddleware
from enum import Enum

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HTTPMethod(str, Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"

class RequestBody(BaseModel):
    url: str
    method: HTTPMethod = HTTPMethod.GET
    payload: Optional[Dict] = {}

def send_test_request(url, method="GET", payload=None):
    try:
        response = requests.request(method, url, json=payload, timeout=5)
        response.raise_for_status()

        try:
            return {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": response.json()
            }
        except ValueError:
            return {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": response.text
            }
    
    except requests.Timeout:
        return {"error": "Request timed out"}
    except requests.ConnectionError:
        return {"error": "Failed to connect to the server"}
    except requests.HTTPError as http_err:
        return {"error": f"HTTP error occurred: {http_err}", "status_code": response.status_code}
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
            suggestion = "Check if the API server is slow or unavailable. Try increasing timeout settings."
        elif "Connection" in error_message:
            suggestion = "Ensure the API URL is correct and the server is online."
        elif "HTTP error" in error_message:
            suggestion = "Review API documentation for correct request format and required parameters."
        elif "Request failed" in error_message:
            suggestion = "Check network settings, firewall rules, or API authentication."
        else:
            suggestion = "Unknown error. Try debugging with a different API request."
        
        result["suggestion"] = suggestion
    
    return result
