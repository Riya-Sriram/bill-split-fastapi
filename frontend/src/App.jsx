import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom'
import Log from './Pages/login';
import Sign from './Pages/signup';
import MainPage from './Pages/MainPage';
import Search from './Pages/Search';
import Group from './Pages/group_create';
import Groupdetails from './Pages/group';
import Profile from './Pages/Profiledetails';
import Internet from './Pages/internet';
import ForgotPassword from './Pages/forgotpassword';
import ProtectedRoute from './Components/ProtectedRoute';

function App(){
  const [loading, setLoading]=useState(true);
  useEffect(()=>{
    const time=setTimeout(()=> setLoading(false),1000);
    return ()=> clearTimeout(time);
  },[]);
  
  if (loading){
    return(
      <div className='h-screen w-screen flex flex-col items-center justify-center bg-black text-white'>
        <div><h2 className="text-3xl font-bold mb-10">Brewing your Portions...</h2></div>
        <span className="loading loading-infinity loading-xl"></span>
      </div>
    )
  }
  return(
    <Routes>
        <Route element={<Internet />}>
          <Route path='/' element={<Log />} />
          <Route path='/signup' element={<Sign />} />
          <Route path='/forgotpassword' element={<ForgotPassword />} />
          <Route path='/main' element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
          <Route path='/search' element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path='/group_create' element={<ProtectedRoute><Group /></ProtectedRoute>} />
          <Route path='/group' element={<ProtectedRoute><Groupdetails /></ProtectedRoute>} />
          <Route path='/profile' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Route>
      </Routes>
  )
}
export default App;