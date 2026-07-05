
//https://www.youtube.com/watch?v=Cv0LdP_B5aI

//https://nodejs.org/api/sqlite.html

/*
"I used SQLite because it’s a serverless database.
 It’s perfect for this prototype because it ensures data integrity 
 (like keeping child records organized) while staying lightweight.
  It makes the app easier to deploy and test as a proof-of-concept."
*/


// Import sqlite3 with verbose mode for detailed logs
const sqlite3=require('sqlite3').verbose()

const fs=require('fs');

// Ensure production folder mount exists safely before opening SQLite
if (process.env.NODE_ENV === 'production') {
    const logDir = '/mnt/storage';
    if (!fs.existsSync(logDir)){
        fs.mkdirSync(logDir, { recursive: true });
    }
}


// Import path module to handle file paths
const path = require('path');

// Use the mounted network folder in production, fallback to local for testing
   const dbPath = process.env.NODE_ENV === 'production' 
       ? '/mnt/storage/attendance.db' 
       : path.join(__dirname, 'database.db');

   const db = new sqlite3.Database(dbPath, (err) => {
       if (err) console.error('Database opening error:', err.message);
       else console.log(`Connected to SQLite database at: ${dbPath}`);
   });

// Execute SQL commands in sequence
db.serialize(()=>{
    // Create table if it doesn't exist

    db.run(`
      CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_name TEXT NOT NULL,
      parent_email TEXT,
      arrival_time TEXT,
      departure_time TEXT,
      date TEXT NOT NULL
    )
      `,(err)=>{
        if(err){
            console.error('❌ Table creation error:', err.message);
        }else {
            console.log('✅ Attendance table ready');
        }
    });

  // Create children table to store parent-child relationship
  
  db.run(`
        CREATE TABLE IF NOT EXISTS children(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_name TEXT NOT NULL UNIQUE,
        parent_email TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        `,(err)=>{
            if(err){
                console.error('❌ Children table creation error:', err.message);
            }else {
                console.log('✅ Children table ready');
            }
        });


    });

module.exports= db;