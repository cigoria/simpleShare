import express from "express";
import router from "./routes";
const os = require("os")
import path from "path"
require("dotenv").config();


const PORT = process.env.PORT || 3000;
const app = express()
app.use(express.static(path.join(__dirname, 'public')));



app.use("/",router)

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