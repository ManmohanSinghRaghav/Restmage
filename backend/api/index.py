from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World", "status": "working"}

@app.get("/api/health")
def health():
    return {"status": "OK"}

handler = Mangum(app)
