import React from 'react'
import SUCCESSIMAGE from '../assest/succes.png'
import { Link } from 'react-router-dom'


export const Success = () => {
  return (
    <div  class="bg-slate-200 w-full max-w-md mx-auto flex justify-center items-center flex-col p-4 m-2 rounded">
      <img
        src = {SUCCESSIMAGE}
        width={150}
        height={150}
      />
      <p class="text-green-600 font-bold text-xl">Payment Successfully</p>
      <Link to ={"/order"}className='p-2 px-3 mt-5 border-2 border-green-600 rounded font-semibold text-green-600 hover: text-white'>
        See Order
      </Link>
    </div>
  )
}

export default Success