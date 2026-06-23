import { BpmnResponse } from "../types";

// Use relative path so it works with Vite Proxy (dev) and Nginx/Docker (prod)
const API_URL = '/api/analyze';

export const generateBpmnFromText = async (
  text: string
): Promise<BpmnResponse> => {
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Backend still expects context_text, passing empty string as we rely on backend RAG
      body: JSON.stringify({
        document_text: text,
        context_text: "" 
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server Error: ${response.status}`);
    }

    const data = await response.json();
    return data as BpmnResponse;

  } catch (error: any) {
    console.error("API Request Error:", error);
    // Return a user-friendly error
    if (error.message.includes("Unexpected token") || error.message.includes("Failed to fetch")) {
      throw new Error("Cannot connect to backend server. Please ensure the backend is running.");
    }
    throw error;
  }
};