from fastapi import FastAPI
import requests

app = FastAPI()


@app.get("/")
def test_root():
    response = requests.get("http://localhost:9090/")
    data = response.json()
    return data
