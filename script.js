// =====================================================================
// ** CONFIGURATION **
// ** ต้องแทนที่ด้วย Web App URL ที่คุณคัดลอกมาจาก Apps Script Deployment **
// =====================================================================
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzWXQR6CwmAAxglnfvDKQfW09Eu80zA0bxwhjgOUQCzpfMiYxQiNsp2FcUu0hR5oe0tFw/exec'; 

// =====================================================================
// 1. UTILITY FUNCTIONS (เหมือนเดิม)
// =====================================================================

/**
 * ฟังก์ชันสำหรับส่งข้อมูลไปยัง Apps Script API
 * @param {Object} data - ข้อมูลฟอร์ม
 * @param {string} action - 'saveCase', 'closeCase', หรือ 'deleteCase'
 * @param {string} status - สถานะของเคส
 */
const sendDataToApi = async (data, action, status) => {
    // เพิ่ม action และ status เข้าไปใน object ข้อมูลที่จะส่ง
    data.action = action;
    data.status = status;
    
    const payload = JSON.stringify(data);
    
    document.body.classList.add('loading'); 

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', 
            },
            body: payload
        });

        document.body.classList.remove('loading'); 

        if (response.ok) {
            const result = await response.json();
            if (result.status === 'success') {
                alert(`สำเร็จ! ${result.message}`);
                window.location.href = './index.html'; // ใช้นำหน้าด้วย ./ เพื่อความชัวร์
            } else {
                alert(`เกิดข้อผิดพลาดในการบันทึก: ${result.message}`);
            }
            return result;
        } else {
            alert(`การเชื่อมต่อ API ล้มเหลว: ${response.statusText}`);
            return { status: 'error', message: response.statusText };
        }
    } catch (error) {
        document.body.classList.remove('loading'); 
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาดในการส่งข้อมูล: กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและ Web App URL');
        return { status: 'error', message: error.message };
    }
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูลเคสทั้งหมดจาก Apps Script
 */
const fetchAllCases = async () => {
    // ... (โค้ดดึงข้อมูลเหมือนเดิม)
    try {
        const response = await fetch(WEB_APP_URL + '?action=getCaseList', {
            method: 'GET',
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.status === 'success') {
                renderCaseTable(result.data);
            } else {
                console.error("API Error:", result.message);
                document.getElementById('case-table-body').innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">ไม่สามารถดึงข้อมูลได้: ${result.message}</td></tr>`;
            }
        } else {
            console.error("Network Error:", response.statusText);
        }
    } catch (error) {
        console.error("Fetch Error:", error);
    }
};


// =====================================================================
// 2. DASHBOARD LOGIC (index.html)
// =====================================================================

const renderCaseTable = (cases) => {
    // ... (โค้ด render table เหมือนเดิม)
    const tableBody = document.getElementById('case-table-body');
    tableBody.innerHTML = ''; 
    
    if (!cases || cases.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">ไม่พบข้อมูลเคส</td></tr>`;
        return;
    }

    cases.forEach(c => {
        // ... (Logic การแสดงผลตารางเหมือนเดิม)
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
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${c[11] ? c[11].split(';')[0] + '...' : 'N/A'}</td>
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
    // แก้ไขตรงนี้: ใช้นำหน้าด้วย ./ เพื่อความชัวร์เรื่องพาธ
    document.getElementById('add-case-btn').addEventListener('click', () => {
        window.location.href = './case_form.html'; 
    });
    
    document.getElementById('refer-patient-btn').addEventListener('click', () => {
         alert('ฟังก์ชัน "ส่งต่อผู้ป่วย" จะถูกเพิ่มในขั้นตอนถัดไป');
    });
    document.getElementById('adr-report-btn').addEventListener('click', () => {
         alert('ฟังก์ชัน "รายงานอาการไม่พึงประสงค์" จะถูกเพิ่มในขั้นตอนถัดไป');
    });

    fetchAllCases();
};


// =====================================================================
// 3. FORM LOGIC (case_form.html) (เหมือนเดิม)
// =====================================================================

const handleCaseForm = () => {
    const form = document.getElementById('case-report-form');
    const closeCaseBtn = document.getElementById('close-case-btn');
    const cancelCaseBtn = document.getElementById('cancel-case-btn');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const selectedComplaints = Array.from(form.querySelectorAll('input[name="chief_complaints"]:checked')).map(cb => cb.value);
        if (selectedComplaints.length === 0) {
            alert('กรุณาเลือกอาการสำคัญอย่างน้อย 1 รายการ');
            return;
        }

        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            if (key !== 'chief_complaints') {
                 data[key] = value;
            }
        });
        data.chief_complaints = selectedComplaints.join('; ');
        
        sendDataToApi(data, 'saveCase', 'รอติดตาม');
    });

    closeCaseBtn.addEventListener('click', () => {
        if (!confirm('ยืนยันการปิดเคสหรือไม่? ระบบจะทำการ Export PDF และตั้งสถานะเป็น "ปิดเคสแล้ว"')) {
            return;
        }
        
        const form = document.getElementById('case-report-form');
        const formData = new FormData(form);
        const data = {};
        const selectedComplaints = Array.from(form.querySelectorAll('input[name="chief_complaints"]:checked')).map(cb => cb.value);
        
        formData.forEach((value, key) => {
            if (key !== 'chief_complaints') {
                 data[key] = value;
            }
        });
        data.chief_complaints = selectedComplaints.join('; ');

        sendDataToApi(data, 'closeCase', 'ปิดเคสแล้ว'); 
    });
    
    cancelCaseBtn.addEventListener('click', () => {
        if (confirm('ยืนยันการยกเลิกเคสหรือไม่? ระบบจะนำคุณกลับไปยังหน้าหลัก')) {
            window.location.href = './index.html'; // ใช้นำหน้าด้วย ./
        }
    });
};


// =====================================================================
// 4. ENTRY POINT
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    // ตรวจสอบว่ากำลังทำงานอยู่บนหน้าไหน
    if (path.includes('case_form.html')) {
        handleCaseForm();
    } else { // รวมถึง index.html หรือ root path
        handleDashboard();
    }
});



