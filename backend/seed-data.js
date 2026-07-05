const db=require('./database');
// Add test data with auto-generated parent emails 

console.log('Seeding database.....');

db.serialize(()=>{
    const today = new Date().toISOString().split('T')[0];

    const testData=[
        { child_name: 'Emma Johnson', arrival_time: '09:00', departure_time: '17:00', date: today },
        { child_name: 'Liam Smith', arrival_time: '09:15', departure_time: null, date: today },
        { child_name: 'Olivia Brown', arrival_time: '09:30', departure_time: null, date: today },
        { child_name: 'Noah Davis', arrival_time: '10:00', departure_time: '16:30', date: today }

    ];

    testData.forEach(data=>{
        // Helper function to generate parent email 

        const generateParentEmail=(childName)=>{
            const sanitized=childName
            .toLowerCase()
            .trim()
            .replace(/\s+/g,'.')
            .replace(/[^a-z0-9.]/g,'');
            return `${sanitized}@daycare.local`;
        };

        const parentEmail=generateParentEmail(data.child_name);

        // Register child if not already registered 

        db.run(
            `INSERT OR IGNORE INTO children(child_name,parent_email) VALUES(?,?)`,
            [data.child_name,parentEmail]
        );

        // Insert attendance record 

        db.run(
            `INSERT INTO attendance (child_name,parent_email,arrival_time,departure_time,date) VALUES(?,?,?,?,?)`,
            [data.child_name,parentEmail,data.arrival_time,data.departure_time,data.date],
            function(err){
                if(err){
                    console.error('❌ Insert error:', err.message);
                } else {
                    console.log (`✅ Added: ${data.child_name} (${parentEmail})`);
                }
            }
        )
    
    });

    
});



/*

user@MacBookAir backend % node serve
r.js
Server is running
 Express server runing at http://localhost:3000
✅ Connected to daycare.db
✅ Attendance table ready
✅ Children table ready
user@MacBookAir backend % 
user@MacBookAir backend % node seed-
data.js
Seeding database.....
✅ Connected to daycare.db
✅ Attendance table ready
✅ Children table ready
✅ Added: Emma Johnson (emma.johnson@daycare.local)
✅ Added: Liam Smith (liam.smith@daycare.local)
✅ Added: Olivia Brown (olivia.brown@daycare.local)
✅ Added: Noah Davis (noah.davis@daycare.local)


*/