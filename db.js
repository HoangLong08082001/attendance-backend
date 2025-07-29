const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Create a Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_KEY environment variable.");
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to connect to Supabase and perform queries
async function querySupabase(query, params) {
  const { data, error } = await supabase.rpc(query, params); // Replace with your RPC or query logic
  if (error) {
    console.error("Error executing query:", error);
    throw error; // Rethrow the error for handling at the calling site
  }
  return data;
}

// Example usage
async function fetchUsers() {
  const users = await querySupabase("get_users"); // Replace 'get_users' with your actual query
  console.log("Fetched users:", users);
}

// Export the Supabase client and query function
module.exports = { supabase, querySupabase };
