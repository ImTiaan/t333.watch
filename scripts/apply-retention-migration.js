// Script to apply retention tracking migration
// This can be run manually when database access is available

const fs = require('fs');
const path = require('path');

// Read the migration file
const migrationPath = path.join(__dirname, '..', 'migrations', 'add_retention_tracking_tables.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('Retention Tracking Migration SQL:');
console.log('================================');
console.log(migrationSQL);
console.log('================================');
console.log('\nTo apply this migration:');
console.log('1. Connect to your database using your preferred SQL client');
console.log('2. Execute the SQL statements above');
console.log('3. Verify the tables were created successfully');
console.log('\nTables that will be created:');
console.log('- subscription_cohorts');
console.log('- user_retention_tracking');
console.log('- subscription_lifecycle_events');
console.log('- cohort_retention_summary (view)');
console.log('- monthly_retention_summary (view)');
console.log('\nFunctions that will be created:');
console.log('- initialize_user_retention_tracking()');
console.log('- update_user_retention_tracking()');