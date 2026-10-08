import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const connectionString = process.env.DB_CONNECTION;
if (!connectionString || typeof connectionString !== "string") {
    throw new Error("DB_CONNECTION environment variable is required and must be a string");
}

const closePool = async () => {
    console.log('Closing...');
    await pool.end();
    console.log('Pool closed, process finished.');
    process.exit(0);
};

process.on('SIGINT', closePool);
process.on('SIGTERM', closePool); 

export const pool = new Pool({
    connectionString,
});