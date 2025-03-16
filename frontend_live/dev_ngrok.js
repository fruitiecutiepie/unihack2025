// const ngrok = require("ngrok");
// const fs = require("fs");
// const path = require("path");

// (async function () {
//   try {
//     const backendUrl = await ngrok.connect({
//       addr: 5033,
//       proto: "http",
//       bind_tls: true,
//       host_header: "rewrite",
//       inspect: false,
//       apiUrl: "http://127.0.0.1:4040"
//     });
//     console.log("Backend tunnel started at:", backendUrl);

//     const frontendUrl = await ngrok.connect({
//       addr: 3000,
//       proto: "http",
//       bind_tls: true,
//       host_header: "rewrite",
//       inspect: false,
//       apiUrl: "http://127.0.0.1:4040"
//     });
//     console.log("Frontend tunnel started at:", frontendUrl);

//     // Path to the config file (fixing the path)
//     const configFilePath = path.join(__dirname, "..", "config.json");
    
//     // Read existing config or create empty object if file doesn't exist
//     let config = {};
//     if (fs.existsSync(configFilePath)) {
//       const configData = fs.readFileSync(configFilePath, 'utf8');
//       config = JSON.parse(configData);
//     }

//     config.FRONTEND_URL = frontendUrl;
//     config.BACKEND_URL = backendUrl;
    
//     // Write updated config back to file
//     fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
//     console.log(`Updated config file at ${configFilePath}`);

//     // Keep the process running to maintain the tunnels.
//     console.log("Ngrok tunnel active. Press Ctrl+C to exit.");
//   } catch (error) {
//     console.error("Error setting up ngrok tunnel:", error);
//   }
// })();
