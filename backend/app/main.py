from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.routes.accounts import router as accounts_router
from app.api.routes.bant import router as bant_router
from app.api.routes.contacts import router as contacts_router
from app.api.routes.health import router as health_router
from app.api.routes.interactions import router as interactions_router
from app.api.routes.outreach import router as outreach_router
from app.api.routes.pain_profiles import router as pain_router
from app.api.routes.knowledge_docs import router as knowledge_router
from app.api.routes.pipeline import router as pipeline_router
from app.api.routes.signals import router as signals_router
from app.core.config import get_settings

settings = get_settings()

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title=settings.app_name)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix=settings.api_prefix)
app.include_router(accounts_router, prefix=settings.api_prefix)
app.include_router(contacts_router, prefix=settings.api_prefix)
app.include_router(signals_router, prefix=settings.api_prefix)
app.include_router(pain_router, prefix=settings.api_prefix)
app.include_router(outreach_router, prefix=settings.api_prefix)
app.include_router(interactions_router, prefix=settings.api_prefix)
app.include_router(bant_router, prefix=settings.api_prefix)
app.include_router(pipeline_router, prefix=settings.api_prefix)
app.include_router(knowledge_router, prefix=settings.api_prefix)

@app.get("/", include_in_schema=False)
def index():
    return JSONResponse(content={"message": "AI Sales Copilot API Server is running."})


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "") or uuid4().hex


def _http_error_code(status_code: int) -> str:
    return f"HTTP_{status_code}"


def _error_response(request: Request, status_code: int, code: str, detail):
    response = JSONResponse(
        status_code=status_code,
        content={
            "detail": detail,
            "error": {
                "code": code,
                "message": detail if isinstance(detail, str) else "request failed",
            },
            "request_id": _request_id(request),
        },
    )
    response.headers["X-Request-ID"] = _request_id(request)
    return response


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request.state.request_id = request.headers.get("X-Request-ID") or uuid4().hex
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    code = _http_error_code(exc.status_code)
    if isinstance(detail, dict):
        code = str(detail.get("code") or code)
        detail = detail.get("message") or detail
    return _error_response(request=request, status_code=exc.status_code, code=code, detail=detail)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return _error_response(
        request=request,
        status_code=422,
        code="VALIDATION_ERROR",
        detail=exc.errors(),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):  # noqa: ARG001
    return _error_response(
        request=request,
        status_code=500,
        code="INTERNAL_ERROR",
        detail="Internal server error",
    )
