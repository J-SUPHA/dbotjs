import { db } from "./index.js";

export async function createTables() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT,
      guild_id TEXT,
      created_timestamp INTEGER,
      content TEXT,
      clean_content TEXT,
      author_id TEXT,
      user_name TEXT,
      global_name TEXT,
      type TEXT,
      tts BOOLEAN,
      has_attachments BOOLEAN,
      image_caption TEXT,
      use_in_memory BOOLEAN, 
      generated_by_discord BOOLEAN,  
      caption TEXT,  
      FOREIGN KEY (author_id) REFERENCES users (id)
    );
    
    CREATE TABLE IF NOT EXISTS dms (
      id TEXT PRIMARY KEY,
      channel_id TEXT,
      created_timestamp INTEGER,
      content TEXT,
      clean_content TEXT,
      author_id TEXT,
      user_name TEXT,
      global_name TEXT,
      type TEXT,
      tts BOOLEAN,
      has_attachments BOOLEAN,
      image_caption TEXT,
      use_in_memory BOOLEAN, 
      generated_by_discord BOOLEAN, 
      caption TEXT,
      FOREIGN KEY (author_id) REFERENCES users (id)
    );
    
    CREATE TABLE IF NOT EXISTS attachments (
      attachment_id TEXT PRIMARY KEY,
      message_id TEXT,
      url TEXT,
      description TEXT,
      FOREIGN KEY (message_id) REFERENCES dms (id)
    );

    CREATE TABLE IF NOT EXISTS message_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL,
      guild_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      summary TEXT NOT NULL,
      message_ids JSON NOT NULL,
      context JSON
    );
  `);
}

// async function deleteTableMessageSummaries(db) {
//   try {
//     const sql = "DROP TABLE IF EXISTS message_summaries";
//     await db.run(sql);
//     console.log("Table 'message_summaries' deleted successfully.");
//   } catch (error) {
//     console.error("Error deleting table 'message_summaries':", error);
//     throw error;
//   }
// }

// // Usage example
// // Assuming 'db' is your database connection object
// deleteTableMessageSummaries(db);

// async function alterTables(db) {
//   try {
//     await db.exec(`
//       ALTER TABLE messages ADD COLUMN caption STRING DEFAULT NULL;
//       ALTER TABLE dms ADD COLUMN caption STRING DEFAULT NULL;
//     `);
//     console.log("Tables altered successfully");
//   } catch (error) {
//     console.error("Error altering tables:", error);
//   }
// }

// alterTables(db);
