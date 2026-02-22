import express from "express";
import router from "./routes";
const os = require("os")
import path from "path"
import history from 'connect-history-api-fallback';
require("dotenv").config();


const PORT = process.env.PORT || 3000;
const app = express()

// API route-ok először
app.use(express.json());
app.use("/api", router)

// Statikus fájlok kiszolgálása a buildelt frontend mappából
app.use(express.static(path.join(process.cwd(), 'dist/public')));

// History API fallback a SPA útválasztáshoz (a statikus fájlok után)
app.use(history({
  rewrites: [
    { from: /^\/api\/.*$/, to: (context: any) => context.parsedUrl.pathname }
  ]
}));



function getIPv4Addresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const inter of interfaces[name]) {
      if (inter.family === "IPv4" && !inter.internal) {
        addresses.push(inter.address);
      }
    }
  }
  return addresses;
}

app.listen(PORT, () => {
  console.log("Server is Running");
  console.log(`http://localhost:${PORT}`);

  const ipAddresses = getIPv4Addresses();
  ipAddresses.forEach((ip) => {
    console.log(`http://${ip}:${PORT}`);
  });
});