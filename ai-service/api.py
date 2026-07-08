from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.predict import router as predict_router

app = FastAPI(title="Smart Farming AI Service", version="1.0.0")

# Add CORS so Node.js can easily communicate with it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the prediction routes
app.include_router(predict_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "success", "message": "AI Service is up and running"}
