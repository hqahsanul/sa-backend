const http = require('http');

const BASE_URL = 'http://localhost:4000';

function login(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode === 200) {
            resolve(response);
          } else {
            reject(new Error(`Login failed: ${response.message || body}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Getting JWT tokens...\n');
  
  try {
    console.log('Logging in as Patient...');
    const patient = await login('patient@sayurveda.test', 'changeme123');
    console.log('✅ Patient Token:');
    console.log(patient.token);
    console.log(`   User: ${patient.user.name} (${patient.user.role})`);
    console.log(`   ID: ${patient.user.id}\n`);

    console.log('Logging in as Doctor...');
    const doctor = await login('doctor@sayurveda.test', 'changeme123');
    console.log('✅ Doctor Token:');
    console.log(doctor.token);
    console.log(`   User: ${doctor.user.name} (${doctor.user.role})`);
    console.log(`   ID: ${doctor.user.id}\n`);

    console.log('📋 Copy these tokens to test-calls.html');
    console.log('   Patient ID:', patient.user.id);
    console.log('   Doctor ID:', doctor.user.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure the server is running on port 4000!');
    process.exit(1);
  }
}

main();

