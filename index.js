const login = require("ws3-fca");
const express = require("express");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.static("public"));
app.use(express.json());

const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const port = config.port || 3000;

// Configuration Multer pour l'upload des images
const upload = multer({ dest: "uploads/" });

// Route pour gérer les messages texte
app.post("/chat", async (req, res) => {
    const userMessage = req.body.prompt;
    if (!userMessage) return res.status(400).json({ error: "Message requis" });

    try {
        const response = await axios.post("https://gemini-sary-prompt-espa-vercel-api.vercel.app/api/gemini", {
            prompt: userMessage,
            customId: "web-user"
        });

        res.json({ reply: response.data.message });
    } catch (error) {
        console.error("Erreur API Gemini :", error);
        res.status(500).json({ error: "Erreur de traitement" });
    }
});

// Route pour gérer les images envoyées
app.post("/image", upload.single("image"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Image requise" });

    try {
        const response = await axios.post("https://gemini-sary-prompt-espa-vercel-api.vercel.app/api/gemini", {
            link: `https://c-a127.onrender.com/uploads/${req.file.filename}`,
            prompt: "Décrire cette image",
            customId: "web-user"
        });

        res.json({ reply: response.data.message });
    } catch (error) {
        console.error("Erreur API Gemini :", error);
        res.status(500).json({ error: "Erreur de traitement" });
    }
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`Le serveur fonctionne sur http://localhost:${port}`);
});
