# 🚀 Guia de Deploy e Arquitetura de Hospedagem

Este documento descreve o fluxo de implantação contínua (CI/CD) da **Sapinha** e a infraestrutura que mantém o bot ativo 24 horas por dia, 7 dias por semana.

> **NUNCA suba alterações parciais, rascunhos ou código não testado diretamente para a branch `main`.**
 
A branch `main` está conectada diretamente ao ambiente de produção. Todo `git push` disparado para ela aciona um **deploy automático e imediato**. Código quebrado enviará falhas direto para o ambiente rodando no WhatsApp.

**Regra de Ouro:** Teste todas as alterações localmente. Sempre que for desenvolver uma nova funcionalidade, crie uma nova branch (ex: `feature/novo-comando`) e só realize o merge para a `main` após validação completa.

## 🛠️ Arquitetura de Infraestrutura

A infraestrutura do bot é composta por duas camadas gratuitas e integradas de forma resiliente:
 ```
┌─────────────────┐       git push       ┌──────────────────┐
│ Repositório     │ ───────────────────> │ Render.com       │
│ (GitHub / main) │   Deploy Automático  │ (Web Service Node)│
└─────────────────┘                      └─────────┬────────┘
│
Ping HTTP │ Ping a cada 5m
(Keepalive)│ (Evita sleep)
▼
┌──────────────────┐
│ UptimeRobot      │
│ (Monitoramento)  │
└──────────────────┘
```

### 1. Servidor de Aplicação (Render.com)
* **Ambiente:** Servidor Linux gerenciado executando o runtime do Node.js.
* **Automação de Build:** Durante a compilação, o script de pós-instalação garante o download do binário headless do Chromium para execução do `whatsapp-web.js`.
* **Variáveis de Ambiente:** Todas as chaves de API, senhas e credenciais confidenciais estão armazenadas em variáveis de ambiente protegidas no painel do servidor. **Nenhuma chave fica salva no código-fonte.**

### 2. Monitor de Disponibilidade (UptimeRobot)
* **Objetivo:** Garantir a operação ininterrupta do serviço na camada *Free*.
* **Mecanismo:** A instância do Render entra em modo de repouso (*sleep*) após 15 minutos sem receber chamadas web externas. Para contornar essa restrição, o bot expõe um micro-servidor HTTP básico interno.
* **Keep-Alive:** O UptimeRobot dispara requisições periódicas a cada 5 minutos para esse endpoint HTTP, simulando tráfego real e mantendo o bot ativo e respondendo no WhatsApp continuamente.

---

## 💻 Fluxo de Deploy de Novas Atualizações

Para enviar uma atualização aprovada para produção, siga o fluxo padronizado do Git:

1. **Garantir que a build local funciona:**
   ```bash
   npm run build