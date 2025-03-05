import React, { useState } from 'react';
import './App.css';

const TroubleshootForm = () => {
    const [url, setUrl] = useState('');
    const [method, setMethod] = useState('GET');
    const [payload, setPayload] = useState('');
    const [authType, setAuthType] = useState('none');
    const [bearerToken, setBearerToken] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [basicAuth, setBasicAuth] = useState({ username: '', password: '' });

    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const validateUrl = (inputUrl) => {
        try {
            new URL(inputUrl);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateUrl(url)) {
            setError('Invalid URL');
            return;
        }

        setIsLoading(true);
        setError('');
        let parsedPayload = {};

        try {
            if (payload.trim()) {
                parsedPayload = JSON.parse(payload);
            }
        } catch (err) {
            setError('Invalid JSON payload');
            setIsLoading(false);
            return;
        }

        let modifiedUrl = url;

        // If API Key authentication is selected, append key to URL
        if (authType === 'api_key' && apiKey) {
            const separator = url.includes('?') ? '&' : '?';
            modifiedUrl = `${url}${separator}key=${apiKey}`;
        }

        const requestBody = {
            url: modifiedUrl, // Use modified URL with API key if applicable
            method,
            payload: parsedPayload,
            auth_type: authType === 'api_key' ? 'none' : authType, // Avoid sending 'api_key' in headers
        };

        if (authType === 'bearer') {
            requestBody.bearer_token = bearerToken;
        } else if (authType === 'basic') {
            requestBody.basic_auth = basicAuth;
        }

        try {
            const response = await fetch('http://localhost:8000/troubleshoot/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError('There was an error processing the request.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setUrl('');
        setPayload('');
        setResult(null);
        setError('');
        setAuthType('none');
        setBearerToken('');
        setApiKey('');
        setBasicAuth({ username: '', password: '' });
    };

    return (
        <div className="App">
            <h1>API Troubleshooting Tool</h1>
            <form onSubmit={handleSubmit}>
                <label>API URL:</label>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter API URL"
                />

                <label>HTTP Method:</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                </select>

                <label>Authentication Type:</label>
                <select value={authType} onChange={(e) => setAuthType(e.target.value)}>
                    <option value="none">None</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="api_key">API Key</option>
                    <option value="basic">Basic Auth</option>
                </select>

                {authType === 'bearer' && (
                    <input
                        type="text"
                        value={bearerToken}
                        onChange={(e) => setBearerToken(e.target.value)}
                        placeholder="Bearer Token"
                    />
                )}

                {authType === 'api_key' && (
                    <input
                        type="text"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="API Key"
                    />
                )}

                {authType === 'basic' && (
                    <div>
                        <input
                            type="text"
                            value={basicAuth.username}
                            onChange={(e) =>
                                setBasicAuth({ ...basicAuth, username: e.target.value })
                            }
                            placeholder="Username"
                        />
                        <input
                            type="password"
                            value={basicAuth.password}
                            onChange={(e) =>
                                setBasicAuth({ ...basicAuth, password: e.target.value })
                            }
                            placeholder="Password"
                        />
                    </div>
                )}

                <label>Payload (JSON):</label>
                <textarea
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    placeholder="Enter JSON payload"
                />

                <button type="submit" disabled={isLoading}>Test API</button>
            </form>

            {isLoading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}

            {result && (
                <div className="result-container">
                    <h3>Result:</h3>
                    <p><strong>Status Code:</strong> {result.status_code}</p>
                    <p><strong>Headers:</strong></p>
                    <pre>{JSON.stringify(result.headers, null, 2)}</pre>
                    <p><strong>Body:</strong></p>
                    <pre>{JSON.stringify(result.body, null, 2)}</pre>
                    <button onClick={handleClear}>Clear Result</button>
                </div>
            )}
        </div>
    );
};

export default TroubleshootForm;
