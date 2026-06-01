# 🔄 Configurar Escrita na Planilha (Google Apps Script)

Para que o app grave o status das tarefas de volta na planilha Google, siga estes passos:

## 1. Abrir o Editor de Scripts

1. Abra sua planilha no Google Sheets
2. Vá em **Extensões → Apps Script**
3. Apague o conteúdo padrão e cole o código abaixo:

## 2. Colar este código

```javascript
/**
 * Kanban Kids - API de atualização de status
 * Recebe POST do app e atualiza a coluna Status na planilha
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const rows = sheet.getDataRange().getValues();
    
    // Encontra índices das colunas
    const headers = rows[0].map(h => h.toString().toLowerCase().trim());
    const titleCol = headers.indexOf('título') !== -1 ? headers.indexOf('título') : headers.indexOf('titulo');
    const responsavelCol = headers.indexOf('responsável') !== -1 ? headers.indexOf('responsável') : headers.indexOf('responsavel');
    const statusCol = headers.indexOf('status');
    
    if (titleCol === -1 || statusCol === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false, error: 'Colunas não encontradas'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    let updated = 0;

    // Atualiza status das tarefas recebidas
    if (data.updates && Array.isArray(data.updates)) {
      data.updates.forEach(function(update) {
        for (let i = 1; i < rows.length; i++) {
          const rowTitle = rows[i][titleCol].toString().trim().toLowerCase();
          const rowResp = rows[i][responsavelCol] ? rows[i][responsavelCol].toString().trim().toLowerCase() : '';
          
          if (rowTitle === update.title.toLowerCase().trim()) {
            // Se tem responsável, verifica match
            if (update.child && rowResp && rowResp !== update.child.toLowerCase().trim()) {
              continue;
            }
            sheet.getRange(i + 1, statusCol + 1).setValue(update.status);
            updated++;
            break;
          }
        }
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true, updated: updated
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false, error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Necessário para CORS (preflight)
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok', message: 'Kanban Kids API ativa'
  })).setMimeType(ContentService.MimeType.JSON);
}
```

## 3. Publicar como Web App

1. Clique em **Implantar → Nova implantação**
2. Tipo: **App da Web**
3. Configurações:
   - Descrição: `Kanban Kids API`
   - Executar como: **Eu** (sua conta)
   - Quem tem acesso: **Qualquer pessoa**
4. Clique em **Implantar**
5. **Copie a URL** gerada (formato: `https://script.google.com/macros/s/XXXXX/exec`)

## 4. Colar a URL no App

1. No app, vá em **⚙️ Config**
2. Cole a URL no campo **"URL do Apps Script (escrita)"**
3. Clique em **Salvar**

## Pronto!

Agora quando você mover uma tarefa no Kanban ou validar, o status será atualizado automaticamente na planilha. Sua esposa pode sincronizar no celular dela e verá o status atualizado.

## Mapeamento de Status

| No App | Na Planilha |
|--------|-------------|
| 📋 A Fazer | A Fazer |
| 🚀 Fazendo | Fazendo |
| ✅ Concluído | Concluído |
| 🏆 Validado | Validado |
