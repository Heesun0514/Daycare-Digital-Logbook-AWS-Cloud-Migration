// ============================================
// AUTHENTICATION (Sprint 2)
// ============================================

let authToken = null; // JWT token stored in memory (stateless)
let currentUser = null; // User info (email, role)

// API Base URL for Auth
const AUTH_API = 'http://localhost:8080/api/auth';
const ATTENDANCE_API = 'http://localhost:8080/api/attendance';

// Login function
async function login() {
    const email = document.getElementById('login-email').value;
    const role = document.getElementById('login-role').value;

    if (!email) {
        document.getElementById('auth-message').innerHTML = '❌ Please enter your email.';
        return;
    }

    try {
        const response = await fetch(`${AUTH_API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role })
        });

        const result = await response.json();

        if (response.status === 200) {
            // Store token and user info in memory (stateless)
            authToken = result.token;
            currentUser = { email: result.email, role: result.role };

            // Update UI
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('logout-section').style.display = 'block';
            document.getElementById('user-email').textContent = currentUser.email;
            document.getElementById('user-role').textContent = currentUser.role;
            document.getElementById('app').style.display = 'block'; // Show attendance features
            document.getElementById('auth-message').innerHTML = '✅ Login successful!';

            // Load today's attendance automatically
            loadTodayAttendance();
        } else {
            document.getElementById('auth-message').innerHTML = `❌ ${result.error || 'Login failed'}`;
        }
    } catch (error) {
        document.getElementById('auth-message').innerHTML = `❌ Connection error: ${error.message}`;
    }
}

// Logout function
function logout() {
    // Clear token and user info from memory
    authToken = null;
    currentUser = null;

    // Update UI
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('logout-section').style.display = 'none';
    document.getElementById('app').style.display = 'none';
    document.getElementById('auth-message').innerHTML = '🔒 You have been logged out.';
    document.getElementById('todayAttendance').innerHTML = '';
}

// Helper function to add auth header to API requests
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}




// ============== Helper functions  ====================

 
 // Get current time in HH:MM format
function getCurrentTime() {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // Grabs the "HH:MM" part
}

// Get today's date in YYYY-MM-DD format
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];}



// ============== Check in now   ====================

// Automatically check-in with current date and time 
async function checkinNow(){

    //1.Auto-fill the date and time inputs 

    document.getElementById('checkinDate').value=getCurrentDate();
    document.getElementById('arrivalTime').value=getCurrentTime();

    //2. Run check-in logic 
    await checkin();
}


// ============== Check out now   ====================


// Automatically check-out with current date and time 
async function checkoutNow(){

    //1.Auto-fill the departure time input
    document.getElementById('departureTime').value=getCurrentTime();

    //2. Run check-out logic 
    await checkout();
}

// ============== 1.CHECK-IN (CREATE) ====================

async function checkin(){

     //1. grab the values from the input boxes 
    const child_name=document.getElementById('childName').value;
    const arrival_time=document.getElementById('arrivalTime').value;
    const date=document.getElementById('checkinDate').value;

    //2. simple check : if any box is empty, stop and tell the user 
    if (!child_name || ! arrival_time || !date){
        alert('Please fill all fields')
        return;
    }

    try { 
        //3. send the "Package " (JSON) to the server 
        const response = await fetch (`${ATTENDANCE_API}/checkin`, {
        method:'POST', // create new data
        headers: getAuthHeaders(), 
        body:JSON.stringify({child_name,arrival_time,date}) //converts the javascript object into a JSON string
    });

     //4. open the response from the server
     const result =await response.json(); // converts the server's response back into a JS object 
     
     if (response.status===201){
        // sucess ! show a green checkmark and the name 
        document.getElementById('checkinResult').innerHTML=`✅ Check-in sucessful! Id:${result.id},Name:${result.child_name}`;
        loadTodayAttendance(); // Update the list 

        } else { // the server said no (e.g.,missing data )
            document.getElementById('checkinResult').innerHTML=`❌ Error:${result.error} `;
        }
     } catch(error){ // the internet failed or the server is turned off 
        document.getElementById('checkinResult').innerHTML=` ❌ Connection error: ${error.message}`;

     }
    }

// ============== 2.CHECK-OUT (UPDATE) ====================

async function checkout(){

     //1. grab the values from the input boxes 
    const id =document.getElementById('checkoutId').value; // ✅ fixed: 'checkoutId'
    const departure_time =document.getElementById('departureTime').value;
    

    //2. simple check : if any box is empty, stop and tell the user 
    if (!id || !departure_time){
        alert('Please enter Record ID and Departure Time')
        return;
    }

    try { 
        //3. send the "Package " (JSON) to the server 
          // ✅ fixed: URL includes ID parameter
        const response = await fetch (`${ATTENDANCE_API}/checkout/${id}`, {
        method:'PUT', // update the data
        headers: getAuthHeaders(), 
        body:JSON.stringify({departure_time}) //converts the javascript object into a JSON string
    });

     //4. open the response from the server
     const result =await response.json(); // converts the server's response back into a JS object 
     

         // ✅ fixed: success status is 200, not 201
     if (response.status===200){
        // sucess ! show a green checkmark and the name 
        document.getElementById('checkoutResult').innerHTML=`✅ Check-out sucessful! record ID:${id} at ${departure_time}`;
        loadTodayAttendance(); // Update the list 

        } else { // the server said no (e.g.,missing data )
            document.getElementById('checkoutResult').innerHTML=`❌ Error:${result.error} `;
        }
     } catch(error){ // the internet failed or the server is turned off 
        document.getElementById('checkoutResult').innerHTML=` ❌ Connection error: ${error.message}`;

}
}

// ============== 3.Today's Attendance ( READ ) ====================

async function loadTodayAttendance(){

     //1. get today's date in YYYY-MM-DD format
      // Original String: 2026-05-14 T 12:57:53.123Z
      // After .split('T'): ["2026-05-14", "12:57:53.123Z"]
      // After [0]: "2026-05-14"
      
    const today=new Date().toISOString().split('T')[0];
    
    //2, today's format 
    const todayFormatted = today;  

 

    try { 
        //3. send the "Package " (JSON) to the server 
        
        const response = await fetch (`${ATTENDANCE_API}/report?from=${todayFormatted}&to=${todayFormatted}`, {
        headers: getAuthHeaders()
            // no need method,headers, or body because this function is fetching(READING)data,not sending or updating
    });

     //4. open the response from the server
     const result =await response.json(); // converts the server's response back into a JS object 
     

     if (response.status===200){
        // sucess ! 
        // Extracts the attendance list from the result. 
        // If no records exist, it defaults to an empty array.

        const records=result.record || [];

         //5. show message if no records 
        if (records.length===0){
            document.getElementById('todayAttendance').innerHTML='<p> 📭 No attendenace records for today.</p>'
            return;
        }

        //6. Build HTML table 
         //Initializes a string to hold HTML table code and adds the header row.
       let html = '<table border="1" cellpadding="5" style="border-collapse: collapse;">';
            html += '<tr style="background-color: #f2f2f2;">';
            html += '<th>ID</th><th>Name</th><th>Arrival</th><th>Departure</th><th>Status</th>';
            html += '</tr>';
            

         // 7. Add each child to table    
        records.forEach(record=>{
            const status =record.departure_time ? '✅ Departed' : '🟢 Present';
            html += `<tr>
            <td>${record.id}</td>
            <td>${record.child_name}</td>
            <td>${record.arrival_time}</td>
            <td>${record.departure_time}</td>
              <td>${status}</td>
            </tr>`;
    
        });

        html +='</table>'
        document.getElementById('todayAttendance').innerHTML=html;
       
    }
     } catch(error){  
        document.getElementById('todayAttendance').innerHTML=` ❌ Error loading attendance: ${error.message}`;

}
}



/*

testing 
sqlite> SELECT * FROM attendance;
122|heesun lee|09:00||2026-05-14
123|Milla|10:00||2026-05-14
124|Milla|09:00||2026-05-14
125|janis|09:00||2026-05-14
126|halaam|09:00|17:00|2026-05-14
sqlite> 

*/




// ============== 4.Edit Attendance Time( UPDATE ) ====================

async function editAttendanceTime(){

     //1. grab the values from the input boxes 
    const id =document.getElementById('editId').value; 
    const arrival_time =document.getElementById('editArrival').value;
    const departure_time=document.getElementById('editDeparture').value;
    const date=document.getElementById('editDate').value;
    

    //2. simple check : at least one field to update 

    if (!id){
        alert('Please enter Record ID');
    }
    if (! arrival_time && ! departure_time && !date){
        alert('Please enter at least one field to update (arrival,departure,or date')
        return;
    }

    // 3. Build dynamic update object( only include fields that are provided )
    const updateData={}; // create empty object {key:value}
    if (arrival_time)updateData.arrival_time=arrival_time;
    if(departure_time)updateData.departure_time=departure_time;
    if(date)updateData.date=date;


    if(Object.keys(updateData).length===0){ // key:value ['arrival_time', 'date']
        alert('Please enter at least one field to update');
        return;
    }

    try { 
        //4. send the "Package " (JSON) to the server 
          
        const response = await fetch (`${ATTENDANCE_API}/${id}`, {
        method:'PUT', // update the data
        headers: getAuthHeaders(), 
        body:JSON.stringify(updateData) //converts the javascript object into a JSON string
    });

     //5. open the response from the server
     const result =await response.json(); // converts the server's response back into a JS object 
     

        
     if (response.status===200){
        // sucess ! show a green checkmark and the name 
        document.getElementById('editResult').innerHTML=`✅ Updated sucessful! record ID:${id}`;
        loadTodayAttendance(); // Update the list 

        } else { // the server said no (e.g.,missing data )
            document.getElementById('editResult').innerHTML=`❌ Error:${result.error} `;
        }
     } catch(error){ // the internet failed or the server is turned off 
        document.getElementById('editResult').innerHTML=` ❌ Connection error: ${error.message}`;

}
}



// ============== 5.Generate Report( READ ) ====================

async function generateReport(){

   //1. grab the values from the input boxes 
    const from=document.getElementById('from-date').value
    const to=document.getElementById('to-date').value
    
    //2 Input validation - check if both exsit 
    if (!from || ! to) {
        alert('Please select both from and to dates');
        return;}
 

    try { 
        //3. send the "Package " (JSON) to the server 
        
        const response = await fetch (`${ATTENDANCE_API}/report?from=${from}&to=${to}`, {
            headers: getAuthHeaders(), 
        
            // no need method,headers, or body because this function is fetching(READING)data,not sending or updating
    });

     //4. open the response from the server
     const result =await response.json(); // converts the server's response back into a JS object 
     

     if (response.status===200){
        // sucess ! 
        // Extracts the attendance list from the result. 
        // If no records exist, it defaults to an empty array.

        const records=result.record || [];

        // Adding window.reportData

        window.reportData=records;

         //5. show message if no records 
        if (records.length===0){
            document.getElementById('report-results').innerHTML='<p> 📭 No records found in this date range </p>'
            return;
        }

        //6. Build HTML table 
         //Initializes a string to hold HTML table code and adds the header row.
       let html = '<table border="1" cellpadding="5" style="border-collapse: collapse;">';
            html += '<tr style="background-color: #f2f2f2;">';
            html += '<th>ID</th><th>Name</th><th>Arrival</th><th>Departure</th><th>Status</th>';
            html += '</tr>';
            

         // 7. Add each child to table    
        records.forEach(record=>{
            
            html += `<tr>
            <td>${record.id}</td>
            <td>${record.child_name}</td>
            <td>${record.arrival_time}</td>
            <td>${record.departure_time || '-'}</td>
            <td>${record.date}</td>
             
            </tr>`;
    
        });

        html +='</table>'
        document.getElementById('report-results').innerHTML=html;
        window.reportData=records;
    } else {
        document.getElementById('report-results').innerHTML=`<p>❌ ${result.error}</p>`;
    }
       
     } catch(error){  
        document.getElementById('report-results').innerHTML=` ❌ Error: ${error.message}`;

}
}



// ============== 6.Download Report( CSV ) ====================

async function downloadReport(){

   //1. check if report data exist 
    if(!window.reportData || window.reportData.length===0){
        alert('Please generate a report first');
        return;
    }

    //2. create CSV content 

    let csv='ID,Child Name,Arrival Time,Depature Time,Date\n';

    window.reportData.forEach(record=>{
        csv +=`${record.id},${record.child_name},${record.arrival_time},${record.departure_time ||''}, ${record.date}\n`;
    });

    //3. download CSV file 
        // Creates a Blob (Binary Large Object),
        //  which is a file-like object containing the raw CSV text data.
        // utf-8 is the universal standard for encoding characters.
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8'}); 


    // Generates a temporary URL that points to the created Blob object in the browser memory.
    const url=URL.createObjectURL(blob);

    // Creates a hidden <a> (anchor) element in memory to simulate a click for downloading.
    const link=document.createElement('a');

    // Sets the href of the link to the temporary URL created earlier.
    link.href=url;

    // Sets the download attribute, which tells the browser to download the file instead of opening it, 
    // naming it with the current date.
    link.setAttribute('download',`attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
   
   // Temporarily adds the link to the document, triggers a click to start the download, 
   // and then removes the link immediately.
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Releases the temporary URL from memory to optimize performance and prevent memory leaks.
    URL.revokeObjectURL(url);
}




// ============== 7.Parent View: View Child Status  ====================

async function viewChildStatus(){
    
    //1. grab the parent email 
    const parentEmail = document.getElementById('parent-email').value;
    
    //2. input validation 
    if (!parentEmail){
        alert('Please enter your email');
        return;
    }
    
    //3. validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)){
        alert('Please enter a valid email address');
        return;
    }

   
    try {

         //4. get today's date 
        const today = new Date().toISOString().split('T')[0];

        //5. Use existing REPORT API to get all today's attendance
        const response = await fetch(`${ATTENDANCE_API}/report?from=${today}&to=${today}`,
        {
            headers: getAuthHeaders()
        });

        
        //6. parse the response
        const result = await response.json();
        
        if (response.status === 200){
            const allRecords = result.record || [];
            
            //7. Filter records by parent email
            const childrenRecords = allRecords.filter(record => 
                record.parent_email && record.parent_email.toLowerCase() === parentEmail.toLowerCase()
            );
            
            //8. show message if no for this parent
            if (childrenRecords.length === 0){
                document.getElementById('child-status').innerHTML = `
                   <p style="color: #FF6B9D; font-weight: bold;">📭 No attendance recorded for your child(ren) today.</p>`;
                return;
            }
            
            //9. Build HTML display 
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
            document.getElementById('child-status').innerHTML = `<p>❌ ${result.error || 'Error fetching attendance data'}</p>`;
        }
        
    } catch(error){
        document.getElementById('child-status').innerHTML = `<p>❌ Connection error: ${error.message}</p>`;
    }
}
