from fastapi import FastAPI
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from dotenv import load_dotenv
import os
import motor.motor_asyncio
from bson import ObjectId
from pydantic.functional_validators import BeforeValidator

from typing_extensions import Annotated

PyObjectId = Annotated[str, BeforeValidator(str)]

class NewUser(BaseModel):
    name: str
    email: EmailStr
    password: str

class Profile(BaseModel):
    user_id: str
    bio : str | None = None

class User(BaseModel):
    name: str
    email: str
    profile: Profile

load_dotenv()

db_url = os.environ.get("MONGODB_URL")
client = motor.motor_asyncio.AsyncIOMotorClient(db_url)
db = client.get_database("pallavi")
test_collection = db.get_collection("test_collection")

app = FastAPI()

@app.get("/")
def ping():
    return {"message", "pong"}

@app.post("/create_user/")
async def createUser(user: NewUser | None):

    new_user = await test_collection.insert_one(user.model_dump())
    print(new_user)
    create_user = await test_collection.find_one({"_id": new_user.inserted_id})
    print(create_user)
    return {"hello"}