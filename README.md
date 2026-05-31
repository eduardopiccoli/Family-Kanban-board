# 🎮 Kanban Kids — Tarefas Divertidas com Recompensas

<p align="center">
  <strong>Um quadro Kanban gamificado para crianças de 5 a 12 anos.</strong><br>
  Pais acompanham tarefas, validam conquistas e concedem pontos que podem ser trocados por recompensas.
</p>

---

## 📸 Visão Geral

| Quadro Kanban | Loja de Recompensas | Dashboard |
|:---:|:---:|:---:|
| Drag & Drop entre colunas | Troque pontos por prêmios | Ranking, medalhas e gráficos |

---

## ✨ Funcionalidades

### 👶 Gestão de Crianças
- Cadastro com nome, avatar (emoji) e cor de identificação
- Pontuação individual, nível e streak de dias consecutivos

### 📋 Quadro Kanban (4 colunas)
| Coluna | Descrição |
|--------|-----------|
| 📋 A Fazer | Tarefas pendentes |
| 🚀 Fazendo | Em andamento |
| ✅ Concluído | Feita pela criança (aguarda validação) |
| 🏆 Validado | Aprovada pelos pais — pontos creditados |

- **Drag and drop** para mover tarefas entre colunas
- Tarefas com título, descrição, responsável, pontos e categoria

### 🏷️ Categorias
| Emoji | Categoria |
|:---:|---|
| 🏠 | Casa |
| 📚 | Estudos |
| 🦷 | Higiene |
| 🏃 | Exercícios |
| ❤️ | Boas ações |

### ✅ Sistema de Validação
- Criança move tarefa para "Concluído"
- Pontos **NÃO** são contabilizados ainda
- Pais clicam em **"Validar"** → pontos creditados → tarefa vai para "Validado"

### ⭐ Sistema de Pontos e Níveis

| Nível | Pontos Necessários | Título |
|:---:|:---:|---|
| 1 | 0 | Iniciante |
| 2 | 100 | Aprendiz |
| 3 | 250 | Explorador |
| 4 | 500 | Aventureiro |
| 5 | 1000 | Mestre |

- Barra de progresso animada para o próximo nível
- Confetes ao subir de nível 🎉

### 🎁 Loja de Recompensas
Exemplos pré-cadastrados:

| Recompensa | Custo |
|---|:---:|
| 🍰 Escolher sobremesa | 50 pts |
| 🎬 Escolher filme da noite | 100 pts |
| 🍦 Sorvete | 150 pts |
| 🎡 Passeio especial | 300 pts |
| 🧸 Brinquedo pequeno | 500 pts |

- Resgate debita pontos e registra histórico

### 🏅 Medalhas e Conquistas

| Medalha | Condição |
|:---:|---|
| 🥉 Primeira Tarefa | 1 tarefa concluída |
| 🥈 10 Tarefas | 10 tarefas concluídas |
| 🥇 50 Tarefas | 50 tarefas concluídas |
| ⭐ 7 Dias Seguidos | Streak de 7 dias |
| 🔥 30 Dias Seguidos | Streak de 30 dias |
| 📚 Mestre dos Estudos | 20 tarefas de estudos |
| 🏠 Herói da Casa | 20 tarefas de casa |

- Confetes ao desbloquear medalha 🎊

### 📊 Dashboard
- Ranking dos filhos com pontos e nível
- Gráfico de tarefas por semana (barras)
- Gráfico de pontos por semana (linha)
- Gráfico de categorias mais executadas (rosca)
- Powered by **Chart.js**

### 🎨 Visual
- Tema inspirado em jogos (Roblox, Minecraft, Mario)
- Cartões coloridos com bordas por criança
- Ícones grandes e legíveis
- Animações suaves (bounce, fade, pulse)
- Confetes ao ganhar medalhas e subir de nível
- **Tema claro/escuro** com toggle

### ⚙️ Extras
- 🔊 Sons opcionais (Web Audio API)
- 📤 Exportar backup JSON
- 📥 Importar backup JSON
- 🗑️ Botão resetar dados
- 📱 Instalável como PWA
- 📶 Funciona offline (Service Worker)

---

## 🚀 Como Usar

```bash
# Opção 1: Abrir diretamente
# Basta abrir index.html no navegador

# Opção 2: Servidor local (recomendado para PWA)
npx serve .
# ou
python3 -m http.server 8000
```

### Primeiros Passos

1. Clique em **"➕ Adicionar Criança"** e cadastre os filhos
2. Clique em **"➕ Nova Tarefa"** para criar tarefas com pontos
3. Arraste tarefas entre as colunas conforme progresso
4. Quando a criança concluir, clique em **"✓ Validar"** para dar os pontos
5. Acesse a **🎁 Loja** para resgatar recompensas
6. Acompanhe o progresso no **📊 Dashboard**

---

## 📁 Estrutura do Projeto

```
kamban-family/
├── index.html          # Página principal (SPA)
├── manifest.json       # Configuração PWA
├── sw.js               # Service Worker (offline)
├── README.md
├── css/
│   └── style.css       # Estilos (variáveis, responsivo, temas)
├── js/
│   ├── storage.js      # Persistência localStorage + backup
│   ├── achievements.js # Níveis, medalhas e streaks
│   ├── kanban.js       # Quadro Kanban + drag & drop
│   ├── rewards.js      # Loja de recompensas
│   └── app.js          # Controlador principal (navegação, UI, sons)
└── icons/
    └── icon-192.svg    # Ícone do app
```

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 | Estrutura semântica |
| CSS3 | Layout (Grid/Flexbox), animações, variáveis, responsivo |
| JavaScript Vanilla | Lógica completa sem frameworks |
| localStorage | Persistência de dados |
| Chart.js 4 | Gráficos no dashboard |
| Service Worker | Cache offline / PWA |
| Web Audio API | Sons de feedback |

**Sem backend. Sem dependências de build. Sem Node.js necessário.**

---

## 📱 Deploy no GitHub Pages

1. Faça push do repositório para o GitHub
2. Acesse **Settings → Pages**
3. Em "Source", selecione a branch `main` e pasta `/ (root)`
4. Aguarde o deploy e acesse pelo link gerado

```
https://seu-usuario.github.io/kamban-family/
```

---

## 🔧 Personalização

### Adicionar novas categorias
Edite o `<select>` em `index.html` e o objeto `categoryIcons` em `kanban.js`.

### Alterar níveis
Modifique o array `LEVELS` em `js/achievements.js`.

### Adicionar medalhas
Adicione objetos ao array `MEDALS` em `js/achievements.js` com `id`, `name`, `icon`, `description` e função `check`.

### Alterar cores do tema
Modifique as variáveis CSS em `:root` no arquivo `css/style.css`.

---

## 📄 Licença

MIT — Use, modifique e distribua livremente.

---

<p align="center">
  Feito com ❤️ para famílias que querem tornar as tarefas do dia a dia mais divertidas.
</p>
