const express = require('express');
const path = require('path');

// Simple HTML page to generate registration URLs
const generateUrlHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generate Super Admin Registration URL</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #555;
        }
        input, select {
            width: 100%;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            box-sizing: border-box;
        }
        button {
            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            background-color: #e8f5e8;
            border-radius: 5px;
            border-left: 4px solid #4caf50;
            display: none;
        }
        .error {
            background-color: #ffebee;
            border-left: 4px solid #f44336;
        }
        .url-box {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
            word-break: break-all;
            font-family: monospace;
        }
        .copy-btn {
            background: #28a745;
            padding: 5px 15px;
            margin-top: 10px;
            width: auto;
        }
        .loading {
            display: none;
            text-align: center;
            margin: 20px 0;
        }
        .spinner {
            border: 2px solid #f3f3f3;
            border-top: 2px solid #667eea;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            display: inline-block;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Generate Super Admin Registration URL</h1>
            <p>Create a secure one-time link for super admin registration</p>
        </div>

        <form id="urlForm">
            <div class="form-group">
                <label for="expiryHours">Expiry Time (Hours):</label>
                <select id="expiryHours">
                    <option value="1">1 Hour</option>
                    <option value="6">6 Hours</option>
                    <option value="24" selected>24 Hours (1 Day)</option>
                    <option value="72">72 Hours (3 Days)</option>
                    <option value="168">168 Hours (1 Week)</option>
                </select>
            </div>

            <div class="form-group">
                <label for="maxUses">Maximum Uses:</label>
                <select id="maxUses">
                    <option value="1" selected>1 Use Only</option>
                    <option value="3">3 Uses</option>
                    <option value="5">5 Uses</option>
                    <option value="10">10 Uses</option>
                </select>
            </div>

            <button type="submit">Generate Registration URL</button>
        </form>

        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Generating secure registration URL...</p>
        </div>

        <div class="result" id="result">
            <h3>✅ Registration URL Generated Successfully!</h3>
            <p><strong>Registration URL:</strong></p>
            <div class="url-box" id="generatedUrl"></div>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="copy-btn" onclick="copyUrl()">📋 Copy URL</button>
                <button class="copy-btn" onclick="openUrl()" style="background: #007bff;">🔗 Open URL</button>
            </div>
            
            <div style="margin-top: 15px;">
                <p><strong>Details:</strong></p>
                <ul id="urlDetails"></ul>
            </div>
        </div>

        <div class="result error" id="error" style="display: none;">
            <h3>❌ Error</h3>
            <p id="errorMessage"></p>
        </div>
    </div>

    <script>
        document.getElementById('urlForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const loading = document.getElementById('loading');
            const result = document.getElementById('result');
            const error = document.getElementById('error');
            
            // Hide previous results
            result.style.display = 'none';
            error.style.display = 'none';
            loading.style.display = 'block';
            
            const formData = {
                expiryHours: parseInt(document.getElementById('expiryHours').value),
                maxUses: parseInt(document.getElementById('maxUses').value)
            };
            
            try {
                const response = await fetch('/api/super-admin-registration/generate-registration-url', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                loading.style.display = 'none';
                
                if (data.success) {
                    document.getElementById('generatedUrl').textContent = data.registrationUrl;
                    document.getElementById('urlDetails').innerHTML = \`
                        <li><strong>Token:</strong> \${data.token}</li>
                        <li><strong>Expires:</strong> \${new Date(data.expiresAt).toLocaleString()}</li>
                        <li><strong>Max Uses:</strong> \${data.maxUses}</li>
                        <li><strong>Status:</strong> Active</li>
                    \`;
                    result.style.display = 'block';
                } else {
                    document.getElementById('errorMessage').textContent = data.error || 'Failed to generate URL';
                    error.style.display = 'block';
                }
            } catch (err) {
                loading.style.display = 'none';
                document.getElementById('errorMessage').textContent = 'Network error: ' + err.message;
                error.style.display = 'block';
            }
        });
        
        function copyUrl() {
            const urlText = document.getElementById('generatedUrl').textContent;
            navigator.clipboard.writeText(urlText).then(function() {
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = '✅ Copied!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            });
        }
        
        function openUrl() {
            const urlText = document.getElementById('generatedUrl').textContent;
            window.open(urlText, '_blank');
        }
    </script>
</body>
</html>
`;

module.exports = { generateUrlHtml };