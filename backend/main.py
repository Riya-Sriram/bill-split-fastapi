import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import bcrypt
from dotenv import load_dotenv
import os
from bson.objectid import ObjectId
import uuid
import certifi
from datetime import datetime

# Load environment variables
load_dotenv()


def hash_password(password: str) -> str:
    bytes_encoded=password.encode('utf-8')
    salt=bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(bytes_encoded,salt)


def verify_password(entered_password: str, hashed_password: str) -> bool:
    bytes_encoded=entered_password.encode("utf-8")
    return bcrypt.checkpw(bytes_encoded,hashed_password)

# MongoDB Connection
MONGO_URL = os.getenv("MONGO_URL")
try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
    client.admin.command('ping')
    db = client["CS_Project"]
    users_collection = db["users"]
    groups_collection = db["groups"]
    expenses_collection = db["expenses"]
    settlements_collection = db["settlements"]
    print("MongoDB connected successfully")
except ConnectionFailure as e:
    print("Failed to connect to MongoDB")
    print(e)
    db = None
    users_collection = None
    groups_collection = None
    expenses_collection = None
    settlements_collection = None

app = FastAPI()

origins=[
    "*"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class LoginRequest(BaseModel):
    username: str
    password: str

class SignupRequest(BaseModel):
    username: str
    password: str
    email: str = None

class FriendRequest(BaseModel):
    name: str
    myname: str

class SearchRequest(BaseModel):
    username: str

class ProfileDetailsRequest(BaseModel):
    username: str

class PasswordCheckRequest(BaseModel):
    username: str
    password: str

class DeleteAccountRequest(BaseModel):
    myname: str

class GroupDetailsRequest(BaseModel):
    username: str

# class CreateGroupRequest(BaseModel):
#     groupName: str
#     amount: float
#     members: List[str]

class GroupMember(BaseModel):
    username: str

class CreateGroupRequest(BaseModel):
    groupName: str
    groupAdmin: str
    members: List[GroupMember]

class AddExpenseRequest(BaseModel):
    groupId: str
    paidBy: str
    total: float
    description: str
    category: str
    split: dict


class GroupIdRequest(BaseModel):
    groupId: str

class AddGroupMemberRequest(BaseModel):
    groupId: str
    username: str

@app.get("/health")
def read_root():
    return {
        "status": "Backend Server Running",
        "database": "connected" if db else "disconnected"
    }

@app.post("/login")
async def login(credentials: LoginRequest):
    """Login endpoint"""
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    user = users_collection.find_one({"username": credentials.username})
    
    if not user:
        return {"success": False, "message": "Invalid username or password"}
    
    if not verify_password(credentials.password, user.get("password")):
        return {"success": False, "message": "Invalid username or password"}
    
    return {
        "message": "Login successful",
        "success": True,
        "token": "authenticated",
        "username": user.get("username")
    }

@app.post("/signup")
async def signup(credentials: SignupRequest):
    """Signup endpoint - Register new user"""
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    existing_user = users_collection.find_one({"username": credentials.username})
    
    if existing_user:
        return {"success": False, "message": "Username already exists"}
    
    hashed_password = hash_password(credentials.password)
    
    new_user = {
        "username": credentials.username,
        "password": hashed_password,
        "email": credentials.email,
        "dp": ["https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"],
        "friends": [],
        "friend_requests": []
    }
    
    result = users_collection.insert_one(new_user)
    
    return {
        "message": "Account created successfully",
        "success": True,
        "token": "authenticated",
        "username": credentials.username
    }

@app.post("/main")
async def main_page_auth():
    """Get main page authorization check"""
    return {"success": True, "message": "Authorized"}

@app.post("/profile_details")
async def get_profile_details(request: ProfileDetailsRequest):
    """Get user profile details"""
    try:
        if users_collection is None:
            return {"success": False, "message": "Database connection failed"}
        
        user = users_collection.find_one({"username": request.username})
        
        if not user:
            return {"success": False, "message": "User not found"}
        
        return {
            "success": True,
            "username": user.get("username"),
            "email": user.get("email"),
            "dp": user.get("dp", ["https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"])
        }
    except Exception as e:
        print(f"Error in get_profile_details: {str(e)}")
        return {"success": False, "message": f"Error: {str(e)}"}

@app.post("/passwordcheck")
async def check_password(request: PasswordCheckRequest):
    """Check if password is correct"""
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    user = users_collection.find_one({"username": request.username})
    
    if not user:
        return {"success": False, "message": "User not found"}
    
    if verify_password(request.password, user.get("password")):
        return {"success": True, "message": "Password correct"}
    
    return {"success": False, "message": "Password incorrect"}

class UpdateProfileRequest(BaseModel):
    username: str
    newusername: str
    password: Optional[str] = None

@app.post("/update_profile_details")
async def update_profile_details(
    username: str = Form(...),
    newusername: str = Form(...),
    password: Optional[str] = Form(None),
    dp: Optional[UploadFile] = File(None)
):
    """Update user profile details"""
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    user = users_collection.find_one({"username": username})
    
    if not user:
        return {"success": False, "message": "User not found"}
    
    # Check if new username already exists
    if newusername != username:
        existing = users_collection.find_one({"username": newusername})
        if existing:
            return {"success": False, "message": "Username already exists"}
    
    update_data = {"username": newusername}
    
    # Only update password if it's provided and not empty
    if password and password.strip():
        print(f"Updating password for user {username}")
        update_data["password"] = hash_password(password)
    
    if dp:
        # In production, save file to storage service
        # For now, we'll just store the filename
        update_data["dp"] = [f"dp_{uuid.uuid4()}_{dp.filename}"]
    
    users_collection.update_one({"username": username}, {"$set": update_data})
    
    return {"success": True, "message": "Profile updated successfully"}

@app.post("/delete")
async def delete_account(request: DeleteAccountRequest):
    """Delete user account"""
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    result = users_collection.delete_one({"username": request.myname})
    
    if result.deleted_count > 0:
        return {"success": True, "message": "Account deleted successfully"}
    
    return {"success": False, "message": "Account deletion failed"}

@app.post("/search")
async def search_users(request: SearchRequest):
    """Search for users by username"""
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    search_pattern = {"username": {"$regex": f".*{request.username}.*", "$options": "i"}}
    users = users_collection.find(search_pattern)
    
    usernames = [user.get("username") for user in users]
    
    return usernames

@app.post("/friend")
async def get_pending_friend_requests(request: ProfileDetailsRequest):
    """Get pending friend requests for a user"""
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    user = users_collection.find_one({"username": request.username})
    
    if not user:
        return []
    
    return user.get("friend_requests", [])

@app.post("/addfriend")
async def add_friend(request: FriendRequest):
    """Send friend request"""
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    sender = users_collection.find_one({"username": request.myname})
    receiver = users_collection.find_one({"username": request.name})
    
    if not receiver:
        return {"success": False, "message": "User not found"}
    
    # Check if already friends
    if request.name in sender.get("friends", []):
        return {"success": False, "message": "User is already your friend"}
    
    # Add to friend requests
    if request.name not in receiver.get("friend_requests", []):
        users_collection.update_one(
            {"username": request.name},
            {"$push": {"friend_requests": request.myname}}
        )
    
    return {"success": True, "message": "Friend request sent"}

@app.post("/acceptfriend")
async def accept_friend_request(request: FriendRequest):
    """Accept friend request"""
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    # Add both users to each other's friends list
    users_collection.update_one(
        {"username": request.myname},
        {"$push": {"friends": request.name}, "$pull": {"friend_requests": request.name}}
    )
    
    users_collection.update_one(
        {"username": request.name},
        {"$push": {"friends": request.myname}}
    )
    
    return {"success": True, "message": "Friend request accepted"}

@app.post("/deletefriendinv")
async def decline_friend_request(request: FriendRequest):
    """Decline/delete friend request"""
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    users_collection.update_one(
        {"username": request.myname},
        {"$pull": {"friend_requests": request.name}}
    )
    
    return {"success": True, "message": "Friend request declined"}

@app.post("/friendlist")
async def get_friends_list(request: ProfileDetailsRequest):
    """Get list of friends for a user"""
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    user = users_collection.find_one({"username": request.username})
    
    if not user:
        return []
    
    return user.get("friends", [])

@app.post("/deletefriend")
async def delete_friend(request: FriendRequest):
    """Remove a friend"""
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    users_collection.update_one(
        {"username": request.myname},
        {"$pull": {"friends": request.name}}
    )
    
    users_collection.update_one(
        {"username": request.name},
        {"$pull": {"friends": request.myname}}
    )
    
    return {"success": True, "message": "Friend removed"}

@app.post("/main_page_group_details")
async def get_main_page_group_details(request: GroupDetailsRequest):
    """Get group details for main page"""
    if groups_collection is None:

        raise HTTPException(status_code=500, detail="Database connection failed")
    
    groups = groups_collection.find({"members.username": request.username})
    
    result = []
    for group in groups:
        expenses = expenses_collection.find({"groupId": str(group.get("_id"))})
        expenses_list = []
        for exp in expenses:
            expenses_list.append({
                "paidBy": exp.get("paidBy"),
                "cost": exp.get("cost"),
                "splits": exp.get("splits", [])
            })
        
        result.append({
            "groupId": str(group.get("_id")),
            "groupName": group.get("groupName"),
            "amount": group.get("amount", 0),
            "expenses": expenses_list
        })
    
    return result


@app.post("/create_group")
async def create_group(request: CreateGroupRequest):
    if groups_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    members_list = [{"username": member.username, "amount": 0} for member in request.members]


    group = {
        "groupName": request.groupName,
        "groupAdmin": request.groupAdmin,
        "members": members_list,
        "createdAt": None
    }

    result = groups_collection.insert_one(group)

    return {
        "success": True,
        "message": "Group created successfully",
        "groupId": str(result.inserted_id)
    }


@app.post("/addexpense")
async def add_expense(request: AddExpenseRequest):
    if expenses_collection is None or settlements_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    splits_list = [
        {"username": user, "amount": (request.total * percent) / 100}
        for user, percent in request.split.items()
        if percent > 0
    ]

    expense = {
        "groupId": request.groupId,
        "paidBy": request.paidBy,
        "cost": request.total,
        "description": request.description,
        "category": request.category,
        "splits": splits_list,
        "Day": datetime.utcnow()
    }

    result = expenses_collection.insert_one(expense)
    
    # Update settlements: each person who has a split owes the payer
    print(f"Creating settlements for expense: {request.description}")
    print(f"Paid by: {request.paidBy}, GroupId: {request.groupId}")
    print(f"Splits: {splits_list}")
    
    for split in splits_list:
        if split["username"] != request.paidBy and split["amount"] > 0:
            print(f"Processing settlement for {split['username']} owing {split['amount']} to {request.paidBy}")
            # Check if settlement already exists
            existing = settlements_collection.find_one({
                "user": split["username"],
                "debtTo": request.paidBy,
                "groupId": request.groupId
            })
            
            if existing:
                # Update existing settlement
                new_amount = existing["amount"] + split["amount"]
                print(f"Updating existing settlement: {existing['_id']}, new amount: {new_amount}")
                settlements_collection.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {"amount": new_amount}}
                )
            else:
                # Create new settlement
                new_settlement = {
                    "user": split["username"],
                    "debtTo": request.paidBy,
                    "amount": split["amount"],
                    "groupId": request.groupId
                }
                print(f"Creating new settlement: {new_settlement}")
                settlements_collection.insert_one(new_settlement)

    return {
        "success": True,
        "expenseId": str(result.inserted_id)
    }

