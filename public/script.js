const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const fileInput = document.getElementById("file-input");

function appendMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);
    messageDiv.textContent = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
    const message = userInput.value.trim();
    if (message === "") return;

    appendMessage(message, "user");
    userInput.value = "";

    fetch("https://gemini-sary-prompt-espa-vercel-api.vercel.app/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: message, customId: "web_user" })
    })
    .then(response => response.json())
    .then(data => {
        appendMessage(data.message, "bot");
    })
    .catch(error => console.error("Erreur :", error));
}

userInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

fileInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const imageUrl = e.target.result;

        appendMessage("📷 Image envoyée...", "user");

        fetch("https://gemini-sary-prompt-espa-vercel-api.vercel.app/api/gemini", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                link: imageUrl,
                prompt: "Analyse et description de cette image",
                customId: "web_user"
            })
        })
        .then(response => response.json())
        .then(data => {
            appendMessage(data.message, "bot");
        })
        .catch(error => console.error("Erreur :", error));
    };

    reader.readAsDataURL(file);
});
