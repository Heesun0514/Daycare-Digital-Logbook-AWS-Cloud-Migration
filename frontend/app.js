// ============================================
// DAYCARE DIGITAL LOGBOOK - app.js
// ============================================

// ============================================
// AUTHENTICATION (Sprint 2)
// ============================================

let authToken = null;
let currentUser = null;
let inactivityTimer = null;

const EB_URL = 'https://Daycare-backend-env.eba-vf6pffb7.eu-west-1.elasticbeanstalk.com';
const LOCALHOST_URL = 'http://localhost:8080';

const API_BASE = LOCALHOST_URL;
console.log(`🔗 API Base: ${API_BASE}`);

const AUTH_API = `${API_BASE}/api/auth`;
const ATTENDANCE_API = `${API_BASE}/api/attendance`;

// ✅ Auto-logout after 5 minutes of inactivity
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        console.log('⏰ Session expired - logging out due to inactivity');
        document.getElementById('auth-message').innerHTML = '🔐 Session expired. Please login again.';
        logout();
    }, 5 * 60 * 1000);
}

function setupActivityListeners() {
    document.addEventListener('click', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);
    document.addEventListener('touchstart', resetInactivityTimer);
}

// ============================================
// LOGIN
// ============================================
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        document.getElementById('auth-message').innerHTML = '❌ Email and password are required';
        return;
    }

    try {
        console.log('🔐 Attempting Cognito login...');
        const response = await fetch(`${AUTH_API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        console.log('📥 Login response:', {
            success: response.ok,
            hasToken: !!result.token,
            email: result.email,
            role: result.role
        });

        if (response.ok && result.token) {
            authToken = result.token;
            currentUser = result;

            localStorage.setItem('token', result.token);
            localStorage.setItem('email', result.email);
            localStorage.setItem('role', result.role);
            if (result.idToken) localStorage.setItem('idToken', result.idToken);
            if (result.accessToken) localStorage.setItem('accessToken', result.accessToken);

            console.log('✅ Cognito authentication successful - JWT stored');

            // UI switch
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('logout-section').style.display = 'block';
            document.getElementById('user-email').textContent = result.email;
            document.getElementById('user-role-display').textContent = result.role;  // ✅ fixed
            document.getElementById('app').style.display = 'block';
            document.getElementById('auth-message').innerHTML = '✅ Login successful!';

            // Load the attendance table
            await loadAttendanceTable();

            // Show/hide Director-only sections
            if (result.role === 'Director') {
                const directorSection = document.getElementById('director-section');
                if (directorSection) directorSection.style.display = 'block';
                console.log('👨‍💼 Director features enabled');
            } else {
                const directorSection = document.getElementById('director-section');
                if (directorSection) directorSection.style.display = 'none';
                console.log('👩‍🏫 Teacher features enabled (limited)');
            }

            setupActivityListeners();

        } else {
            document.getElementById('auth-message').innerHTML = '❌ ' + (result.error || 'Login failed');
            console.error('❌ Login failed:', result.error);
        }
    } catch (error) {
        document.getElementById('auth-message').innerHTML = '❌ Error: ' + error.message;
        console.error('❌ Login error:', error);
    }
}

// ============================================
// PASSWORD SHOW/HIDE
// ============================================
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('login-password');
    const button = document.getElementById('pwd-toggle');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        button.textContent = 'Hide';
    } else {
        passwordInput.type = 'password';
        button.textContent = 'Show';
    }
}

// ============================================
// LOGOUT
// ============================================
function logout() {
    clearTimeout(inactivityTimer);
    authToken = null;
    currentUser = null;

    localStorage.removeItem('token');
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('email');
    localStorage.removeItem('role');

    document.getElementById('login-form').style.display = 'block';
    document.getElementById('logout-section').style.display = 'none';
    document.getElementById('app').style.display = 'none';
    document.getElementById('auth-message').innerHTML = '🔒 You have been logged out.';

    console.log('🔐 User logged out - all tokens cleared');
}

// ============================================
// AUTH HEADERS
// ============================================
function getAuthHeaders() {
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('❌ No authentication token - user must login first');
        alert('Session expired. Please login again.');
        logout();
        return {};
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// ============================================
// HELPERS
// ============================================
function getCurrentTime() {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
}

function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

function escapeName(name) {
    return name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// ============================================
// 1. ATTENDANCE TABLE (Check-in / Check-out)
// ============================================
async function loadAttendanceTable() {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) {
        console.error('❌ attendanceTableBody element not found');
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    const todayDateEl = document.getElementById('todayDate');
    if (todayDateEl) {
        todayDateEl.textContent = new Date().toLocaleDateString('en-IE');
    }

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;">Loading...</td></tr>';

    try {
        // 1. Load all registered children
        const childRes = await fetch(`${API_BASE}/api/children`, {
            headers: getAuthHeaders()
        });
        const childData = await childRes.json();

        // Backend may return either [ ... ] or { success, children: [...] }
        const children = Array.isArray(childData)
            ? childData
            : (childData.children || []);

        // 2. Load today's attendance
        const attRes = await fetch(`${ATTENDANCE_API}/report?from=${today}&to=${today}`, {
            headers: getAuthHeaders()
        });
        const attData = await attRes.json();

        const records = attData.record || attData.report || [];

        // 3. Build lookup map: childId -> record
        const recordByChild = {};
        records.forEach(r => { recordByChild[r.child_id] = r; });

        tbody.innerHTML = '';

        if (children.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;">No children registered</td></tr>';
            return;
        }

        let presentCount = 0;
        let departedCount = 0;
        let absentCount = 0;





        children.forEach(child => {
            const rec = recordByChild[child.id];

            let arrivalVal = '09:00';
            let departureVal = '';
            let statusHtml;
            let checkInDisabled = false;
            let checkOutDisabled = true;
            let recordIdForCheckout = '';
            let state = 'absent';

            if (!rec) {
                statusHtml = '<span class="status-absent">⚪ Not arrived</span>';
                checkInDisabled = false;
                checkOutDisabled = true;
                state = 'absent';
                absentCount++;

            } else if (rec.departure_time) {
                arrivalVal = rec.arrival_time || '';
                departureVal = rec.departure_time || '';
                statusHtml = '<span class="status-departed">🔴 Departed</span>';
                checkInDisabled = true;
                checkOutDisabled = true;
                state = 'departed';
                departedCount++;

            } else {
                arrivalVal = rec.arrival_time || '';
                statusHtml = '<span class="status-present">🟢 Present</span>';
                checkInDisabled = true;
                checkOutDisabled = false;
                recordIdForCheckout = rec.id;
                state = 'present';
                presentCount++;
            }

          const recId = rec ? rec.id : '';
const recDate = rec ? rec.date : new Date().toISOString().split('T')[0];
const recArrival = rec ? rec.arrival_time : '';
const recDeparture = rec ? rec.departure_time : '';

const tr = document.createElement('tr');
tr.dataset.state = state;
tr.innerHTML = `
    <td data-label="Name">${child.child_name}</td>
    <td data-label="Arrival">
        <input type="time" id="arr-${child.id}" value="${arrivalVal}"
               ${checkInDisabled ? 'disabled' : ''}>
    </td>
    <td data-label="Departure">
        <input type="time" id="dep-${child.id}" value="${departureVal}"
               ${checkOutDisabled ? 'disabled' : ''}>
    </td>
    <td data-label="Status">${statusHtml}</td>
    <td data-label="Actions">
        <div class="actions-cell">
            <button class="btn-checkin"
                    ${checkInDisabled ? 'disabled' : ''}
                    onclick="handleCheckIn(${child.id}, '${escapeName(child.child_name)}', '${child.parent_email}')">
                ➕ Check In Now
            </button>
            <button class="btn-checkout"
                    ${checkOutDisabled ? 'disabled' : ''}
                    onclick="handleCheckOut(${recordIdForCheckout}, ${child.id}, '${escapeName(child.child_name)}')">
                🚪 Check Out Now
            </button>
            <button class="btn-edit"
                    ${!rec ? 'disabled' : ''}
                    onclick="prefillEdit(${recId}, '${recArrival}', '${recDeparture}', '${recDate}')">
                ✏️ Edit
            </button>
        </div>
    </td>
`;
            tbody.appendChild(tr);
        });

// Update counters
        document.getElementById('countPresent').textContent  = presentCount;
        document.getElementById('countDeparted').textContent = departedCount;
        document.getElementById('countAbsent').textContent   = absentCount;
        document.getElementById('countTotal').textContent    = children.length;

         if (typeof currentFilter !== 'undefined') {
            filterTable(currentFilter);
        }

    } catch (err) {
        console.error('loadAttendanceTable error:', err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#c00;">Failed to load attendance</td></tr>';
    }
}

// ============================================
// CHECK IN
// ============================================
async function handleCheckIn(childId, childName, parentEmail) {
    const arrivalInput = document.getElementById(`arr-${childId}`);
    const arrival = arrivalInput ? arrivalInput.value : getCurrentTime();
    const today = getCurrentDate();

    if (!arrival) return alert('Please set an arrival time');

    try {
        const response = await fetch(`${ATTENDANCE_API}/checkin`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                child_id: childId,
                child_name: childName,
                parent_email: parentEmail,
                arrival_time: arrival,
                date: today
            })
        });

        const result = await response.json();

        if (response.ok || response.status === 201) {
            console.log(`✅ ${childName} checked in`);
            loadAttendanceTable();
        } else {
            alert(`❌ ${result.error || 'Check-in failed'}`);
        }
    } catch (err) {
        console.error('handleCheckIn error:', err);
        alert('❌ Network error — check backend');
    }
}

// ============================================
// CHECK OUT
// ============================================
async function handleCheckOut(recordId, childId, childName) {
    if (!recordId) return alert('No attendance record to check out');

    const depInput = document.getElementById(`dep-${childId}`);
    let departure = depInput ? depInput.value : '';

    if (!departure) {
        departure = getCurrentTime();
        if (depInput) depInput.value = departure;
    }

    try {
        const response = await fetch(`${ATTENDANCE_API}/checkout/${recordId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ departure_time: departure })
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`✅ ${childName} checked out at ${departure}`);
            loadAttendanceTable();
        } else {
            alert(`❌ ${result.error || 'Check-out failed'}`);
        }
    } catch (err) {
        console.error('handleCheckOut error:', err);
        alert('❌ Network error — check backend');
    }
}

