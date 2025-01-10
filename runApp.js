const fs = require("fs");
const login = require("chatbox-fca-remake");
const express = require("express");
const app = express();

// Load configuration from config.json
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const port = config.port || 3000;  // Use the port from config.json or default to 3000

// Load commands from the cmds folder
const commandFiles = fs.readdirSync('./cmds').filter(file => file.endsWith('.js'));
console.log("=====COMMANDS LOADED=====");
commandFiles.forEach(file => {
    console.log(`[~] ${file.replace('.js', '')}`);
});

login({
    email: config.email,
    password: config.password
}, (err, api) => {
    if (err) return console.error(err);  // Handle login errors

    // Set the bot's options for its behavior and connection
    api.setOptions({
        forceLogin: true,  // Force login even if the session is active
        listenEvents: true,  // Enable event listening
        logLevel: "silent",  // Set log level to silent (no logs)
        updatePresence: true,  // Keep the presence (status) updated
        selfListen: false,  // Do not listen to the bot's own messages
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:118.0) Gecko/20100101 Firefox/118.0",  // Set custom user agent for the bot
        online: true,  // Keep the bot online or Set it to true if you want to see bots online status.
        autoMarkDelivery: true,  // Disable auto marking of delivery status
        autoMarkRead: false  // Disable auto marking of messages as read
    });

    // Function to handle commands
    function handleCommand(event) {
        const prefix = config.prefix;
        const message = event.body;

        if (!message.startsWith(prefix)) return;

        const command = message.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();

        if (!command) {
            api.sendMessage("No command input, please type `/help` for available commands.", event.threadID);
            return;
        }

        if (!commandFiles.includes(`${command}.js`)) {
            api.sendMessage("This command is not available or it is invalid.", event.threadID);
            return;
        }

        // Load and execute the command
        const commandFile = require(`./cmds/${command}.js`);
        commandFile.execute(api, event);
    }

    // Start listening for incoming messages and events
    const stopListening = api.listenMqtt((err, event) => {
        if (err) return console.error(err);  // Handle any errors while listening

        switch (event.type) {
            case "message":
                handleCommand(event);
                break;
            case "event":
                console.log(event);  // Log any other event type
                break;
        }
    });
});

// Define a simple route
app.get("/", (req, res) => {
    res.send("Bot is running");
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
