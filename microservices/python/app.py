from fastapi import FastAPI
import requests
import os

app = FastAPI()

node_service_url = os.getenv("NODE_SERVICE_URL")


@app.get("/")
def test_root():
    response = requests.get(f"{node_service_url}/")
    data = response.json()
    return data
