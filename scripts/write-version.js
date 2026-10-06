const fs = require("fs");
const path = require("path");

const version = Date.now().toString();
const root = path.join(__dirname, "..");

fs.writeFileSync(
  path.join(root, "public", "version.json"),
  JSON.stringify({ version })
);

const envPath = path.join(root, ".env.production.local");
const linea = `REACT_APP_BUILD_ID=${version}`;
const previo = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const lineas = previo
  .split(/\r?\n/)
  .filter((item) => item && !item.startsWith("REACT_APP_BUILD_ID="));
lineas.push(linea);
fs.writeFileSync(envPath, `${lineas.join("\n")}\n`);
