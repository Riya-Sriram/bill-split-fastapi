import { useState, useEffect, useRef } from "react";
import React from "react";
import Header from "../Components/Header_other2"

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";

function profile(){
    const [username,setUsername]=useState('');
    const [passwordflag,setPasswordflag]=useState(false);
    const [newusername,setnewUsername]=useState('');
    const [result, setResult]= useState([]);
    const [oldPassword,setOldpassword]=useState('');
    const [newPassword,setNewpassword]=useState('');
    const [confirmPass,setConfirmpass]=useState('');
    const [dp,setdp]=useState(null)
    const Navigate=useNavigate();
    const fileInputRef=useRef(null);
    const MyName=localStorage.getItem("Username")
    
    const profile_details=async()=>{
      try{
        const data = await api.profile.getDetails(MyName);
        setResult(data)
        setUsername(data.username);
        setnewUsername(data.username);
      }catch(error){
        console.error("Error fetching profile details", error);
      }
    }
    useEffect(()=>{
        profile_details();
    },[]);

    const checkpassword=async(password)=>{
        try{
        const data = await api.profile.checkPassword({username: MyName, password: password});
        if (data.success){
            return true;
        }
        else{
            toast.error("Old password is wrong");
            return false;
        }
    }catch(error){
        console.error("Error checking password", error);
        return false;
    }}; 

    const updatedetails=async(newusername,password,dp)=>{
    const formData=new FormData();
    formData.append("username",MyName);
    formData.append("newusername",newusername);
    // Only append password if it's not empty
    if(password && password.trim()){
        formData.append("password",password);
    }
    if(dp) formData.append("dp",dp);
    try{
        const data = await api.profile.updateDetails(formData);
        if(data.success){
            toast.success("Profile Updated Successfully");
            localStorage.setItem("Username",newusername);
            Navigate('/main');
        }
        else{
            toast.error("Username already exists. Try another one");
            setnewUsername(MyName);
            if(passwordflag){
                setOldpassword('');
                setNewpassword('');
                setConfirmpass('');
            }
        }
    }catch(error){
        console.error("Error updating profile", error);
    }
    }


    const submithandle=async()=>{
        if (passwordflag){
            if (newPassword!==confirmPass){
                toast.error("New password and Confirm password do not match")
                setOldpassword('');
                setNewpassword('');
                setConfirmpass('');
                return;
            }
            const valid=await checkpassword(oldPassword);
            if (!valid){
                setOldpassword('');
                setNewpassword('');
                setConfirmpass('');
                return;
            }
        }
        await updatedetails(newusername,newPassword,dp)
    };
    useEffect(()=>{
        const fetchMessage=async()=>{
            try{
                const response = await fetch(`${Backend_URL}/main`,{
                    method: 'GET',
                    headers:{
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem("Token")
                    },
                });
                const data=await response.json();
                if (data.success){
                    setMessage(data.message);
                }
                else{
                    Navigate("/");
                    toast.error("Access Denied");
                    }
            }catch (error){
                setMessage("Error");
            }
        };
        fetchMessage();
    },[Navigate]);
    
    return(
        <div className="gap-y-4 mt-24 mb-20 min-h-screen justify-start bg-slate-100 p-4 font-sans">
        <Header />
        <div className="p-6 max-w-lg mx-auto mt-16 bg-white shadow-lg rounded-lg border border-black">
            <div className="grid grid-cols-1 place-items-center">
                <h2 className="text-3xl font-bold mb-6 text-cente text-black underline underline-offset-4 text-center">Edit Profile</h2>
                <div className="relative w-32 h-32">
                    <img
                    src={result.dp}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-2 border-black"/>
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-sm opacity-0 hover:opacity-100 cursor-pointer rounded-full transition"
                        onClick={()=>fileInputRef.current.click()}
                        >
                            Change Profile Pic
                    </div>
                    <input 
                    type='file'
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e)=>{
                        const file=e.target.files[0];
                        if (file){
                            if (file.size>5*1024*1024){
                                toast.error("Profile Picture should not exceed 5MB");
                                return;
                            }
                            setdp(file)
                            setResult(prev=>({...prev,dp:URL.createObjectURL(file)}));
                        }
                    }}/>
                </div>
                <div className="mt-9">
                    <label className="font-bold text-black text-xl mr-3">Username: </label>
                    <input
                        type="text"
                        value={newusername}
                        onChange={(e)=> setnewUsername(e.target.value)}
                        className="mb-4 col-span-2 bg-white pl-1 border-black border-2 text-black w-auto"/>
                </div>
                <button 
                className="btn btn-square w-auto p-2 text-white bg-blue-800 mb-4"
                onClick={()=>setPasswordflag(!passwordflag)}>Change Password</button>
                {passwordflag &&
                <div className="grid grid-cols-1">
                    <label className="font-bold text-black text-xl mr-3">Enter Old Password</label>
                    <input
                        type="password"
                        value={oldPassword}
                        onChange={(e)=> setOldpassword(e.target.value)}
                        className="mb-4 col-span-2 bg-white pl-1 border-black border-2 text-black w-auto"/>
                    <label className="font-bold text-black text-xl mr-3">Enter New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e)=> setNewpassword(e.target.value)}
                        className="mb-4 col-span-2 bg-white pl-1 border-black border-2 text-black w-auto"/>
                    <label className="font-bold text-black text-xl mr-3">Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPass}
                        onChange={(e)=> setConfirmpass(e.target.value)}
                        className="mb-4 col-span-2 bg-white pl-1 border-black border-2 text-black w-auto"/>
                </div>
                }
                <button className="btn btn-square w-auto px-8 text-white bg-green-800 text-xl" onClick={submithandle}>Submit</button>
            </div>
        </div>
        
        </div>
    )
}

export default profile