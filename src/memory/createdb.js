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
      nonce TEXT,
      has_attachments BOOLEAN,
      image_caption TEXT,
      use_in_memory BOOLEAN,  -- New column
      generated_by_discord BOOLEAN,  -- New column
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
      nonce TEXT,
      has_attachments BOOLEAN,
      image_caption TEXT,
      use_in_memory BOOLEAN,  -- New column
      generated_by_discord BOOLEAN,  -- New column
      FOREIGN KEY (author_id) REFERENCES users (id)
    );
    
    CREATE TABLE IF NOT EXISTS attachments (
      attachment_id TEXT PRIMARY KEY,
      message_id TEXT,
      url TEXT,
      description TEXT,
      FOREIGN KEY (message_id) REFERENCES dms (id)
    );
  `);
}

// async function alterTables() {
//   await db.exec(`
//     ALTER TABLE messages ADD COLUMN use_in_memory BOOLEAN DEFAULT TRUE;
//     ALTER TABLE messages ADD COLUMN generated_by_discord BOOLEAN DEFAULT FALSE;

//     ALTER TABLE dms ADD COLUMN use_in_memory BOOLEAN DEFAULT TRUE;
//     ALTER TABLE dms ADD COLUMN generated_by_discord BOOLEAN DEFAULT FALSE;
//   `);
// }

// alterTables();
