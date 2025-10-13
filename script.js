// =====================================================================
// ** ต้องแทนที่ด้วย Web App URL ที่คุณคัดลอกมาจาก Apps Script Deployment **
// URL นี้จะทำหน้าที่เป็น API Endpoint สำหรับการส่งและรับข้อมูล
// =====================================================================
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzWXQR6CwmAAxglnfvDKQfW09Eu80zA0bxwhjgOUQCzpfMiYxQiNsp2FcUu0hR5oe0tFw/exec'; 

// =====================================================================
// ฟังก์ชันหลักสำหรับการสื่อสารกับ Apps Script API (ใช้ POST สำหรับทุก Action)
// =====================================================================
const sendDataToApi = async (data, action, status) => {
    // เพิ่ม action และ status เข้าไปใน object ข้อมูลที่จะส่ง
    if (action) data.action = action;
    if (status) data.status = status;
    
    const payload = JSON.stringify(data);

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            // ต้องระบุ Content-Type เป็น text/plain สำหรับ Apps Script
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', 
            },
            body: payload
        });

        if (response.ok) {
            const result = await response.json();
            if (result.status === 'success') {
                // ถ้าไม่ใช่ action ดึงข้อมูล ให้แสดง alert และนำกลับหน้าหลัก
                if (action !== 'getCaseList') {
                    alert(`สำเร็จ! ${result.message}`);
                    window.location.href = './index.html'; 
                }
                return result;
            } else {
                alert(`เกิดข้อผิดพลาดจาก Server: ${result.message}`);
                return result;
            }
        } else {
            alert(`การเชื่อมต่อ API ล้มเหลว: ${response.statusText}`);
            return { status: 'error', message: response.statusText };
        }
    } catch (error) {
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาดในการส่งข้อมูล: กรุณาตรวจสอบ Web App URL และการตั้งค่าใน Apps Script');
        return { status: 'error', message: error.message };
    }
};

// =====================================================================
// การจัดการ Logic สำหรับหน้า 'case_form.html'
// =====================================================================
const handleCaseForm = () => {
    const form = document.getElementById('case-report-form');
    const closeCaseBtn = document.getElementById('close-case-btn');
    const cancelCaseBtn = document.getElementById('cancel-case-btn');
    
    // Listener สำหรับปุ่ม "บันทึกเคส" (Submit form)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // ตรวจสอบความถูกต้องของ Checkbox อาการสำคัญ
        const selectedComplaints = Array.from(form.querySelectorAll('input[name="chief_complaints"]:checked')).map(cb => cb.value);
        if (selectedComplaints.length === 0) {
            alert('กรุณาเลือกอาการสำคัญอย่างน้อย 1 รายการ');
            return;
        }

        const formData = new FormData(form);
        const data = {};
        
        // ดึงข้อมูลทั้งหมดจากฟอร์ม
        formData.forEach((value, key) => {
            if (key !== 'chief_complaints') {
                 data[key] = value;
            }
        });
        
        // จัดการ Checkbox: รวมค่าทั้งหมดที่ถูกเลือกมาต่อกันด้วย "; "
        data.chief_complaints = selectedComplaints.join('; ');
        
        // ส่งข้อมูลไปยัง API ด้วย action 'saveCase' และ status 'รอติดตาม'
        sendDataToApi(data, 'saveCase', 'รอติดตาม');
    });

    // Listener สำหรับปุ่ม "ปิดเคส"
    closeCaseBtn.addEventListener('click', () => {
        if (!confirm('ยืนยันการปิดเคสหรือไม่? ระบบจะทำการ Export PDF และตั้งสถานะเป็น "ปิดเคสแล้ว"')) {
            return;
        }
        
        const form = document.getElementById('case-report-form');
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            if (key !== 'chief_complaints') {
                 data[key] = value;
            }
        });
        const selectedComplaints = Array.from(form.querySelectorAll('input[name="chief_complaints"]:checked')).map(cb => cb.value);
        data.chief_complaints = selectedComplaints.join('; ');

        // ส่ง action 'closeCase' ไปยัง Apps Script
        sendDataToApi(data, 'closeCase', 'ปิดเคสแล้ว'); 
    });
    
    // Listener สำหรับปุ่ม "ยกเลิกเคส"
    cancelCaseBtn.addEventListener('click', () => {
        if (confirm('ยืนยันการยกเลิกเคสหรือไม่? หากเคสนี้ถูกบันทึกไว้แล้ว ระบบจะลบออก')) {
            // หากเป็นเคสใหม่ ให้กลับหน้าหลัก
            window.location.href = './index.html'; 
        }
    });
};

