import http from 'http';

const URL = 'http://localhost:5000/api/health';
const CONCURRENT_USERS = 50;
const TOTAL_REQUESTS = 200;

const makeRequest = () => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    http.get(URL, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
         const duration = Date.now() - start;
         resolve({ status: res.statusCode, duration });
      });
    }).on('error', (err) => reject(err));
  });
};

const runLoadTest = async () => {
  console.log(`🚀 Starting Load Test via Node.js...`);
  console.log(`Target: ${URL}`);
  console.log(`Concurrency: ${CONCURRENT_USERS}`);
  
  const promises = [];
  for(let i=0; i<TOTAL_REQUESTS; i++) {
     promises.push(makeRequest());
     if (promises.length >= CONCURRENT_USERS) {
        await Promise.race(promises); // Simple throttling simulation
     }
  }
  
  const results = await Promise.all(promises);
  const success = results.filter(r => r.status === 200).length;
  const avgTime = results.reduce((a,b) => a + b.duration, 0) / results.length;
  
  console.log(`✅ Completed ${results.length} requests`);
  console.log(`✅ Success (200 OK): ${success}`);
  console.log(`⏱️ Avg Response Time: ${avgTime.toFixed(2)}ms`);
};

runLoadTest();
