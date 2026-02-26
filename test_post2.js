const url = "https://script.google.com/macros/s/AKfycbylIUZ_w4yDTzagZB2drnJDW9wbdM84R6fO_3vz0GPMKuscPbBoNJUlYEgu4AnsFZpqCg/exec";

const payload = {
    type: "Baseline",
    data: {
        "Ambulatório": "Teste AmbJS",
        "Data da avaliação": "2026-02-22",
        "ID prontuário": "111222333"
    }
};

fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Apps Script lida melhor com text/plain no CORS direto as vezes
    body: JSON.stringify(payload)
}).then(r => r.json()).then(console.log).catch(console.error);