@app.post("/expense_details")
async def expense_details(request: GroupIdRequest):
    if expenses_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    expenses = expenses_collection.find({"groupId": request.groupId})

    return [
        {
            "expenseId": str(exp["_id"]),
            "paidBy": exp["paidBy"],
            "cost": exp["cost"],
            "description": exp["description"],
            "category": exp["category"],
            "splits": exp["splits"],
            "Day": exp["Day"]
        }
        for exp in expenses
    ]


@app.get("/group/{groupId}")
async def get_group_info(groupId: str):
    """Get group information"""
    if groups_collection is None:

        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        group = groups_collection.find_one({"_id": ObjectId(groupId)})
        if not group:
            return {"success": False, "message": "Group not found"}
        
        return {
            "success": True,
            "groupId": str(group.get("_id")),
            "groupName": group.get("groupName"),
            "amount": group.get("amount"),
            "members": group.get("members", [])
        }
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.get("/group/{groupId}/expenses")
async def get_group_expenses(groupId: str):
    """Get expenses for a group"""
    if expenses_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    expenses = expenses_collection.find({"groupId": groupId})
    
    result = []
    for exp in expenses:
        result.append({
            "expenseId": str(exp.get("_id")),
            "paidBy": exp.get("paidBy"),
            "cost": exp.get("cost"),
            "description": exp.get("description"),
            "category": exp.get("category", ""),
            "splits": exp.get("splits", []),
            "Day": exp.get("Day")
        })
    
    return result

