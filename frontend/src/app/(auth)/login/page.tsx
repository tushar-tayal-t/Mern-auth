"use client";
import Loading from '@/components/loading';
import { BACKEND_URL, useAppData } from '@/context/AppContext';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast';

type FormData = {
  email: string;
  password: string;
}

const LoginPage = () => {
  const {register, handleSubmit, formState: {errors}} = useForm<FormData>();
  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const router = useRouter();
  const {loading, isAuth} = useAppData();

  const handleFormSubmit = async(data: FormData) => {
    const {email, password} = data;
    setBtnLoading(true);
    try{
      const {data} = await axios.post(`${BACKEND_URL}/api/v1/login`, {
        email,
        password
      });
      toast.success(data.message);
      router.push(`/verifyotp/${encodeURIComponent(email)}`);
    } catch(error: any) {
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
            <h2 className="text-gray-900 text-lg font-medium title-font mb-5">Sign In</h2>
            <form onSubmit={handleSubmit(handleFormSubmit)}>
              <div className="relative mb-4">
                <label htmlFor="email" className="leading-7 text-sm text-gray-600">Email</label>
                <input 
                  type="text" 
                  id="email" 
                  {...register("email", 
                    {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email address"
                      }
                    }
                  )} 
                  className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                />
                {errors.email && <p className='text-red-400'>{errors.email.message}</p>}
              </div>
              <div className="relative mb-4">
                <label htmlFor="password" className="leading-7 text-sm text-gray-600">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  {...register("password",
                    {
                      required: "Please enter the password",
                      minLength: {
                        value: 8,
                        message: "Please enter the valid password"
                      }
                    }
                  )}
                  className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                />
                {errors.password && <p className='text-red-400'>{errors.password.message}</p>}
              </div>
              <button 
                disabled={btnLoading}
                type='submit' 
                className="text-white w-full bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded disabled:cursor-not-allowed disabled:bg-gray-500 text-lg"
              >{!btnLoading ? "Login" : <span className='items-center'>Logging In... <Loader2 className='animate-spin inline'/></span>}</button>
            </form>
            <p className="text-sm text-gray-500 mt-3">Don't have an account? <Link className='text-blue-500' href={"/register"}>Register</Link></p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LoginPage
