import { useState, useEffect, useRef } from "react";
import React from "react";
import Header from "../Components/Header_other2"

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Chart from '../Components/charts';
import { api } from "../services/api";

const Group=() =>{
    const [expenses, setExpenses]=useState([]);
    const [category, setCategory]=useState('');
    const [split, setSplit]=useState({});
    const [total,setTotal]=useState(0);
    const [description,SetDescription]=useState('');
    const [open, setOpen]= useState(false);
    const [result, setResult]= useState('');
    const [message, setMessage]= useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmDeleteExpense, setConfirmDeleteExpense] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const Navigate=useNavigate();
    const link=new URLSearchParams(location.search);
    const groupId=link.get("groupId")||'';

    function topay(){
        let pay=0;
        for (let i=0;i<expenses.length;i++){
            const exp=expenses[i];
            if (exp.paidBy!==MyName){
                const split=exp.splits.find(s=>s.username===MyName);
                if (split){
                    pay+=split.amount;
                }
            }
        }
        return pay;
    }
    function tocollect(){
        let collect=0;
        for (let i=0;i<expenses.length;i++){
            const exp=expenses[i];
            if (exp.paidBy===MyName){
                const split=exp.splits.find(s=>s.username===MyName);
                if (split){
                    collect+=exp.cost-split.amount
                }
            }
        }
        return collect;
    }
    const GroupNames=async()=>{
      try{
        const data = await api.group.getGroupInfo(groupId);
        setResult(data);
      }catch(error){
        console.error("Error fetching group details", error);
      }
    }

    const ExpenseNames=async()=>{
        try{
            const data = await api.expense.getExpenses(groupId);
            setExpenses(data);
        }catch(error){
            console.error("Error fetching expenses", error);
        }
    }

    const deleteGroup=async()=>{
        try{
            const data = await api.group.deleteGroup(groupId);
            if (data.success){
                toast.success("Group Deleted");
                Navigate('/main');
            }
            else{
                toast.error("Error");
            }
        }catch(error){
            toast.error("Error deleting group");
        }
    }
    
    const AddExpense=async()=>{
        try{
            const fullsplit={};
            result.members.forEach(member=>{
                fullsplit[member.username]=parseFloat(split[member.username])||(100/result.members.length);
            })
            if (!description){
                return toast.error("Expense Name cannot be empty")
            }
            else if(!category){
                return toast.error("Category cannot be empty")
            }
            const List=Object.entries(split);
            let sum=0;
            for (let i=0;i<List.length;i++){
                sum+=Number(List[i][1]);
            }
            if (sum>100){
                setSplit({});
                return toast.error("Sum of Percentage Cannot be Greater than 100")
            }
            const data = await api.expense.addExpense({groupId,split:fullsplit,description,paidBy:MyName,total,category});
            if (data.success){
                setTotal('');
                setOpen(false);
                setSplit({})
                SetDescription('')
                setCategory('')
                GroupNames();
                ExpenseNames();
                return toast.success("Expense Added Succesfully");
            }
        }catch(error){

        }
    }
    const DeleteExpense=async(expenseId)=>{
        try{
            const data = await api.expense.deleteExpense(expenseId);
            if (data.success){
                toast.success("Expense Removed");
                ExpenseNames();
            }
            else toast.error("Error")
        }catch(err){
            toast.error("Error deleting expense");
        }
    }
    const RemoveMem=async(groupId,username)=>{
        try{
            const data = await api.group.removeGroupMember(groupId, username);
            if (data.success){
                toast.success("Member Removed");
                GroupNames();
            }
            else{
                toast.error("Error");
            }
        }catch(error){
            toast.error("Error removing member");
        }
    }
    useEffect(()=>{
        GroupNames();
        const interval=setInterval(()=>{
            GroupNames();
        }, 2000);
        return()=> clearInterval(interval);
    }, []);

    useEffect(()=>{
        ExpenseNames();
        const interval=setInterval(()=>{
            ExpenseNames();
        }, 2000);
        return()=> clearInterval(interval);
    }, []);


    const MyName=localStorage.getItem("Username")

    function Capitalize(word){
        if (MyName===word){
            return "You"
        }
        const words=word.split(' ')
        let temp='';
        for (let j=0;j<words.length;j++){
            temp+=words[j].charAt(0).toUpperCase()+ words[j].slice(1)+' ';
        }
        return temp;
    }
    
    useEffect(()=>{
        const fetchMessage=async()=>{
            try{
                const data = await api.main.getMainData();
                if (data.success){
                    setMessage(data.message);
                }
                else{
                    Navigate("/");
                    toast.error("Access Denied");
                    }
            }catch (error){
                setMessage("Error");
                console.error("Error fetching main data", error);
            }
        };
        fetchMessage();
    },[Navigate]);

    return(
        <div className="min-h-screen w-full bg-slate-100">
        <div className="gap-y-4 mt-24 mb-20 flex flex-col justify-start p-4 font-sans">
        <Header />
        <Chart result={result} myName={MyName} expenses={expenses} groupId={groupId}/>
        {result && Array.isArray(result.members) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full items-start border-4 border-black gap-x-3 gap-y-4">
            <div className="text-black font-bold text-4xl text-center col-span-1 sm:col-span-2 lg:col-span-3">
                {result.groupName}
            </div>
            {result.members.map((member) => (
                <div
                key={member.username}
                className="bg-white p-4 rounded-xl shadow border hover:bg-gray-100 transition"
                >
                <div className="flex justify-between items-start">
                    <div className="flex flex-col flex-1">
                    <div className="text-lg font-bold text-black">
                        {Capitalize(member.username)}
                    </div>
                    <div className="text-base text-gray-800">
                        Amount: ₹{member.amount}
                    </div>
                </div>
                <div className="grid grid-cols-1">
                    {member.username===MyName &&<div className="col-span-1 text-right text-gray-800">
                        <div>To Collect: ₹{tocollect()}</div>
                        <div>To Pay: ₹{topay()}</div>
                    </div>}
                </div>
                    {result.groupAdmin === MyName && member.username !== MyName && (
                    <button
                        onClick={() => RemoveMem(result.groupId, member.username)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-700 text-sm ml-4">
                        - Remove Member
                    </button>
                    )}
                </div>
                </div>
            ))}
            </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <button 
            className="px-2 py-2 bg-yellow-300 text-black text-lg rounded hover:bg-yellow-400"
            onClick={()=>setOpen(true)}>
                + Add Expense
            </button>
            <button 
            className="px-2 py-2 bg-red-500 text-white rounded hover:bg-red-700 text-lg"
            onClick={()=>setConfirmDelete(true)}>
                Delete Group
            </button>
        </div>
        {expenses.map((exp,idx)=>(
            <div
            key={exp.expenseId}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full items-start border-4 border-black gap-x-3 gap-y-4">
                <div className="col-span-full grid grid-cols-3">
                    <h2 className="text-4xl col-span-2 text-black font-bold ml-4">{exp.description}</h2>
                    <h2 className="text-lg col-span-1 text-gray-600 font-semibold pr-2 text-end">{new Date (exp.Day).toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true})}</h2>
                    <div className="ml-4 text-2xl text-black font-bold col-span-2">{`Category : ${exp.category}`}</div>
                    <div className="pr-2 text-2xl text-black font-bold col-span-1 text-end">{`Paid By : ${Capitalize(exp.paidBy)}`}</div>
                    <div className="ml-4 text-2xl text-black font-bold col-span-full">{`Amount : ₹ ${exp.cost}`}</div>
                    <div className="p-3 grid col-span-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 justify-between gap-4">
                        {exp.splits.map((member) => (
                        <div
                        key={member.username}
                        className="col-span-1 bg-white p-4 rounded-full border-2 border-black transition"
                        >
                        <div className="flex">
                            <div className="flex flex-col flex-1">
                            <div className="text-lg font-bold text-black text-center">
                            {Capitalize(member.username)}
                            </div>
                            <div className="text-base text-gray-800 text-center">
                                Amount Split: ₹{member.amount}
                            </div>
                        </div>
                </div>
                </div>
            ))}
            {(exp.paidBy===MyName)&&<div className="col-span-full">
                <button 
                    className="col-span-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 text-sm text-center w-full"
                    onClick={()=>setConfirmDeleteExpense(exp.expenseId)}>
                        Delete Expense
                </button>
            </div>}
            </div>
            </div>
            </div>
        ))}
        
        {open && (
            <div 
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
                onClick={() => setOpen(false)}
            >
                <div 
                    className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-t-2xl">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-bold text-white tracking-tight">Add Your Expense</h2>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-slate-400 hover:text-white hover:bg-slate-700 px-3 py-1 rounded-lg transition-all text-xl font-semibold"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Expense Details Section */}
                        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-slate-200">
                            <h3 className="text-xl font-bold text-slate-800 mb-5 pb-2 border-b-2 border-slate-200">
                                Expense Details
                            </h3>
                            
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                        Expense Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter expense name..."
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all font-medium"
                                        value={description}
                                        onChange={(e) => SetDescription(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                        Amount Paid
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Enter amount spent..."
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all font-medium"
                                        value={total}
                                        onChange={(e) => setTotal(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                        Category
                                    </label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setDropdownOpen(!dropdownOpen)}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-left text-slate-900 font-medium hover:border-slate-700 focus:border-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all"
                                        >
                                            {category || 'Select Category'}
                                        </button>
                                        
                                        {dropdownOpen && (
                                            <div className="absolute z-10 w-full mt-2 bg-white border-2 border-slate-300 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                                                {[
                                                    { name: 'Food', color: 'from-orange-400 to-red-500' },
                                                    { name: 'Transportation', color: 'from-blue-400 to-cyan-500' },
                                                    { name: 'Accomodation', color: 'from-purple-400 to-pink-500' },
                                                    { name: 'Entertainment', color: 'from-pink-400 to-rose-500' },
                                                    { name: 'Shopping', color: 'from-green-400 to-emerald-500' },
                                                    { name: 'Health', color: 'from-red-400 to-pink-500' },
                                                    { name: 'Miscellaneous', color: 'from-gray-400 to-slate-500' }
                                                ].map((cat) => (
                                                    <button
                                                        key={cat.name}
                                                        onClick={() => {
                                                            setCategory(cat.name);
                                                            setDropdownOpen(false);
                                                        }}
                                                        className={`w-full px-4 py-3 text-left font-medium hover:bg-gradient-to-r ${cat.color} hover:text-white transition-all ${
                                                            category === cat.name ? `bg-gradient-to-r ${cat.color} text-white` : 'text-slate-800'
                                                        }`}
                                                    >
                                                        {cat.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Split Section */}
                        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-slate-200">
                            <div className="flex justify-between items-center mb-5 pb-2 border-b-2 border-slate-200">
                                <h3 className="text-xl font-bold text-slate-800">
                                    Percentage Share
                                </h3>
                                <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
                                    (Object.values(split).reduce((sum, val) => sum + (parseFloat(val) || 0), 0) === 100 || Object.values(split).reduce((sum, val) => sum + (parseFloat(val) || 0), 0) === 0) 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    Total: {Object.values(split).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toFixed(1)}%
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {result.members && result.members.map((member) => (
                                    <div key={member.username} className="flex items-center gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                            {Capitalize(member.username)[0]}
                                        </div>
                                        <label className="flex-shrink-0 text-slate-800 font-bold text-base min-w-[100px]">
                                            {Capitalize(member.username)}
                                        </label>
                                        <div className="flex-grow relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={split[member.username] ?? ''}
                                                placeholder={(100 / result.members.length).toFixed(2)}
                                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all font-medium"
                                                onChange={(e) => {
                                                    setSplit(prev => ({
                                                        ...prev,
                                                        [member.username]: e.target.value
                                                    }));
                                                }}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                                                %
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 p-4 bg-slate-100 rounded-lg border-l-4 border-slate-600">
                                <p className="text-sm text-slate-700 font-medium">
                                    <span className="font-bold">Note:</span> Leave the field blank or enter 0 if the member didn't contribute
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button 
                                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 py-4 px-6 text-xl font-bold text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                                onClick={AddExpense}
                            >
                                Create Expense
                            </button>
                            <button 
                                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 py-4 px-6 text-xl font-bold text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                                onClick={() => {
                                    setOpen(false);
                                    setSplit({});
                                    SetDescription('');
                                    setCategory('');
                                    setTotal('');
                                    setDropdownOpen(false);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {/* Delete Group Confirmation Modal */}
        {confirmDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={()=>setConfirmDelete(false)}>
                <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md border-4 border-red-500" onClick={(e)=>e.stopPropagation()}>
                    <div className="flex flex-col items-center">
                        <div className="text-6xl mb-4">🗑️</div>
                        <h2 className="text-3xl text-black font-bold text-center mb-4">Delete Group?</h2>
                        <p className="text-gray-700 text-center mb-6">
                            This action cannot be undone. All expenses and data will be permanently deleted.
                        </p>
                        <div className="flex gap-4 w-full">
                            <button 
                                className="flex-1 px-4 py-3 bg-red-600 text-white text-lg rounded-xl hover:bg-red-700 font-semibold"
                                onClick={()=>{
                                    deleteGroup();
                                    setConfirmDelete(false);
                                }}>
                                Yes, Delete
                            </button>
                            <button 
                                className="flex-1 px-4 py-3 bg-gray-300 text-black text-lg rounded-xl hover:bg-gray-400 font-semibold"
                                onClick={()=>setConfirmDelete(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {/* Delete Expense Confirmation Modal */}
        {confirmDeleteExpense && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={()=>setConfirmDeleteExpense(null)}>
                <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md border-4 border-red-500" onClick={(e)=>e.stopPropagation()}>
                    <div className="flex flex-col items-center">
                        <div className="text-6xl mb-4">🗑️</div>
                        <h2 className="text-3xl text-black font-bold text-center mb-4">Delete Expense?</h2>
                        <p className="text-gray-700 text-center mb-6">
                            Are you sure you want to delete this expense? This action cannot be undone.
                        </p>
                        <div className="flex gap-4 w-full">
                            <button 
                                className="flex-1 px-4 py-3 bg-red-600 text-white text-lg rounded-xl hover:bg-red-700 font-semibold"
                                onClick={()=>{
                                    DeleteExpense(confirmDeleteExpense);
                                    setConfirmDeleteExpense(null);
                                }}>
                                Yes, Delete
                            </button>
                            <button 
                                className="flex-1 px-4 py-3 bg-gray-300 text-black text-lg rounded-xl hover:bg-gray-400 font-semibold"
                                onClick={()=>setConfirmDeleteExpense(null)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </div>
        </div>
    )
}

export default Group;