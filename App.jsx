import React, { useState, useRef } from 'react';
import { Camera, Upload, Send, Trash2, Copy, CheckCircle, RefreshCw, UserCheck, Table as TableIcon, FileText, CloudUpload } from 'lucide-react';

const App = () => {
  const [image, setImage] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState([]);
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(localStorage.getItem('sheetUrl') || ''); 
  const fileInputRef = useRef(null);

  // ดึง API Key จาก .env (Vite)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(URL.createObjectURL(file));
        setBase64Image(reader.result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImageWithAI = async () => {
    if (!base64Image) return;
    if (!apiKey) {
      setStatus('ข้อผิดพลาด: ไม่พบ API Key ในระบบ');
      return;
    }

    setLoading(true);
    setStatus('กำลังวิเคราะห์ข้อมูลด้วย Gemini AI...');
    setResult([]);

    const prompt = `Extract info from image (Thai language). 
    Rules: 1. Prefix+FirstName (e.g. "นายสมชาย") 2. Change "น.ส." to "นางสาว" 3. Separate "lastName" 4. Extract "address" (house number only).
    Return ONLY JSON array: [{"firstName": "...", "lastName": "...", "address": "..."}]`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: base64Image } }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setResult(JSON.parse(textResponse));
      setStatus('แสกนสำเร็จ!');
    } catch (error) {
      setStatus('เกิดข้อผิดพลาดในการเชื่อมต่อ AI');
    } finally {
      setLoading(false);
    }
  };

  const saveToGoogleSheets = async () => {
    if (!sheetUrl) return alert("กรุณาใส่ Web App URL ก่อน");
    setSaving(true);
    setStatus('กำลังบันทึกลง Google Sheets...');
    
    // บันทึก URL ไว้ในเครื่องจะได้ไม่ต้องกรอกใหม่บ่อยๆ
    localStorage.setItem('sheetUrl', sheetUrl);

    try {
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });
      setStatus('บันทึกข้อมูลเรียบร้อยแล้ว!');
    } catch (error) {
      setStatus('บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  // ... (ฟังก์ชัน downloadAsNotepad และ copyToClipboard ใช้ของเดิมได้เลย)
  const copyToClipboard = () => {
    const textToCopy = result.map(item => `${item.firstName}\t${item.lastName}\t${item.address}`).join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    // ... ส่วน JSX โครงเดิมของคุณสวยอยู่แล้ว ใช้ตามนั้นได้เลยครับ
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        {/* ให้เพิ่มส่วน Input สำหรับ URL ที่คุณทำไว้เดิม */}
        <div className="max-w-6xl mx-auto">
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-800">AI Sync to Google Sheets</h1>
            </header>
            
            <div className="mb-6 max-w-2xl mx-auto">
                <input 
                    className="w-full p-2 border rounded-xl"
                    placeholder="ใส่ Google Apps Script URL ที่นี่"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                />
            </div>

            {/* ส่วนที่เหลือของ UI ... */}
        </div>
    </div>
  );
};

export default App;
