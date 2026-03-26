"use client";
import { AppContextType, IUser } from "@/types";
import { createContext, ReactNode, useContext, useEffect, useState } from "react"
import toast, { Toaster } from "react-hot-toast";
import api from "@/lib/api";

export const BACKEND_URL = "http://localhost:5000"  

const AppContext = createContext<AppContextType | undefined>(undefined);
export const AppContextPage = ({children}: {children: ReactNode}) => {
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<IUser | null>(null);

  async function fetchUser() {
    try {
      const { data } = await api.get(`${BACKEND_URL}/api/v1/me`);
      setUser(data.user);
      setIsAuth(true);
    } catch(error: any) {
      setUser(null);
      setIsAuth(false);
      if (error.response?.data?.message) {
        console.error(error.response?.data?.message);
      } else if(error.message) {
        console.error(error.message);
      } else {
        console.error("Server error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function logoutUser(router: any) {
    try {
      const {data} = await api.post(`${BACKEND_URL}/api/v1/logout`);
      toast.success(data.message);
      setIsAuth(false);
      setUser(null);
      router.push("/login");
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
    fetchUser();
  }, []);

  return (
    <AppContext.Provider 
      value={{
        isAuth,
        loading,
        setIsAuth,
        setUser,
        logoutUser,
        user
      }}
    >
      {children}
      <Toaster/>
    </AppContext.Provider>
  )
}

export default AppContext;

export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used within AppProvider")
  }
  return context;
}
