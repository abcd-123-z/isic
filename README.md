# Yotra Music — Personal Music Player

## เปิดใช้งาน
แนะนำให้รันผ่าน local server เพราะ File System Access API ต้องการ secure context

```bash
cd yotra_music
python -m http.server 8080
```

จากนั้นเปิด:
http://localhost:8080

กด **เพิ่มโฟลเดอร์เพลง** แล้วเลือกโฟลเดอร์เพลงของคุณ

## ฟีเจอร์ใน MVP
- เล่นเพลงจากโฟลเดอร์ในเครื่อง
- ค้นหา
- รายการโปรด
- Previous / Next
- Shuffle / Repeat
- Seek / Volume
- PWA
- Media Session API สำหรับ media controls ของระบบ/หน้าจอล็อกที่ browser และ OS รองรับ

## หมายเหตุ
เวอร์ชันนี้ไม่อัปโหลดเพลงไปเซิร์ฟเวอร์ เพลงอ่านจากเครื่องของคุณโดยตรง
การเล่นขณะปิดหน้าจอและ lock-screen controls ขึ้นกับ browser, Android/iOS และวิธีติดตั้ง PWA
ถ้าต้องการประสบการณ์ Android ที่เสถียรกว่า ขั้นต่อไปควรห่อด้วย Capacitor และเพิ่ม native background audio service.
