const https = require('https');

const MAYAR_API_KEY = process.env.MAYAR_API_KEY || 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMmY1YThhMS1iMTFjLTQ5NTUtOGM2OS1hZDVkYjc0NmZhZDMiLCJhY2NvdW50SWQiOiI2MjQ0MDlkNy1iZDczLTQ0MDAtYjQ4NS1iZTM3OWY5MWI5YTMiLCJjcmVhdGVkQXQiOiIxNzczMjAwMzI2MjA3Iiwicm9sZSI6ImRldmVsb3BlciIsInN1YiI6ImFuZ2dpdG9iYmtAZ21haWwuY29tIiwibmFtZSI6Ilpha2F0IERlc2EiLCJsaW5rIjoiYW5nZ2l0by1tdWhhbW1hZC1hIiwiaXNTZWxmRG9tYWluIjpudWxsLCJpYXQiOjE3NzMyMDAzMjZ9.jl_0KBcR_eMXEq3ar7yDgUX0zcBzFbV7LVcxOCBdEEvF2v6JAFfUNjNP3EtnLAxwaP2ghTd9X7arwg2lUgPtnr2hVQqiX5jgOg38egxHOJpNh9xWooYWvYTrNuE6YYDEGiFb17RsKD1T4YCYxqMBLNjO04XkL2souS0-Cri08KEUq4vHRKjnpnwwEOKwX3eVEy9nGbAukbuh8Kqm2gnpQ4MaWf8FptSBDhZy9VcpFzp-7m7jJnODIqt2EP247STJn_L2jE1f2R6MDzZomVnzvDkpqx-cb88pQDp-i-eSyqXAJ-iD2U3J3VrHr6FuO88JUAiJEH7s0UK4eZdXurnMjw';
const paymentId = '8679dfef-99f4-4d4d-9a0d-316d5f1f5d70'; // From the webhook log

const options = {
  hostname: 'api.mayar.id',
  port: 443,
  path: `/hl/v1/payment/${paymentId}`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${MAYAR_API_KEY}`
  }
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Response:', data));
});

req.on('error', (e) => console.error(e));
req.end();
