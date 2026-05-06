from fastapi import APIRouter

router = APIRouter()

@router.get("/me")
async def get_me():
    # TODO: Day 18 — implement auth
    return {"message": "Auth not yet implemented — coming Day 18"}
