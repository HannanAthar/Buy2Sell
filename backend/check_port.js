import net from 'net';

const checkPort = (port, host) => {
  const socket = new net.Socket();
  socket.setTimeout(2000);
  
  socket.on('connect', () => {
    console.log(`✅ Port ${port} on ${host} is OPEN`);
    socket.destroy();
  });
  
  socket.on('timeout', () => {
    console.log(`❌ Port ${port} on ${host} TIMEOUT`);
    socket.destroy();
  });
  
  socket.on('error', (err) => {
    console.log(`❌ Port ${port} on ${host} CLOSED/ERROR: ${err.message}`);
  });
  
  socket.connect(port, host);
};

checkPort(5000, '127.0.0.1');
checkPort(5000, 'localhost');
checkPort(5000, '::1');