@app.post("/add_group_member")
async def add_group_member(request: AddGroupMemberRequest):
    """Add member to group"""
    if groups_collection is None:

        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        groups_collection.update_one(
            {"_id": ObjectId(request.groupId)},
            {"$push": {"members": request.username}}
        )
        
        return {"success": True, "message": "Member added successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.post("/group_all_details")
async def get_group_all_details(request: GroupIdRequest):
    if groups_collection is None or expenses_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    group = groups_collection.find_one({"_id": ObjectId(request.groupId)})
    if not group:
        return {"success": False, "message": "Group not found"}

    expenses = expenses_collection.find({"groupId": request.groupId})
    expenses_list = []

    for exp in expenses:
        expenses_list.append({
            "expenseId": str(exp["_id"]),
            "paidBy": exp["paidBy"],
            "cost": exp["cost"],
            "description": exp["description"],
            "category": exp.get("category", ""),
            "splits": exp.get("splits", []),
            "Day": exp.get("Day")
        })

    return {
        "success": True,
        "groupId": str(group["_id"]),
        "groupName": group["groupName"],
        "groupAdmin": group.get("groupAdmin", ""),
        "members": group["members"],
        "expenses": expenses_list
    }

@app.post("/expense_details")
async def expense_details(request: GroupIdRequest):
    if expenses_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    expenses = expenses_collection.find({"groupId": request.groupId})

    return [
        {
            "expenseId": str(exp["_id"]),
            "paidBy": exp["paidBy"],
            "cost": exp["cost"],
            "description": exp["description"],
            "category": exp.get("category", ""),
            "splits": exp.get("splits", []),
            "Day": exp.get("Day")
        }
        for exp in expenses
    ]


class ExpenseIdRequest(BaseModel):
    expenseId: str

class SettleDebtRequest(BaseModel):
    username: str
    creditor: str
    groupId: str

@app.post("/settle_debt")
async def settle_debt(request: SettleDebtRequest):
    """Mark a debt as settled between two users in a group"""
    if settlements_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Delete the settlement record
        result = settlements_collection.delete_one({
            "user": request.username,
            "debtTo": request.creditor,
            "groupId": request.groupId
        })
        
        if result.deleted_count > 0:
            return {"success": True, "message": "Debt settled successfully"}
        else:
            return {"success": False, "message": "Settlement not found"}
    except Exception as e:
        return {"success": False, "message": str(e)}


class GetSettlementsRequest(BaseModel):
    username: str
    groupId: str

@app.post("/get_settlements")
async def get_settlements(request: GetSettlementsRequest):
    """Get all settlements for a user in a specific group"""
    if settlements_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        settlements = settlements_collection.find({
            "user": request.username,
            "groupId": request.groupId
        })
        
        result = []
        for settlement in settlements:
            result.append({
                "person": settlement["debtTo"],
                "amount": round(settlement["amount"], 2)
            })
        
        return result
    except Exception as e:
        print(f"Error getting settlements: {str(e)}")
        return []


class ExpenseIdRequest(BaseModel):
    expenseId: str

@app.post("/delete_expense")
async def delete_expense(request: ExpenseIdRequest):
    """Delete an expense"""
    if expenses_collection is None or settlements_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Get the expense first to reverse settlements
        expense = expenses_collection.find_one({"_id": ObjectId(request.expenseId)})
        
        if expense:
            # Reverse settlements
            paidBy = expense.get("paidBy")
            splits = expense.get("splits", [])
            groupId = expense.get("groupId")
            
            for split in splits:
                if split["username"] != paidBy and split["amount"] > 0:
                    # Find and update or delete settlement
                    existing = settlements_collection.find_one({
                        "user": split["username"],
                        "debtTo": paidBy,
                        "groupId": groupId
                    })
                    
                    if existing:
                        new_amount = existing["amount"] - split["amount"]
                        if new_amount <= 0.01:  # Remove if paid off or negligible
                            settlements_collection.delete_one({"_id": existing["_id"]})
                        else:
                            settlements_collection.update_one(
                                {"_id": existing["_id"]},
                                {"$set": {"amount": new_amount}}
                            )
        
        # Now delete the expense
        result = expenses_collection.delete_one({"_id": ObjectId(request.expenseId)})
        
        if result.deleted_count > 0:
            return {"success": True, "message": "Expense deleted successfully"}
        
        return {"success": False, "message": "Expense not found"}
    except Exception as e:
        return {"success": False, "message": str(e)}


@app.post("/deletegroup")
async def delete_group(request: GroupIdRequest):
    """Delete a group and all its expenses and settlements"""
    if groups_collection is None or expenses_collection is None or settlements_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Delete all settlements associated with the group
        settlements_collection.delete_many({"groupId": request.groupId})
        
        # Delete all expenses associated with the group
        expenses_collection.delete_many({"groupId": request.groupId})
        
        # Then delete the group
        result = groups_collection.delete_one({"_id": ObjectId(request.groupId)})
        
        if result.deleted_count > 0:
            return {"success": True, "message": "Group deleted successfully"}
        
        return {"success": False, "message": "Group not found"}
    except Exception as e:
        return {"success": False, "message": str(e)}


class RemoveMemberRequest(BaseModel):
    groupId: str
    username: str

@app.post("/removemember")
async def remove_member(request: RemoveMemberRequest):
    """Remove a member from a group"""
    if groups_collection is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        result = groups_collection.update_one(
            {"_id": ObjectId(request.groupId)},
            {"$pull": {"members": {"username": request.username}}}
        )
        
        if result.modified_count > 0:
            return {"success": True, "message": "Member removed successfully"}
        
        return {"success": False, "message": "Failed to remove member"}
    except Exception as e:
        return {"success": False, "message": str(e)}


if __name__ == "__main__":
    print("\n" + "="*50)
    print("Starting FastAPI Backend Server...")
    print("Server running at: http://localhost:8000")
    print("API Docs at: http://localhost:8000/docs")
    print("="*50 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")