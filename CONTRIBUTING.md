# 🐸 Guia de Contribuição da Sapinha 🌈✨

Este guia explica de forma direta como criar novos comandos, definir permissões e integrar novas respostas com a IA.


## 🛠️ Como Funciona a Criação de Comandos

O bot utiliza o padrão **Command Handler** com carregamento dinâmico. Qualquer arquivo `.ts` criado dentro da pasta `src/commands/` é importado e registrado automaticamente ao iniciar o projeto.

### 📝 Estrutura de um Comando (`src/@types/command.ts`)
Todo comando deve implementar a interface `Command`:

* **`name`**: Nome de identificação do comando.
* **`description`**: Breve texto do que o comando faz (exibido no `!menu`).
* **`triggers`**: Lista de palavras/gatilhos que acionam o comando (ex: `['!regras', '!brincadeiras']`).
* **`adminOnly`** *(opcional)*: Booleano que define se é exclusivo para ADMs (padrão: `false`).
* **`execute`**: Função assíncrona executada ao acionar o comando.


## 📌 Exemplos de Referência no Código

### 1. Comando Sem Menu (`src/commands/regras.ts`)
Ideal para envios diretos de mensagens estáticas ou regras.
* **Referência:** Veja `src/commands/regras.ts` e `src/content/regrasData.ts`.
* **Como funciona:** O comando apenas lê uma constante de texto mantida na pasta `src/content/` e envia via `msg.reply()`.

### 2. Comando Com Menu / Parâmetros (`src/commands/brincadeiras.ts`)
Ideal para interações que possuem subopções (ex: `!brincadeira 1`).
* **Referência:** Veja `src/commands/brincadeiras.ts` e `src/content/brincadeirasData.ts`.
* **Como funciona:** O método `execute` lê o array de argumentos (`args`) para entregar subitens do menu contidos em um dicionário de dados em `src/content/`.


## 🛡️ Como Criar Comandos Exclusivos para ADMs

Para restringir um comando apenas às administradoras do grupo, basta definir **`adminOnly: true`** no objeto do comando. 

A checagem de permissão ocorre automaticamente no `src/index.ts` antes de rodar o comando. Se um membro comum tentar acionar, a sapinha recusará com carinho.

```typescript
import { Command } from '../@types/command';

const meuComandoAdmin: Command = {
    name: 'Comando Secreto',
    description: 'Ação restrita do grupo',
    triggers: ['!secreto'],
    adminOnly: true, // 👈 Bloqueia para membros normais 🐸🛡️

    async execute(msg) {
        await msg.reply('🐸✨ Ação de ADM executada com sucesso!');
    }
};

export default meuComandoAdmin;
```

## 🧠 Arquitetura da LLM e Personalidade da Sapinha
A sapinha utiliza a *API da Gemini* para interagir e responder aos membros do grupo quando a mensagem **não** é um comando prefixado (mensagens que não começam com !).

### 📂 Onde fica cada parte da IA:
#### Serviço de Conexão `(src/services/gemini.ts)`:

Concentra a inicialização do SDK do Gemini e a chamada da API, recebendo a mensagem do usuário e retornando a resposta em texto. O projeto começou com a Groq, mas trocamos para Gemini por causa da multimodalidade nativa da API.

#### Personalidade e System Prompt `(src/content/systemPrompts.ts)`:

Contém o systemPrompt que define quem é a sapinha. Para ajustar como ela se comporta, fala ou se expressa, edite as instruções neste arquivo.

## 🧱 Boas Práticas
Separação de Conteúdo: Mantenha textos longos e dados na pasta `src/content/` e deixe a lógica executável em `src/commands/`.

**Apenas Grupos:** O bot é configurado para funcionar exclusivamente dentro de grupos. *Não remova a trava if (!chat.isGroup) no index.ts*.

**Segurança:** Nunca comite arquivos `.env`, chaves de API ou a pasta de sessão `.wwebjs_auth/`.
