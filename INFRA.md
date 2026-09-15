# 🚀 Sapinha Bot - Documentação de Infraestrutura & Deploy (GCP)

## 📌 Visão Geral

O bot **Sapinha** é uma aplicação Node.js / TypeScript integrada com `whatsapp-web.js` (Headless Chromium) e APIs externas de LLM. Devido ao alto consumo de memória RAM decorrente da execução do Chromium e da sincronização contínua via WebSocket em grupos movimentados do WhatsApp, a aplicação foi colocada na Google Cloud Platform (GCP).

---

## 🏗️ Especificações da Infraestrutura (Always Free)

* **Provedor:** Google Cloud Platform (GCP) - Compute Engine
* **Tipo de Instância:** `e2-micro` (1 vCPU compartilhada, 1 GB RAM física)
* **Região:** `us-central1` (Iowa)
* **Sistema Operacional:** Ubuntu 26.04 LTS
* **Disco:** 30 GB Standard Persistent Disk (Disco Rígido Padrão)
* **Estratégia Anti-OOM (Memória Virtual):** **2 GB de arquivo Swap** configurados no disco, totalizando **~3 GB de memória utilizável** (RAM + Swap).

---

## 🛠️ Como Mandar uma Nova Versão para a Cloud (Deploy Contínuo)
Sempre que você fizer alterações no código local e der git push para o repositório (main), siga estes passos no terminal SSH da VM na GCP para atualizar a produção:

Passo a passo rápido:
```bash
# 1. Acesse o diretório do projeto
cd ~/SEU_REPOSITORIO

# 2. Puxe as atualizações do GitHub
git pull origin main

# 3. Instale novas dependências (se houver)
npm install

# 4. Recompile o código TypeScript
npm run build

# 5. Reinicie o processo no PM2 (sem perda de sessão do WhatsApp)
pm2 restart sapinha-bot
```

## Comandos Úteis do PM2 para Monitoramento
# Ver status e uso de memória:

```Bash
pm2 list
# ou monitor em tempo real:
pm2 monit`
```

# Acompanhar logs ao vivo (mensagens, erros ou QR Code):

```Bash
pm2 logs sapinha-bot
```

# Limpeza em caso de instâncias duplicadas:

```bash
pm2 delete all
pm2 start dist/index.js --name sapinha-bot
pm2 save
```

# Persistência de inicialização em reboot da VM:
```bash
pm2 startup  # (execute o comando sudo gerado pelo PM2)
pm2 save
```