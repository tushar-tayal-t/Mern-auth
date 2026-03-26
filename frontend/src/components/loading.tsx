"use client";
import { Loader2 } from 'lucide-react'

const Loading = () => {
  return (
    <div className='max-h-screen max-w-screen flex h-screen w-screen bg-black items-center justify-center'>
      <Loader2 className='animate-spin text-white'/>
    </div>
  )
}

export default Loading
