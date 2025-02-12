const jsonServer = require('json-server');
const fs = require('fs');
const axios = require('axios');
const { exec } = require('child_process');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

// ✅ Webhook API Route - This will be triggered by GitHub Webhook
server.post('/sync', async (req, res) => {
    try {
        console.log("Webhook Triggered: Fetching latest data...");

        // 1️⃣ Fetch Latest Data from Render API
        const response = await axios.get('https://json-server-api-2owl.onrender.com/questions');
        const updatedData = JSON.stringify(response.data, null, 2);

        // 2️⃣ Write Updated Data to `db.json`
        fs.writeFileSync('db.json', updatedData);

        // 3️⃣ Commit & Push to GitHub
        exec(`
            git add db.json &&
            git commit -m "Auto-Synced from Render API" &&
            git push origin main
        `, (err, stdout, stderr) => {
            if (err) {
                console.error("GitHub Sync Error:", err);
                return res.status(500).json({ message: "GitHub Sync Failed" });
            }
            console.log("GitHub Sync Success:", stdout);
            res.json({ message: "GitHub Sync Successful" });
        });

    } catch (error) {
        console.error("Sync Error:", error);
        res.status(500).json({ message: "Failed to Sync" });
    }
});

// Start JSON-Server
server.use(router);
server.listen(8000, () => {
    console.log('✅ JSON Server is running on port 8000');
});
