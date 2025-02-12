document.addEventListener("DOMContentLoaded", () => {
    const chatBox = document.getElementById("chat-box");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const fileInput = document.getElementById("file-input");

    function appendMessage(sender, text) {
        const message = document.createElement("div");
        message.innerHTML = `<strong>${sender}:</strong> ${text}`;
        chatBox.appendChild(message);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    sendBtn.addEventListener("click", async () => {
        const text = userInput.value.trim();
        if (!text) return;

        appendMessage("Vous", text);
        userInput.value = "";

        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: text })
            });

            const data = await response.json();
            appendMessage("Bot", data.reply);
        } catch (error) {
            appendMessage("Bot", "Erreur de connexion !");
        }
    });

    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;

        appendMessage("Vous", "Image envoyée 📷");

        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch("/image", {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            appendMessage("Bot", data.reply);
        } catch (error) {
            appendMessage("Bot", "Erreur d'analyse de l'image !");
        }
    });
});
