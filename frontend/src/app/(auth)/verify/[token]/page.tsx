"use client";
import Loading from '@/components/loading';
import { BACKEND_URL } from '@/context/AppContext';
import axios from 'axios';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'

const VerifyPage = () => {
  const {token} = useParams();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(true);

  async function verifyUser() {
    if (!token) {
      setErrorMessage("Invalid token");
      return;
    }

    try {
      const {data} = await axios.post(`${BACKEND_URL}/api/v1/verify/${token}`)
      setSuccessMessage(data.message);
    } catch(error: any) {
      if (error.response?.data?.message) {
        setErrorMessage(error.response?.data?.message);
      } else if(error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Server error");
      }
    } finally {
      setVerifyLoading(false);
    }
  }

  useEffect(()=>{
    verifyUser();
  }, []);

  return (
    <>
      {
        verifyLoading ? (
          <Loading/>
        ) : (
          <div className='flex items-center justify-center w-screen h-screen'>
            {successMessage && (
              <p className="text-green-500 text-2xl">{successMessage}</p>
            )}
            {errorMessage && (
              <p className="text-red-500 text-2xl">{errorMessage}</p>
            )}
          </div>
        )
      }
    </>
  )
}

export default VerifyPage
