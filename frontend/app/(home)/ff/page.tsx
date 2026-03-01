"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function TestWebSocketPage() {
  const [cookieInfo, setCookieInfo] = useState({
    documentCookie: '',
    hasToken: false,
    allCookies: [] as string[]
  });
  
  const [serverResponse, setServerResponse] = useState<any>(null);
  const [wsStatus, setWsStatus] = useState('Not connected');
  const [wsMessages, setWsMessages] = useState<string[]>([]);
  const [manualWs, setManualWs] = useState<WebSocket | null>(null);

  // Check document.cookie (will only show non-HttpOnly cookies)
  useEffect(() => {
    const cookies = document.cookie;
    const cookieArray = cookies.split(';').map(c => c.trim()).filter(c => c);
    
    setCookieInfo({
      documentCookie: cookies,
      hasToken: cookies.includes('token='),
      allCookies: cookieArray
    });
    
    console.log('Document cookies:', cookies);
  }, []);

  // Test API endpoint to check what cookies server receives
  const testServerCookies = async () => {
    try {
      // You'll need to create this endpoint
      const response = await api.get('/debug/cookies');
      setServerResponse(response.data);
    } catch (error) {
      console.error('Error testing cookies:', error);
      setServerResponse({ error: String(error) });
    }
  };

  // Test manual WebSocket connection
  const connectManualWS = () => {
    if (manualWs) {
      manualWs.close();
    }

    setWsMessages([]);
    setWsStatus('Connecting...');
    
    const ws = new WebSocket('ws://localhost:5000/ws');
    
    ws.onopen = () => {
      setWsStatus('✅ Connected');
      setWsMessages(prev => [...prev, 'Connection opened']);
      
      // Send ping to test
      ws.send(JSON.stringify({ type: 'ping' }));
      setWsMessages(prev => [...prev, 'Sent ping']);
    };
    
    ws.onmessage = (event) => {
      setWsMessages(prev => [...prev, `Received: ${event.data}`]);
      console.log('WS message:', event.data);
    };
    
    ws.onclose = (event) => {
      setWsStatus(`❌ Closed (${event.code})`);
      setWsMessages(prev => [...prev, `Closed: ${event.code} - ${event.reason}`]);
    };
    
    ws.onerror = (error) => {
      setWsStatus('❌ Error');
      setWsMessages(prev => [...prev, 'Error occurred']);
      console.error('WS error:', error);
    };
    
    setManualWs(ws);
  };

  // Test login directly
  const testDirectLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'your-email@example.com', // Replace with test credentials
          password: 'your-password'
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Login response:', data);
      console.log('Response headers:', [...response.headers.entries()]);
      
      alert('Login attempted - check console for details');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">🔍 WebSocket & Cookie Test</h1>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Left column - Cookie Info */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">🍪 Cookie Info</h2>
          
          <div className="space-y-3">
            <div>
              <div className="text-gray-400">document.cookie:</div>
              <div className="bg-gray-900 p-2 rounded font-mono text-sm break-all">
                {cookieInfo.documentCookie || '(empty)'}
              </div>
            </div>
            
            <div>
              <div className="text-gray-400">Has token:</div>
              <div className={cookieInfo.hasToken ? 'text-green-400' : 'text-red-400'}>
                {cookieInfo.hasToken ? '✅ Yes' : '❌ No'}
              </div>
            </div>
            
            <div>
              <div className="text-gray-400">All cookies:</div>
              <ul className="list-disc pl-5">
                {cookieInfo.allCookies.map((cookie, i) => (
                  <li key={i} className="font-mono text-sm">{cookie}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-4 space-x-2">
            <button
              onClick={testServerCookies}
              className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
            >
              Test Server Cookies
            </button>
            
            <button
              onClick={testDirectLogin}
              className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
            >
              Test Direct Login
            </button>
          </div>
          
          {serverResponse && (
            <div className="mt-4">
              <div className="text-gray-400">Server response:</div>
              <pre className="bg-gray-900 p-2 rounded text-xs mt-1 overflow-auto max-h-40">
                {JSON.stringify(serverResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        {/* Right column - WebSocket Test */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">🔌 WebSocket Test</h2>
          
          <div className="mb-4">
            <div className="text-gray-400">Status:</div>
            <div className={`text-lg ${wsStatus.includes('✅') ? 'text-green-400' : 'text-yellow-400'}`}>
              {wsStatus}
            </div>
          </div>
          
          <button
            onClick={connectManualWS}
            className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700 mb-4"
          >
            Connect Manual WebSocket
          </button>
          
          {wsMessages.length > 0 && (
            <div>
              <div className="text-gray-400 mb-2">Messages:</div>
              <div className="bg-gray-900 p-2 rounded h-40 overflow-y-auto">
                {wsMessages.map((msg, i) => (
                  <div key={i} className="text-xs font-mono border-b border-gray-700 py-1">
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Add a debug endpoint to your backend */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">📋 Next Steps</h2>
        <p className="text-gray-300">
          Add this debug endpoint to your backend (temporary):
        </p>
        <pre className="bg-gray-900 p-2 rounded text-xs mt-2">
{`// In your backend server.js or routes
app.get('/api/debug/cookies', (req, res) => {
  res.json({
    headers: req.headers,
    cookies: req.headers.cookie,
    hasToken: req.headers.cookie?.includes('token=') || false
  });
});`}
        </pre>
      </div>
    </div>
  );
}