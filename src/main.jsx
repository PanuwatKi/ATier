import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // 👈 จุดสำคัญ: เช็คว่าสะกดชื่อไฟล์ App ถูกต้องและเป็นตัวหนาตัวพิมพ์ใหญ่ตรงกันไหม
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)