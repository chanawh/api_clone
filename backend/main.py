from fastapi import FastAPI
import requests
from pydantic import BaseModel
from typing import Optional, Dict
from fastapi.middleware.cors import CORSMiddleware
from enum import Enum
from requests.auth import HTTPBasicAuth

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

class AuthType(str, Enum):
    API_KEY = "api_key"
    BEARER = "bearer"
    BASIC = "basic"
    NONE = "none"

class RequestBody(BaseModel):
    url: str
    method: HTTPMethod = HTTPMethod.GET
    payload: Optional[Dict] = None
    headers: Optional[Dict[str, str]] = None  # Custom headers
    auth_type: AuthType = AuthType.NONE
    api_key: Optional[str] = None
    bearer_token: Optional[str] = None
    basic_auth: Optional[Dict[str, str]] = None  # {"username": "user", "password": "pass"}

def send_test_request(url, method="GET", payload=None, headers=None, auth_type=AuthType.NONE, api_key=None, bearer_token=None, basic_auth=None):
    try:
        # Initialize headers if None
        headers = headers or {}

        # Initialize auth as None by default
        auth = None

        # Add authentication headers based on auth_type
        if auth_type == AuthType.API_KEY and api_key:
            headers["Authorization"] = f"ApiKey {api_key}"
        elif auth_type == AuthType.BEARER and bearer_token:
            headers["Authorization"] = f"Bearer {bearer_token}"
        elif auth_type == AuthType.BASIC and basic_auth:
            auth = HTTPBasicAuth(basic_auth["username"], basic_auth["password"])

        response = requests.request(method, url, json=payload, headers=headers, auth=auth, timeout=5)
        response.raise_for_status()

        try:
            return {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": response.json()  # Attempt to return JSON response
            }
        except ValueError:
            return {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": response.text  # Return raw text if not JSON
            }
    
    except requests.Timeout:
        return {"error": "Request timed out"}
    except requests.ConnectionError:
        return {"error": "Failed to connect to the server"}
    except requests.HTTPError as http_err:
        # Handle case where `response` might be undefined due to error
        status_code = response.status_code if 'response' in locals() else 'N/A'
        return {"error": f"HTTP error occurred: {http_err}", "status_code": status_code}
    except requests.RequestException as e:
        return {"error": f"Request failed: {e}"}

@app.post("/troubleshoot/")
def troubleshoot_api(request: RequestBody):
    result = send_test_request(
        url=request.url,
        method=request.method,
        payload=request.payload,
        headers=request.headers,
        auth_type=request.auth_type,
        api_key=request.api_key,
        bearer_token=request.bearer_token,
        basic_auth=request.basic_auth
    )

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
