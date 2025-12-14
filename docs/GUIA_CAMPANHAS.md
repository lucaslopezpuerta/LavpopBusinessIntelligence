# Guia de Campanhas WhatsApp

Manual do usuário para criar e gerenciar campanhas de mensagens.

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Criar uma Campanha](#criar-uma-campanha)
3. [Explorar Audiências](#explorar-audiências)
4. [Visualizar Templates](#visualizar-templates)
5. [Acompanhar Resultados](#acompanhar-resultados)
6. [Gerenciar Blacklist](#gerenciar-blacklist)
7. [Dicas e Boas Práticas](#dicas-e-boas-práticas)

---

## Visão Geral

A aba **Campanhas** permite enviar mensagens WhatsApp para seus clientes de forma segmentada e rastreável.

### O que você pode fazer:

| Funcionalidade | Descrição |
|----------------|-----------|
| **Criar Campanhas** | Enviar mensagens promocionais ou de retenção |
| **Segmentar Clientes** | Escolher quem recebe a mensagem |
| **Configurar Descontos** | Testar diferentes ofertas (A/B) |
| **Agendar Envios** | Programar para enviar depois |
| **Ver Resultados** | Acompanhar retorno e receita |

---

## Criar uma Campanha

### Passo a Passo

#### 1. Clique em "Nova Campanha"

O botão roxo no canto superior direito abre o assistente de criação.

#### 2. Escolha a Audiência

Selecione quem vai receber a mensagem:

| Audiência | Quem são | Melhor uso |
|-----------|----------|------------|
| **Em Risco / Crítico** | Clientes inativos há 30+ dias | Campanhas de retorno |
| **Novos Clientes** | Cadastrados recentemente | Boas-vindas |
| **Saudáveis** | Clientes ativos | Promoções especiais |
| **VIP** | Melhores clientes | Ofertas exclusivas |
| **Com Saldo** | Têm crédito na carteira | Lembrete de saldo |
| **Todos** | Toda a base | Comunicados gerais |

> **Dica:** O número mostrado é apenas de clientes com celular válido para WhatsApp.

#### 3. Escolha o Template

Os templates são pré-aprovados pela Meta (WhatsApp Business).

Exemplos:
- **Win-back com Desconto** - Para clientes inativos
- **Boas-vindas** - Para novos clientes
- **Lembrete de Saldo** - Para quem tem crédito

> **Nota:** Os templates são filtrados automaticamente pela audiência escolhida.

#### 4. Configure o Desconto (se aplicável)

Para templates com cupom, você pode escolher:

- **Porcentagem:** 10%, 15%, 20%, 25% ou 30%
- **Serviço:** Lavagem, Secagem ou Ambos

O código do cupom é gerado automaticamente.

#### 5. Visualize a Mensagem

Veja como a mensagem vai aparecer no celular do cliente:

- Clique em **"Ver no Celular"** para preview visual
- A mensagem mostra o nome real do cliente
- Verifique se está tudo correto

#### 6. Envie ou Agende

Você tem duas opções:

| Opção | Quando usar |
|-------|-------------|
| **Enviar Agora** | Disparo imediato |
| **Agendar** | Escolher data e hora |

> **Importante:** O horário de agendamento é sempre no **Horário de Brasília** (São Paulo), independente de onde você esteja acessando o sistema.

Clique em **"Enviar Campanha"** para finalizar.

---

## Explorar Audiências

### Como acessar

1. Na aba Campanhas, clique em **"Audiências"** no menu
2. Veja todos os segmentos disponíveis

### Entendendo os segmentos

**Segmentos de Retenção** (foco em evitar perda):
- Em Risco / Crítico
- Novos Clientes
- Saudáveis

**Segmentos de Marketing** (foco em vendas):
- VIP
- Frequentes
- Promissores
- Esfriando
- Inativos

### Usar filtros

Use os botões de filtro para ver:
- **Todos** - Todos os segmentos
- **Retenção** - Foco em manter clientes
- **Marketing (RFM)** - Foco em vendas

### Selecionar uma audiência

1. Clique no card da audiência desejada
2. A seleção fica salva ao navegar entre abas
3. Na aba Mensagens, os templates serão filtrados

---

## Visualizar Templates

### Como acessar

1. Clique em **"Mensagens"** no menu
2. Veja todos os templates disponíveis

### O que você pode fazer

- **Ver todos os templates** ou filtrados pela audiência selecionada
- **Clicar em um template** para ver detalhes
- **Ver preview no celular** com dados reais de clientes
- **Navegar entre clientes** para ver como fica para cada um

### Usar um template

1. Selecione o template desejado
2. Clique em **"Usar este template"**
3. O assistente de campanha abre com o template já selecionado
4. Continue para configurar desconto e enviar

---

## Acompanhar Resultados

### Dashboard de Campanhas

Na aba **"Visão Geral"**, você vê:

#### Métricas principais

| Métrica | O que significa |
|---------|-----------------|
| **Taxa de Retorno** | % de clientes que voltaram após a mensagem |
| **Receita Recuperada** | Quanto os clientes que voltaram gastaram |
| **Clientes em Risco** | Quantos precisam de atenção |
| **Desconto Ideal** | Qual % de desconto funciona melhor |

#### Comparação de Descontos

Gráfico mostrando qual desconto tem melhor resultado.

#### Funil de Campanhas

Visualização do caminho: **Enviadas → Entregues → Engajaram → Retornaram**

> **Novo:** As taxas de entrega e leitura agora são atualizadas em tempo real com dados do WhatsApp.

#### Campanhas Recentes

Tabela com suas últimas campanhas e resultados.

### Filtrar por período

Use o seletor no canto superior direito:
- Últimos 7 dias
- Últimos 30 dias
- Últimos 90 dias

---

## Gerenciar Blacklist

### O que é a Blacklist?

Lista de números que **não devem** receber mensagens:
- Clientes que pediram para sair
- Números inválidos ou bloqueados
- Números que deram erro de entrega

### Como acessar

Clique em **"Blacklist"** no menu.

### Funções disponíveis

| Ação | Como fazer |
|------|------------|
| **Ver bloqueados** | Lista todos os números |
| **Adicionar número** | Clique em "+" e digite o número |
| **Remover número** | Clique no X ao lado do número |
| **Sincronizar Twilio** | Atualiza lista automaticamente |
| **Exportar** | Baixar lista em arquivo |

### Motivos de bloqueio

- **Opt-out:** Cliente pediu para não receber
- **Inválido:** Número não existe
- **Bloqueado:** WhatsApp bloqueou o número
- **Erro:** Falha de entrega repetida

---

## Dicas e Boas Práticas

### Quando enviar

> **Nota:** Todos os horários abaixo são no **Horário de Brasília** (São Paulo).

| Horário | Recomendação |
|---------|--------------|
| 9h - 11h | Bom para promoções |
| 14h - 16h | Bom para lembretes |
| 18h - 20h | Evitar (horário pessoal) |
| Fins de semana | Evitar |

### Frequência

- **Máximo 1 mensagem por semana** por cliente
- Clientes VIP podem receber mais
- Nunca envie a mesma mensagem duas vezes

### Descontos

| Situação | Desconto sugerido |
|----------|-------------------|
| Cliente sumiu há 30 dias | 15-20% |
| Cliente sumiu há 60+ dias | 20-25% |
| Novo cliente | 10% |
| Promoção geral | 15% |

### Melhorar resultados

1. **Personalize:** Use o nome do cliente
2. **Seja claro:** Diga o benefício logo no início
3. **Crie urgência:** Use prazo de validade curto (7 dias)
4. **Teste:** Compare descontos diferentes (A/B)
5. **Acompanhe:** Veja os resultados e ajuste

### O que evitar

- ❌ Enviar muitas mensagens
- ❌ Mensagens fora do horário comercial
- ❌ Ignorar clientes que pedem para sair
- ❌ Usar descontos muito altos sem necessidade
- ❌ Não acompanhar os resultados

---

## Perguntas Frequentes

### Por que alguns clientes não aparecem?

Apenas clientes com **celular brasileiro válido** aparecem. Números fixos, incompletos ou inválidos são filtrados.

### Por que não consigo enviar?

Verifique:
1. Você selecionou uma audiência?
2. Você selecionou um template?
3. A audiência tem clientes disponíveis?
4. O cliente está na blacklist?

### A mensagem não foi entregue. O que fazer?

Possíveis causas:
- Número errado no cadastro
- Cliente bloqueou mensagens
- WhatsApp do cliente está inativo

O sistema adiciona automaticamente à blacklist após falhas.

### Como saber se a campanha funcionou?

1. Vá para **Visão Geral**
2. Veja a **Taxa de Retorno** (meta: 15-25%)
3. Veja a **Receita Recuperada**
4. Compare com campanhas anteriores

### Posso cancelar uma campanha agendada?

Campanhas agendadas podem ser canceladas antes do horário programado na aba de histórico.

### O horário de agendamento é de qual fuso horário?

Sempre **Horário de Brasília** (São Paulo, UTC-3). Se você agendar uma campanha para 10h, ela será enviada às 10h de Brasília, independente de onde você estiver acessando o sistema.

---

## Automações

### O que são Automações?

Automações são campanhas que **enviam mensagens automaticamente** quando clientes atingem determinados gatilhos, sem necessidade de intervenção manual.

> **Novo (v3.0):** Automações agora funcionam como **"Campanhas Automáticas"** - elas aparecem no dashboard junto com campanhas manuais, permitindo visualizar métricas unificadas de retorno e receita.

### Automações Disponíveis

| Automação | Gatilho | Ação |
|-----------|---------|------|
| **Win-back 30 dias** | Cliente inativo há 30+ dias | Envia cupom de desconto |
| **Win-back Urgente** | Cliente inativo há 45+ dias | Envia oferta agressiva |
| **Boas-vindas** | Primeira compra do cliente | Envia mensagem de boas-vindas + cupom |
| **Lembrete de Saldo** | Cliente com saldo > R$ 20 | Lembra sobre créditos disponíveis |
| **Pós-Visita** | 24h após visita | Agradece e pede avaliação no Google |

### Configurar uma Automação

Para cada automação, você pode configurar:

#### 1. Intervalo entre Envios (Cooldown)

Define quantos dias esperar antes de enviar novamente para o **mesmo cliente**.

| Automação | Padrão | Recomendação |
|-----------|--------|--------------|
| Win-back 30 dias | 30 dias | Evita spam para clientes inativos |
| Win-back Urgente | 21 dias | Última chance, mais agressivo |
| Boas-vindas | 365 dias | Apenas uma vez por ano |
| Lembrete de Saldo | 14 dias | Lembretes periódicos |
| Pós-Visita | 7 dias | Após cada visita |

#### 2. Data de Encerramento

Define uma data limite para a automação parar de enviar. Útil para:
- Promoções sazonais
- Campanhas com prazo definido
- Testes temporários

> **Nota:** O horário é sempre **Horário de Brasília** (São Paulo).

#### 3. Limite Máximo de Envios

Define um número máximo de mensagens que a automação pode enviar no total. Quando atingido, a automação para automaticamente.

Útil para:
- Controlar custos
- Testar com quantidade limitada
- Campanhas com orçamento definido

#### 4. Configuração do Cupom (quando aplicável)

Para automações com cupom, você pode configurar:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **Código do Cupom** | Código que aparece na mensagem (deve existir no POS) | VOLTE20 |
| **Desconto (%)** | Porcentagem do desconto (preenchido automaticamente) | 20% |
| **Validade do Cupom** | Quantos dias o cupom é válido | 7 dias |

### Ativar/Desativar Automações

1. Na aba **Campanhas**, clique em **"Auto"** no menu
2. Localize a automação desejada
3. Use o **toggle** (interruptor) para ativar ou desativar
4. Configure os parâmetros desejados
5. Clique em **"Salvar"**

### Monitorar Automações

#### Painel de Resumo

No topo da aba de Automações, você vê:
- **Ativas:** Quantas automações estão rodando
- **Enviados:** Total de mensagens enviadas por todas as automações
- **Retorno:** Taxa de retorno média das automações
- **Receita:** Receita total recuperada pelas automações

#### Por Automação

Cada automação mostra:
- **Status:** Ativa, Inativa, Encerrada ou Limite atingido
- **Enviados:** Quantidade total de mensagens enviadas
- **Elegíveis:** Clientes que se encaixam no gatilho agora
- **Progresso:** Barra de progresso quando há limite definido
- **Taxa de Retorno:** % de clientes que voltaram após a mensagem (quando disponível)
- **Receita:** Valor gasto pelos clientes que retornaram (quando disponível)

### Boas Práticas para Automações

| Dica | Por quê |
|------|---------|
| Comece com limites baixos | Teste antes de escalar |
| Use intervalos adequados | Evita spam e opt-outs |
| Defina datas de encerramento | Controle sobre campanhas ativas |
| Monitore os resultados | Ajuste conforme necessário |
| Verifique cupons no POS | Cupom deve existir no sistema |

---

## Suporte

Problemas ou dúvidas? Entre em contato com o suporte técnico.

---

*Última atualização: 12 de Dezembro de 2025 (v3.0)*
