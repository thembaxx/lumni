from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/health")
async def health():
    return JSONResponse({"status": "ok"})

@app.post("/process")
async def process(file: bytes):
    # Placeholder - implement marker logic here
    return JSONResponse({"result": "processed"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
