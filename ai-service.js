// ai-service.js

const AIService = {
    getKey: () => {
        return localStorage.getItem('openai_key');
    },

    setKey: (key) => {
        localStorage.setItem('openai_key', key);
    },

    /**
     * Generates text using OpenAI or falls back to templates
     */
    generate: async (prompt, context = {}, model = "gpt-3.5-turbo") => {
        const key = AIService.getKey();
        if (!key) {
            return null; // Signal to use fallback
        }

        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: "You are an expert software architect acting as a backend for a repository analysis tool. Be concise and technical." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error("AI API Error: " + response.statusText);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (e) {
            console.error("AI Generation failed:", e);
            return null;
        }
    }
};
