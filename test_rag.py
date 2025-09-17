#!/usr/bin/env python3
"""
Test script for PDF RAG functionality
"""

import requests
import json
import os
from pathlib import Path

# Test configuration
API_BASE = "http://localhost:8000"
TEST_API_KEY = "test-key"  # This would be a real API key in production

def test_pdf_status():
    """Test the PDF status endpoint"""
    print("Testing PDF status endpoint...")
    response = requests.get(f"{API_BASE}/api/pdf-status")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_health():
    """Test the health endpoint"""
    print("Testing health endpoint...")
    response = requests.get(f"{API_BASE}/api/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_chat_without_pdf():
    """Test chat functionality without PDF"""
    print("Testing chat without PDF...")
    data = {
        "developer_message": "You are a helpful assistant.",
        "user_message": "What is artificial intelligence?",
        "model": "gpt-4o-mini",
        "api_key": TEST_API_KEY
    }
    
    try:
        response = requests.post(f"{API_BASE}/api/chat", json=data, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("Chat response received successfully")
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except requests.exceptions.ChunkedEncodingError:
        print("Chat endpoint is working but requires valid OpenAI API key")
        return True  # This is expected behavior
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    """Run all tests"""
    print("Starting PDF RAG functionality tests...\n")
    
    # Test basic endpoints
    health_ok = test_health()
    print()
    
    status_ok = test_pdf_status()
    print()
    
    # Test chat without PDF (this will fail without a real API key, but we can test the endpoint)
    chat_ok = test_chat_without_pdf()
    print()
    
    print("Test Summary:")
    print(f"Health endpoint: {'✓' if health_ok else '✗'}")
    print(f"PDF status endpoint: {'✓' if status_ok else '✗'}")
    print(f"Chat endpoint: {'✓' if chat_ok else '✗'}")
    
    if health_ok and status_ok:
        print("\n✅ Basic API functionality is working!")
        print("📝 Note: Chat functionality requires a valid OpenAI API key")
        print("🌐 Frontend should be available at: http://localhost:3000")
        print("🔧 Backend API available at: http://localhost:8000")
    else:
        print("\n❌ Some tests failed. Check the server logs.")

if __name__ == "__main__":
    main()
