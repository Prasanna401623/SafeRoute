import os
import json
from openai import OpenAI
import requests
from bs4 import BeautifulSoup
import time

# Initialize OpenAI client with API key from environment variable
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

if not client.api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set. Please set it before running the application.")

def get_text_from_file(file_obj):
    "this reads and returns text from file"
    return file_obj.read().decode("utf-8")

def get_text_from_url(url):
    """
    gets url and parses the HTML and returns text
    """
    try:
        response = requests.get(url, timeout=10)  # Added 10 second timeout
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        for element in soup(["script", "style"]):
            element.decompose()
        return soup.get_text(separator=" ")
    except requests.exceptions.Timeout:
        raise Exception("Request timed out while fetching URL")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Error fetching URL: {str(e)}")

def clean_and_extract(text, max_retries=3):
    prompt = (
        "You are an expert in data extraction and geospatial analysis. Analyze the following text and extract the following information: \n"
        "1. The first occurrence of latitude and longitude (if explicitly present). If they are not present, return null for each. \n"
        "2. The type of crime mentioned (e.g., theft, assault, etc.). \n"
        "3. Any date mentioned in the text. \n\n"
        "Return your answer as a JSON object with the following keys: \n"
        "- \"latitude\": (float or null) \n"
        "- \"longitude\": (float or null) \n"
        "- \"crime_type\": (string or null) \n"
        "- \"date\": (ISO 8601 format string or null)\n\n"
        "If an element cannot be extracted, set its value to null. \n\n"
        "Text to analyze:\n\"\"\" \n" + text + "\n\"\"\"\n\n"
        "Return your answer in the format:\n"
        "{\n  \"latitude\": 45.123, \n  \"longitude\": -93.456, \n  \"crime_type\": \"theft\", \n  \"date\": \"2024-04-12T12:00:00Z\"}"
    )
    
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert in extracting structured geospatial and crime data"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=150,
                temperature=0.0,
                timeout=30  # Added 30 second timeout
            )
            extracted = response.choices[0].message.content.strip()
            data = json.loads(extracted)
            return data
        except Exception as e:
            if attempt == max_retries - 1:  # Last attempt
                return {
                    "error": "failed to extract or parse data",
                    "details": str(e),
                    "latitude": None,
                    "longitude": None,
                    "crime_type": None,
                    "date": None
                }
            time.sleep(2 ** attempt)  # Exponential backoff 