import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import toast from "react-hot-toast";

function Header() {
    const Navigate = useNavigate();
    const location = useLocation();
    const inputbox = useRef(null);

    const link = new URLSearchParams(location.search);
    const initialvalue = link.get("username") || '';
    const [searchkey, setSearchKey] = useState(initialvalue);
    const Backend_URL = import.meta.env.VITE_backend_url;

    const [dp, setDp] = useState('');

    useEffect(() => {
        const fetchDP = async () => {
            const res = await fetch(Backend_URL + "/profile_details", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: localStorage.getItem("Username") })
            });
            const data = await res.json();
            setDp(data.dp[0]);
        };
        fetchDP();
    }, []);

    const deleteAccount = async () => {
        try {
            const lists = await fetch(`${Backend_URL}/delete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': localStorage.getItem("Token")
                },
                body: JSON.stringify({ myname: localStorage.getItem("Username") }),
            });
            const data = await lists.json();
            if (data.success) {
                toast.success("Account Deleted Successfully");
                document.getElementById('my_modal_1').close();
                Navigate('/');
            } else {
                toast.error("Account Deletion Failed");
                document.getElementById('my_modal_1').close();
            }
        } catch (error) { }
    }

    useEffect(() => {
        if (initialvalue !== '' && inputbox.current) {
            inputbox.current.focus();
        }
    }, [initialvalue]);

    let names = localStorage.getItem("Username");
    let temp = '';
    names = names.split(' ');
    for (let j = 0; j < names.length; j++) {
        temp += names[j].charAt(0).toUpperCase() + names[j].slice(1) + ' ';
    }
    names = temp;

    return (
        <header className="fixed top-0 left-0 right-0 w-full bg-black text-white py-4 z-50 border-b border-white shadow-md backdrop-blur-sm">
            <div className="grid grid-cols-2 items-center px-6 gap-5">
                <div className="flex justify-start gap-4 items-center">
                    <h1 className="text-3xl font-semibold tracking-wide text-white font-sans">
                        Bill Split
                    </h1>
                    <button
                        onClick={() => Navigate("/main")}
                        className="p-2 rounded hover:shadow-[0_0_10px_rgba(255,255,255,0.4)] transition-shadow duration-200"
                        title="Home"
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                        </svg>
                    </button>
                </div>

                <div className="grid justify-end">
                    <div className="dropdown dropdown-end ml-3">
                        <div tabIndex="0" role="button"
                            className="btn btn-ghost btn-circle avatar border border-white hover:shadow-[0_0_10px_rgba(255,255,255,0.4)] transition-shadow duration-200">
                            <div className="w-10 rounded-full">
                                <img
                                    src={dp || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"}
                                    alt="profile"
                                />
                            </div>
                        </div>
                        <ul
                            tabIndex="0"
                            className="menu menu-sm dropdown-content bg-black text-white rounded-box z-10 mt-3 w-52 p-2 border border-white shadow-md">
                            <h1 className="text-lg p-3">{names}</h1>
                            <li><a onClick={() => Navigate("/profile")}>Change Profile Details</a></li>
                            <li>
                                <a>
                                    <button
                                        className="hover:shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-shadow duration-200"
                                        onClick={() => document.getElementById('my_modal_1').showModal()}
                                    >
                                        Delete Account
                                    </button>
                                </a>
                            </li>
                            <div className="grid place-items-center py-2">
                                <li>
                                    <a className="w-20 btn bg-red-500 text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-shadow duration-200"
                                        onClick={() => Navigate("/")}>
                                        Logout
                                    </a>
                                </li>
                            </div>
                        </ul>

                        <dialog id='my_modal_1' className="modal">
                            <div className="modal-box bg-black text-white border border-white">
                                <h3 className="font-semibold text-lg">Confirm Deletion</h3>
                                <p className="py-4">Are you sure you want to delete your account? This action cannot be undone.</p>
                                <div className="modal-action flex gap-2">
                                    <button
                                        className="btn bg-red-600 text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-shadow duration-200"
                                        onClick={deleteAccount}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        className="btn bg-white text-black hover:shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-shadow duration-200"
                                        onClick={() => document.getElementById('my_modal_1').close()}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </dialog>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
