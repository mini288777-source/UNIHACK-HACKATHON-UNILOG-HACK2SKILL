from fastapi import APIRouter
from app.api.v1.endpoints import documents, jobs, products, export, enrichment

api_router = APIRouter()
api_router.include_router(documents.router)
api_router.include_router(jobs.router)
api_router.include_router(products.router)
api_router.include_router(export.router)
api_router.include_router(enrichment.router)
