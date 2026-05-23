import React from 'react';
import GoogleButton from '../components/GoogleButton'; // ปรับ path ให้ตรงกับที่เก็บไฟล์

export default function Login() {
  return (
    <div className="p-20 text-center">
      <h1 className="text-xl font-bold">เข้าสู่ระบบ</h1>
      <div className="mt-4">
        <GoogleButton />
      </div>
    </div>
  );
}