import Database from 'better-sqlite3';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { MigrationManager } from './migrations.js';

export class DatabaseManager {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  async init() {
    await mkdir(dirname(this.dbPath), { recursive: true });
    
    this.db = new Database(this.dbPath);
    
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('journal_mode = WAL');
    
    const migrationManager = new MigrationManager(this.db);
    migrationManager.runAllMigrations();
  }

  getDb() {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  transaction(fn) {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db.transaction(fn);
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