// =====================================================================
// การจัดการ Logic สำหรับหน้า 'index.html' (Dashboard)
// =====================================================================

// ฟังก์ชันสำหรับดึงข้อมูลเคสทั้งหมดจาก Apps Script (ใช้ POST)
const fetchAllCases = async () => {
    // ส่ง action 'getCaseList' ผ่าน POST body
    const result = await sendDataToApi({}, 'getCaseList'); 
    
    if (result && result.status === 'success') {
        // *** บรรทัดสำหรับ DEBUG: แสดงข้อมูลที่ได้รับจาก Google Sheet ***
        console.log('Data received from Apps Script:', result.data); 
        renderCaseTable(result.data);
    } else {
        // หากมีข้อผิดพลาดในการดึงข้อมูล (เช่น CORS/URL)
        document.getElementById('case-table-body').innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">
            ไม่สามารถโหลดข้อมูลเคสได้: โปรดตรวจสอบ Console และการ Deploy Apps Script (โดยเฉพาะ Who has access ต้องเป็น Anyone)
        </td></tr>`;
    }
};

// ฟังก์ชันสำหรับสร้างแถวในตาราง
const renderCaseTable = (cases) => {
    const tableBody = document.getElementById('case-table-body');
    tableBody.innerHTML = ''; // ล้างข้อมูลเก่า
    
    if (!cases || cases.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">ไม่พบข้อมูลเคส</td></tr>`;
        return;
    }

    cases.forEach(c => {
        // Mapping Index: R=17 (Status), E=4 (Patient Name), F=5 (Tel), L=11 (Chief Complaints), A=0 (Timestamp)
        const statusText = c[17];
        const statusClass = statusText === 'รอติดตาม' 
            ? 'bg-orange-100 text-orange-800' 
            : 'bg-green-100 text-green-800';

        const row = document.createElement('tr');
        row.classList.add('hover:bg-indigo-50/50', 'cursor-pointer');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                <a href="./case_form.html?case_id=${c[1]}" class="text-indigo-600 hover:text-indigo-800">${c[4]}</a>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">${c[5] || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${c[11] ? c[11].split(';')[0] : 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">${c[0] ? new Date(c[0]).toLocaleDateString('th-TH') : 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${statusText}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="./case_form.html?case_id=${c[1]}" class="text-indigo-600 hover:text-indigo-900">ดู/แก้ไข</a>
            </td>
        `;
        tableBody.appendChild(row);
    });
};

const handleDashboard = () => {
    // Listener สำหรับปุ่ม '+ เพิ่มเคส'
    document.getElementById('add-case-btn').addEventListener('click', () => {
        window.location.href = './case_form.html';
    });
    
    // Listener สำหรับปุ่ม ส่งต่อ/ADR
    document.getElementById('refer-patient-btn').addEventListener('click', () => {
        alert('ฟังก์ชัน "ส่งต่อผู้ป่วย" จะถูกเพิ่มในขั้นตอนถัดไป');
    });
    document.getElementById('adr-report-btn').addEventListener('click', () => {
        alert('ฟังก์ชัน "รายงานอาการไม่พึงประสงค์" จะถูกเพิ่มในขั้นตอนถัดไป');
    });

    // โหลดข้อมูลเคสทันทีที่ Dashboard เปิด
    fetchAllCases();
};


// =====================================================================
// Entry Point: ตรวจสอบว่ากำลังทำงานอยู่บนหน้าไหน
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    // ถ้า URL มี 'case_form.html' ให้รัน Logic ของฟอร์ม
    if (window.location.pathname.includes('case_form.html')) {
        handleCaseForm();
    } 
    // ถ้า URL มี 'index.html' (หรือเป็น Root) ให้รัน Logic ของ Dashboard
    else if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
        handleDashboard();
    }
});
