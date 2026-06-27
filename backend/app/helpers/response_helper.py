from typing import Any, Optional


def success_response(data: Any = None, message: str = "Success") -> dict:
    return {
        "status": "success",
        "message": message,
        "data": data
    }


def error_response(message: str, status_code: int = 400) -> dict:
    return {
        "status": "error",
        "message": message,
        "data": None
    }
