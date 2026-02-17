import fetch from 'node-fetch'; // or built-in in Node 18+

const testApi = async () => {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
};

testApi();
