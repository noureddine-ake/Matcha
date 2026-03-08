"use client";

import api from "@/lib/api";
import { useState } from "react";

export default function DebugRefreshPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [cookies, setCookies] = useState<string>("");

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const checkCookies = () => {
    addLog(`Document cookies: ${document.cookie || "none"}`);
    setCookies(document.cookie);
    alert("Check console for cookie details");
  };

  const testDirectRefresh = async () => {
    try {
      addLog("🔄 Testing direct refresh...");

      // Try with full URL to bypass any baseURL issues
      const response = await fetch("http://localhost:5000/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      addLog(`✅ Direct fetch status: ${response.status}`);
      addLog(`📦 Response data: ${JSON.stringify(data)}`);

      // Check if we got set-cookie headers
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        addLog(`🍪 Set-Cookie: ${setCookie}`);
      } else {
        addLog(`❌ No Set-Cookie header`);
      }
    } catch (error) {
      addLog(
        `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const testApiRefresh = async () => {
    try {
      addLog("🔄 Testing API instance refresh...");

      const response = await api.post("/auth/refresh");

      addLog(`✅ API refresh status: ${response.status}`);
      addLog(`📦 Response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      addLog(
        `❌ API refresh error: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: unknown } };
        addLog(
          `📦 Error response: ${JSON.stringify(axiosError.response?.data)}`,
        );
      }
    }
  };

  const testLogin = async () => {
    const username = prompt("Enter username:");
    const password = prompt("Enter password:");

    if (!username || !password) return;

    try {
      addLog(`🔄 Logging in as: ${username}`);

      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      void data;

      addLog(`✅ Login status: ${response.status}`);

      // Check cookies
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        addLog(`🍪 Set-Cookie received: ${setCookie.substring(0, 100)}...`);
      } else {
        addLog(`❌ No Set-Cookie header in login response`);
      }
    } catch (error) {
      addLog(
        `❌ Login error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Refresh Token Debugger</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <button
            onClick={testLogin}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            1. Login First
          </button>

          <button
            onClick={checkCookies}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Check Cookies
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={testDirectRefresh}
            className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Test Direct Fetch
          </button>

          <button
            onClick={testApiRefresh}
            className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Test API Instance
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">Debug Info:</h2>
        <p>Base URL: {api.defaults.baseURL}</p>
        <p>With Credentials: {api.defaults.withCredentials ? "✅" : "❌"}</p>
        <p>Refresh URL: {api.defaults.baseURL}/auth/refresh</p>
        <p>
          Document Cookies: {cookies || "none (HttpOnly cookies not visible)"}
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
        <p className="font-bold mb-2">📋 Instructions:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Open DevTools (F12) → Network tab</li>
          <li>Click &quot;Login First&quot; and enter credentials</li>
          <li>Check the login response for Set-Cookie headers</li>
          <li>Click &quot;Test Direct Fetch&quot; to try refresh with fetch</li>
          <li>
            Click &quot;Test API Instance&quot; to try with your axios instance
          </li>
          <li>Check Network tab for both requests</li>
        </ol>
      </div>

      {/* Logs */}
      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
}
