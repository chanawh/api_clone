import React, { useState } from 'react';
import './App.css';

const TroubleshootForm = () => {
    const [url, setUrl] = useState('');
    const [method, setMethod] = useState('GET');
    const [payload, setPayload] = useState('');
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const validateUrl = (url) => {
        const regex = /^(https?:\/\/)?([a-z0-9]+([-\.\w]*[a-z0-9])*)(\.[a-z0-9]+([-\.\w]*[a-z0-9])*)*(\/[^\s]*)?$/;
        return regex.test(url);
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
            if (payload) {
                parsedPayload = JSON.parse(payload);
            }
        } catch (err) {
            setError('Invalid JSON payload');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/troubleshoot/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, method, payload: parsedPayload }),
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
    };

    return (
        <div className="App">
            <h1>API Troubleshooting Tool</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="API URL"
                />
                <textarea
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    placeholder="Payload (JSON)"
                />
                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                </select>
                <button type="submit" disabled={isLoading}>Test API</button>
            </form>
            {isLoading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}
            {result && (
                <div>
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
