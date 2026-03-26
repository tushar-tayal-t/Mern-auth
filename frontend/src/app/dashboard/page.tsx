"use client";
import Loading from '@/components/loading';
import { BACKEND_URL, useAppData } from '@/context/AppContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [content, setContent] = useState<any>();
  const {isAuth, loading} = useAppData();
  const router = useRouter();

  async function fetchAdminData() {
    try {
      const {data} = await api.get(`/api/v1/admin`);

      setContent(data.message);
    } catch(error: any) {
      if (error.response?.data?.message) {
        toast.error(error.response?.data?.message);
      } else if(error.message) {
        toast.error(error.message);
      } else {
        toast.error("Server error");
      }
    }
  }

  useEffect(()=>{
    fetchAdminData();
  }, []);

  useEffect(()=>{
    if (!isAuth && !loading) router.push("/login");
  }, [isAuth, router, loading]);

  if (loading) return <Loading/>
  return (
    <div>
      <p>The message is: <br/></p>
      {content && <div>{content}</div>}
    </div>
  )
}

export default Dashboard
