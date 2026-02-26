import urllib.request
import json
import unicodedata

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])

api_key = "AIzaSyA_CkGpFJnuvH8an21O6AsFuHMysJGpzog"
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

prompt_str = """
                Você é um assistente médico especialista em Miastenia Gravis. 
                Sua tarefa é ler um texto livre de evolução clínica e extrair informações para estruturar perfeitamente em um JSON.
                Retorne ÚNICA e EXCLUSIVAMENTE um objeto JSON onde as chaves são exatamente os seguintes campos solicitados:
                [ Data da avaliação, Quem preencheu, Ambulatório, ID prontuário, Data nascimento, Sexo ]
                
                Instruções:
                1. Mantenha os valores concisos e focados na resposta médica.
                2. Para "ID prontuário", preencha com: "777".
                3. O que não for encontrado no texto, não invente, preencha com string vazia "".
"""
text = "Paciente masculino. Veio ao ambulatório de neurologia. Data de avaliacao hoje."

data = {
    "system_instruction": { "parts": [{"text": prompt_str}] },
    "contents": [{"parts": [{"text": text}]}],
    "generationConfig": {
        "temperature": 0.1,
        "responseMimeType": "application/json"
    }
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        res_json = json.loads(response.read().decode('utf-8'))
        ai_res = res_json['candidates'][0]['content']['parts'][0]['text']
        ai_obj = json.loads(ai_res)
        
        # simulated JS matching logic
        fields = ["Data da avaliação", "Quem preencheu", "Ambulatório", "ID prontuário", "Data nascimento", "Sexo"]
        for field in fields:
            val = ""
            field_lower = remove_accents(field.lower().strip())
            for k, v in ai_obj.items():
                if remove_accents(k.lower().strip()) == field_lower:
                    val = v
                    break
            print(f"Matched {field} -> {val}")
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode('utf-8'))
