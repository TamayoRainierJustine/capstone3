// Quick script to generate bcrypt hash for password
// Usage: node scripts/generate-password-hash.js

import bcrypt from 'bcryptjs';

const password = 'ADMIn1234';

bcrypt.hash(password, 10).then(hash => {
  console.log('');
  console.log('🔐 Bcrypt Hash for password "ADMIn1234":');
  console.log('');
  console.log(hash);
  console.log('');
  console.log('📋 Copy this hash and use it in the SQL UPDATE command below:');
  console.log('');
  console.log(`UPDATE "Users" SET password = '${hash}' WHERE email = 'rainiertamayo11067@gmail.com';`);
  console.log('');
}).catch(err => {
  console.error('Error:', err);
});

