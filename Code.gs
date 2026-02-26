const SHEET_ID = '16qWi8kEus6aYnHENO1NjU55uCCzpt57xd-MHWy7kWqE';
const GEMINI_API_KEY = 'AIzaSyCCyMdL4BhspMU0YFBXDaWQ3xdWyZKG7ig';

function doGet(e) {
  const action = e.parameter.action;
  const idProntuario = e.parameter.id;

  if (action === 'checkId' || action === 'getHistory') {
    if (!idProntuario) {
      return outputJSON({ error: 'ID não fornecido' });
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheetBaseline = ss.getSheetByName('Baseline');
    const sheetSeguimento = ss.getSheetByName('Seguimento');
    
    let baselineExists = false;
    let historyBaseline = [];
    if(sheetBaseline) {
        const data = sheetBaseline.getDataRange().getValues();
        const sheetHeaders = data[0];
        const idIndex = sheetHeaders.indexOf('Prontuário');
        if(idIndex !== -1) {
            for(let i=1; i<data.length; i++) {
                if(String(data[i][idIndex]) === String(idProntuario)) {
                    baselineExists = true;
                    if(action === 'getHistory') {
                      let obj = {};
                      sheetHeaders.forEach((h, j) => obj[h] = data[i][j]);
                      historyBaseline.push(obj);
                    } else {
                      break;
                    }
                }
            }
        }
    }
    
    let historySeguimento = [];
    if(action === 'getHistory' && sheetSeguimento) {
        const data = sheetSeguimento.getDataRange().getValues();
        const sheetHeaders = data[0];
        const idIndex = sheetHeaders.indexOf('Prontuário');
        if(idIndex !== -1) {
            for(let i=1; i<data.length; i++) {
                if(String(data[i][idIndex]) === String(idProntuario)) {
                    let obj = {};
                    sheetHeaders.forEach((h, j) => obj[h] = data[i][j]);
                    historySeguimento.push(obj);
                }
            }
        }
    }

    let result = {};
    if (action === 'checkId') {
      result = { exists: baselineExists, type: baselineExists ? 'Seguimento' : 'Baseline' };
    } else if (action === 'getHistory') {
      result = { history: { baseline: historyBaseline, seguimento: historySeguimento } };
    }

    return outputJSON(result);
  }
  
  return ContentService.createTextOutput("Action not found");
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    const type = postData.type; // 'Baseline' ou 'Seguimento' ou 'extractAI'
    const formData = postData.data;
    
    // Novo: Lógica de extração com IA via Proxy
    if (type === 'extractAI') {
      const result = extractFromGemini(formData.prompt, formData.text);
      return outputJSON(result);
    }

    let sheet = ss.getSheetByName(type);
    
    if (!sheet) {
      return outputJSON({ error: `Aba ${type} não encontrada` });
    }
    
    let headers = sheet.getDataRange().getValues()[0];
    
    if (type === 'Seguimento') {
      const idProntuario = formData['Prontuário'];
      let evalCount = 1;
      const data = sheet.getDataRange().getValues();
      const idIndex = headers.indexOf('Prontuário');
      if (idIndex !== -1) {
         for(let i = 1; i < data.length; i++) {
           if(String(data[i][idIndex]) === String(idProntuario)) {
             evalCount++;
           }
         }
      }
      formData['Avaliacao'] = evalCount;
    }

    const rowData = headers.map(header => {
      const lowerHeader = header.toLowerCase();
      // Preenche automaticamente o Timestamp se a coluna existir e estiver vazia no formData
      if ((lowerHeader === 'timestamp' || lowerHeader === 'carimbo de data/hora') && !formData[header]) {
        return new Date();
      }
      return formData[header] !== undefined ? formData[header] : '';
    });
    
    sheet.appendRow(rowData);
    
    return outputJSON({ success: true, message: 'Dados gravados com sucesso!' });
  } catch (error) {
    return outputJSON({ error: error.toString() });
  }
}

function outputJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
  return ContentService.createTextOutput("");
}

/**
 * Função auxiliar para chamar a API do Gemini via UrlFetchApp
 */
function extractFromGemini(prompt, text) {
  // Tenta pegar a chave do PropertiesService (Propriedades do Script). Se não existir, usa a constante.
  let apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) apiKey = GEMINI_API_KEY;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    systemInstruction: { parts: [{ text: prompt }] },
    contents: [{ parts: [{ text: text }] }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const resText = response.getContentText();
    
    // Tratamento robusto para parsing da resposta geral da API do Google
    let resJson;
    try {
      resJson = JSON.parse(resText);
    } catch (e) {
      return { success: false, raw: resText, error: `Falha ao interpretar resposta do Google: ${e.message}` };
    }
    
    if (response.getResponseCode() !== 200) {
      return { success: false, raw: resText, error: `Erro na API do Gemini: ${resJson.error ? resJson.error.message : resText}` };
    }

    if (resJson.candidates && resJson.candidates[0] && resJson.candidates[0].content) {
      const aiContent = resJson.candidates[0].content.parts[0].text;
      
      // Limpeza robusta: remove os marcadores markdown ```json e ```
      const cleanContent = aiContent.replace(/```(json)?/gi, '').replace(/```/g, '').trim();
      
      try {
        const parsedData = JSON.parse(cleanContent);
        return { success: true, data: parsedData, raw: cleanContent };
      } catch (parseErr) {
        // Fallback: se não der parse de jeito nenhum, retorna o texto bruto
        return { success: false, raw: aiContent, error: 'O modelo não retornou um JSON válido.' };
      }
    } else {
      return { success: false, raw: resText, error: 'Gemini não retornou nenhum texto/candidato útil.' };
    }
  } catch (e) {
    return { success: false, raw: "", error: `Exceção fatal no Apps Script: ${e.toString()}` };
  }
}
