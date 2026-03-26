"use client";
import Loading from '@/components/loading';
import { useAppData } from '@/context/AppContext'
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'

const HomePage = () => {
  const {loading, isAuth, logoutUser, user} = useAppData();
  const router = useRouter();

  useEffect(()=>{
    if (!isAuth && !loading) router.push("/login");
  }, [isAuth, router, loading]);

  if (loading) return <Loading/>
  return (
    <div className='flex w-25 m-auto mt-40'>
      <button 
        className='bg-red-500 text-white p-2 rounded-md cursor-pointer' 
        onClick={() => logoutUser(router)}
      >Logout</button>

      {
        user 
          && user.role === "admin" 
          && <Link className='bg-purple-500 text-white p-2 rounded-md cursor-pointer' href={"/dashboard"}>Dashboard</Link>
      }
    </div>
  )
}

export default HomePage
