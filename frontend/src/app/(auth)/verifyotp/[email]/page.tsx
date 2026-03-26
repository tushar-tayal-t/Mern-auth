"use client";
import Loading from '@/components/loading';
import { BACKEND_URL, useAppData } from '@/context/AppContext';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation'
import React, { FormEvent, useEffect, useState } from 'react'
import toast from 'react-hot-toast';

const VerifyOtpPage = ({params}: {params: Promise<{email: string}>}) => {
  const param = useParams();
  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>("");
  const {setUser, setIsAuth, isAuth, loading} = useAppData();
  const router = useRouter();

  let email = "";
  if (param.email) {
    email = decodeURIComponent(param.email as string);
  }

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || otp.length !== 6) {
      toast.error("Please enter valid credentials");
      return;
    }
    setBtnLoading(true);
    try {
      const {data} = await axios.post(
        `${BACKEND_URL}/api/v1/verify`,
        {
          email,
          otp
        },
        {
          withCredentials: true
        }
      );
      toast.success(data.message);
      setUser(data.user);
      setIsAuth(true);
    } catch(error:any) {
      if (error.response?.data?.message) {
        toast.error(error.response?.data?.message);
      } else if(error.message) {
        toast.error(error.message);
      } else {
        toast.error("Server error");
      }
    } finally {
      setBtnLoading(false);
    }
  }

  useEffect(()=>{
    if (isAuth && !loading) router.push("/");
  }, [isAuth, router, loading]);

  if (loading) return <Loading/>
  return (
    <div>
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-24 mx-auto flex flex-wrap items-center">
          <div className="lg:w-3/5 md:w-1/2 md:pr-16 lg:pr-0 pr-0">
            <h1 className="title-font font-medium text-3xl text-gray-900">Testing Mern Authetication</h1>
            <p className="leading-relaxed mt-4">This is Mern auth desc</p>
          </div>
          <div className="lg:w-2/6 md:w-1/2 bg-gray-100 rounded-lg p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0">
            <h2 className="text-gray-900 text-lg font-medium title-font mb-5">Verify User otp</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="relative mb-4">
                <label htmlFor="otp" className="leading-7 text-sm text-gray-600">OTP</label>
                <input 
                  type="number" 
                  id="otp" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  required
                />
              </div>
              <button 
                disabled={btnLoading}
                type='submit' 
                className="text-white w-full bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded disabled:cursor-not-allowed disabled:bg-gray-500 text-lg"
              >{!btnLoading ? "Verify" : <span className='items-center'>Verifying... <Loader2 className='animate-spin inline'/></span>}</button>
            </form>
            <Link 
              href={"/login"} 
              className="text-sm text-blue-500 mt-3"
            >Go to login page</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default VerifyOtpPage