// ============================================
// 2. EDIT ATTENDANCE TIME (UPDATE)
// ============================================
async function editAttendanceTime() {
    const id = document.getElementById('editId').value;
    const arrival_time = document.getElementById('editArrival').value;
    const departure_time = document.getElementById('editDeparture').value;
    const date = document.getElementById('editDate').value;

    if (!id) {
        alert('Please enter Record ID');
        return;
    }
    if (!arrival_time && !departure_time && !date) {
        alert('Please enter at least one field to update (arrival, departure, or date)');
        return;
    }

    const updateData = {};
    if (arrival_time) updateData.arrival_time = arrival_time;
    if (departure_time) updateData.departure_time = departure_time;
    if (date) updateData.date = date;

    if (Object.keys(updateData).length === 0) {
        alert('Please enter at least one field to update');
        return;
    }

    try {
        const response = await fetch(`${ATTENDANCE_API}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (response.status === 200) {
            document.getElementById('editResult').innerHTML =
                `✅ Updated successfully! record ID: ${id}`;

            document.getElementById('editId').value = '';
            document.getElementById('editArrival').value = '';
            document.getElementById('editDeparture').value = '';
            document.getElementById('editDate').value = '';

            loadAttendanceTable();
        } else {
            document.getElementById('editResult').innerHTML = `❌ Error: ${result.error}`;
        }
    } catch (error) {
        document.getElementById('editResult').innerHTML = `❌ Connection error: ${error.message}`;
    }
}

// ============================================
// PREFILL EDIT FORM FROM ROW BUTTON
// ============================================

function prefillEdit(recordId, arrival, departure, date) {
    if (!recordId) return;

    document.getElementById('editId').value = recordId;
    document.getElementById('editArrival').value = arrival || '';
    document.getElementById('editDeparture').value = departure || '';
    document.getElementById('editDate').value = date || '';

    // Scroll the edit section into view
    document.getElementById('editId').scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight briefly
    const editSection = document.getElementById('editId').closest('div[style*="border"]');
    if (editSection) {
        editSection.style.transition = 'box-shadow 0.3s';
        editSection.style.boxShadow = '0 0 0 3px #9C27B0';
        setTimeout(() => { editSection.style.boxShadow = ''; }, 1200);
    }
}


// ============================================
// CSV DOWNLOAD HELPER
// ============================================
function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}



// ============================================
// 4. ECCE COMPLIANCE REPORT
// ============================================
async function generateECCEReport() {
    const from = document.getElementById('ecce-from').value;
    const to = document.getElementById('ecce-to').value;

    if (!from || !to) {
        alert('Please select both from and to dates');
        return;
    }

    try {
        const response = await fetch(
            `${ATTENDANCE_API}/ecce-report?from=${from}&to=${to}`,
            { headers: getAuthHeaders() }
        );
        const result = await response.json();

        if (response.status === 200) {
            const rows = result.report || [];

            if (rows.length === 0) {
                document.getElementById('ecce-results').innerHTML =
                    '<p>📭 No completed attendance records in this range.</p>';
                return;
            }

            let html = `
                <p><strong>Period:</strong> ${result.period.from} → ${result.period.to}</p>
                <p><strong>Required:</strong> ${result.required_hours} hours / week</p>
                <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
                    <tr style="background:#FF6B9D; color:white;">
                        <th>Child</th>
                        <th>Days</th>
                        <th>Total Hours</th>
                        <th>% of 15h</th>
                        <th>Status</th>
                    </tr>
            `;

            rows.forEach(r => {
                let bg = '#e8f5e9';
                if (r.status === 'AT RISK') bg = '#fff8e1';
                if (r.status === 'NON-COMPLIANT') bg = '#ffebee';

                html += `<tr style="background:${bg}">
                    <td>${r.child_name}</td>
                    <td>${r.days_attended}</td>
                    <td>${r.total_hours} h</td>
                    <td>${r.percent_complete}%</td>
                    <td><strong>${r.flag} ${r.status}</strong></td>
                </tr>`;
            });

            html += '</table>';
            document.getElementById('ecce-results').innerHTML = html;
        } else {
            document.getElementById('ecce-results').innerHTML = `<p>❌ ${result.error}</p>`;
        }
    } catch (error) {
        document.getElementById('ecce-results').innerHTML =
            `<p>❌ Connection error: ${error.message}</p>`;
    }
}

// ============================================
// 4b. DOWNLOAD ECCE REPORT (CSV)
// ============================================
async function downloadECCEReport() {
    const from = document.getElementById('ecce-from').value;
    const to = document.getElementById('ecce-to').value;

    if (!from || !to) {
        alert('Please generate an ECCE report first');
        return;
    }

    try {
        const response = await fetch(
            `${ATTENDANCE_API}/ecce-report?from=${from}&to=${to}`,
            { headers: getAuthHeaders() }
        );
        const result = await response.json();

        if (!result.report || result.report.length === 0) {
            alert('No ECCE data to download');
            return;
        }

        let csv = `ECCE Compliance Report\nPeriod: ${from} to ${to}\nRequired: 15 hours/week\n\n`;
        csv += 'Child ID,Child Name,Days Attended,Total Hours,Percent Complete,Status\n';

        result.report.forEach(r => {
            csv += `${r.child_id},${r.child_name},${r.days_attended},${r.total_hours},${r.percent_complete}%,${r.status}\n`;
        });

        downloadCSV(csv, `ecce_report_${from}_to_${to}.csv`);
    } catch (error) {
        alert('Download failed: ' + error.message);
    }
}

// ============================================
// 5. PARENT VIEW
// ============================================
async function viewChildStatus() {
    const parentEmail = document.getElementById('parent-email').value;

    if (!parentEmail) {
        alert('Please enter your email');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
        alert('Please enter a valid email address');
        return;
    }

    try {
        const today = getCurrentDate();

        const response = await fetch(`${ATTENDANCE_API}/report?from=${today}&to=${today}`, {
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (response.status === 200) {
            const allRecords = result.record || [];

            const childrenRecords = allRecords.filter(record =>
                record.parent_email && record.parent_email.toLowerCase() === parentEmail.toLowerCase()
            );

            if (childrenRecords.length === 0) {
                document.getElementById('child-status').innerHTML = `
                    <p style="color: #FF6B9D; font-weight: bold;">📭 No attendance recorded for your child(ren) today.</p>`;
                return;
            }

            let html = `<div style="background-color: #FFF0F5; padding: 15px; border-radius: 5px; border: 2px solid #FF6B9D;">`;
            html += `<h3 style="color: #FF6B9D;">👨‍👩‍👧 Your Child(ren)'s Status</h3>`;
            html += `<table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%; margin-top: 10px;">`;
            html += `<tr style="background-color: #FF6B9D; color: white;">`;
            html += `<th>Child Name</th><th>Arrival Time</th><th>Departure Time</th><th>Current Status</th>`;
            html += `</tr>`;

            childrenRecords.forEach(child => {
                const status = child.departure_time ? '✅ Picked Up' : '🟢 At Daycare';
                html += `<tr>`;
                html += `<td><strong>${child.child_name}</strong></td>`;
                html += `<td>${child.arrival_time || '-'}</td>`;
                html += `<td>${child.departure_time || '-'}</td>`;
                html += `<td>${status}</td>`;
                html += `</tr>`;
            });

            html += `</table>`;
            html += `<p style="margin-top: 10px; font-size: 12px; color: #666;">Last updated: ${new Date().toLocaleTimeString()}</p>`;
            html += `</div>`;

            document.getElementById('child-status').innerHTML = html;

        } else {
            document.getElementById('child-status').innerHTML =
                `<p>❌ ${result.error || 'Error fetching attendance data'}</p>`;
        }
    } catch (error) {
        document.getElementById('child-status').innerHTML =
            `<p>❌ Connection error: ${error.message}</p>`;
    }
}