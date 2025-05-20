import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function setupDatabase() {
  try {
    console.log("Pushing the database schema...");
    const { stdout: pushOutput, stderr: pushError } = await execAsync('npx drizzle-kit push:pg');
    
    if (pushError) {
      console.error("Error pushing schema:", pushError);
    } else {
      console.log("Schema push output:", pushOutput);
      console.log("Schema successfully pushed to the database!");
      
      console.log("Seeding the database with initial data...");
      // Run the seeding script
      const { stdout: seedOutput, stderr: seedError } = await execAsync('tsx server/seed-database.ts');
      
      if (seedError) {
        console.error("Error seeding database:", seedError);
      } else {
        console.log("Seeding output:", seedOutput);
        console.log("Database successfully seeded with initial data!");
      }
    }
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

setupDatabase().then(() => {
  console.log("Database setup completed!");
  process.exit(0);
});