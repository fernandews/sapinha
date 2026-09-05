# 🐸 Sapinha

Bot modular para WhatsApp desenvolvido em **Node.js** com **TypeScript**, com suporte a comandos customizados, integração com **Groq Cloud (Llama 3.1 8B / Llama 3.2 Vision)** para respostas inteligentes e **Whisper** para áudios.

---

## 🛠️ Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:

* [Node.js](https://nodejs.org/) **v18** ou **v20 LTS**
* **npm** (instalado automaticamente junto com o Node.js)
* **Git**
* Um celular com WhatsApp para escaneamento do QR Code

---

## 🚀 Como Baixar e Rodar o Projeto Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/fernandews/sapinha.git
cd sapinha
```

### 2. Instalar as Dependências
Como o projeto possui todas as bibliotecas e tipos declarados no package.json, basta rodar:
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Crie um arquivo chamado .env na raiz do projeto contendo as suas chaves de API:

```code
GROQ_API_KEY=sua_chave_groq_aqui
```

## ⚙️ Scripts Disponíveis
**npm run dev:** Inicia o bot em modo de desenvolvimento local usando tsx com auto-reload.

**npm run build:** Compila todo o código TypeScript (src/) para JavaScript puro dentro da pasta de produção (dist/).

**npm start:** Executa o código compilado da pasta dist/ (utilizado em ambiente de produção na VM/Nuvem).

## 📁 Estrutura de Pastas e Arquivos
```plaintext
.
├── src/
│   ├── @types/          # Definições de interfaces e tipos globais do TypeScript
│   │   └── command.ts   # Interface de padrão rígido para criação de comandos
│   │
│   ├── commands/        # Gerenciador de Comandos (Command Handler)
│   │   └── brincadeiras.ts  # Arquivo de comando isolado
│   │
│   ├── content/         # Módulos de dados, menus, prompts e textos desacoplados
│   │   └── brincadeirasData.ts
│   │
│   ├── services/        # Integrações com APIs externas (Groq/Llama, Whisper)
│   │
│   └── index.ts         # Ponto de entrada, inicialização do WhatsApp e carregador dinâmico
│
├── dist/                # Código JavaScript compilado (gerado pelo build)
├── .env                 # Variáveis de ambiente (Chaves secretas - NÃO comitar)
├── .gitignore           # Arquivos e pastas ignorados pelo Git
├── package.json         # Dependências e scripts do projeto
├── tsconfig.json        # Configuração do compilador TypeScript
└── README.md            # Documentação do projeto
```
 ### Para que serve cada pasta:
**src/@types/:** Garante o autocompletar e a tipagem correta de todos os módulos.

**src/commands/:** Cada novo comando do bot deve ser criado como um arquivo .ts individual nesta pasta. O index.ts carrega qualquer comando criado aqui automaticamente.

**src/content/:** Mantém todos os textos longos, opções de menus e prompts da LLM separados da lógica de código, facilitando alterações rápidas de conteúdo sem quebrar o bot.

**src/services/:** Concentra as chamadas para as IAs e serviços de terceiros.

## 🧪 Como Testar o Bot Localmente
Execute o comando de desenvolvimento no terminal:

```Bash
npm run dev
```
Um QR Code será exibido no terminal.
Abra o WhatsApp no celular, vá em Aparelhos Conectados > Conectar um aparelho e escaneie o QR Code do terminal.

Aguarde a mensagem no terminal:

```Bash
🤖 Bot em TypeScript totalmente conectado e pronto para uso!
```

## 👩🏽‍💻 Como contribuir para o projeto

Para saber como mudar a personalidade do bot e criar seus próprios comandos, leia o [CONTRIBUTING.md](https://github.com/fernandews/sapinha/blob/main/CONTRIBUTING.md)