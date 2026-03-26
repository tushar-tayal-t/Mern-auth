import React from "react";

export interface AppContextType{
  isAuth: boolean;
  loading: boolean;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  logoutUser: (router: any) => Promise<void>;
  user: IUser | null;
}

export interface IUser{
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  _id: string;
}