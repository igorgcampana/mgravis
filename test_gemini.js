const apiKey = "AIzaSyDK0qsDwc3dqSgzJ-Jmun7aSWxtwog2G5w";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

const promptStr = `
                Você é um assistente médico especialista em Miastenia Gravis. 
                Sua tarefa é ler um texto livre de evolução clínica e extrair informações para estruturar perfeitamente em um JSON.
                Retorne ÚNICA e EXCLUSIVAMENTE um objeto JSON onde as chaves são exatamente os seguintes campos solicitados:
                [ Data da avaliação, Quem preencheu ]
`
const text = "teste";

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        system_instruction: { parts: [{ text: promptStr }] },
        contents: [{ parts: [{ text: text }] }],
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
        }
    })
}).then(res => res.text()).then(t => console.log(t)).catch(console.error);
