# ClickUp - Calculadora de Cotação

Web app para criar cotações profissionais de licenças ClickUp com múltiplas simulações e cálculos dinâmicos.

## 🚀 Funcionalidades

- ✅ **Sistema de Cotação Multi-Item**: Adicione várias simulações em uma única cotação
- ✅ Suporte para 4 tipos de licença: Unlimited, Business, Business Plus e Enterprise
- ✅ Contratos de 1, 2 ou 3 anos com descontos progressivos
- ✅ **Add-ons como itens separados** com descontos próprios
- ✅ **Desconto comercial personalizável** com entrada livre (0-100%)
- ✅ Descontos automáticos por volume de licenças (5% a 20%)
- ✅ Add-ons: Brain AI e Noteker AI
- ✅ **Valores em Dólares Americanos (USD)**
- ✅ **Cálculo de custo por usuário/mês**
- ✅ Visualização detalhada por item e total da cotação
- ✅ Exportação para impressão otimizada
- ✅ Interface responsiva e moderna centralizada
- ✅ **Configuração separada** para fácil manutenção de preços
- ✅ Sem necessidade de instalação ou servidor

## 📋 Tipos de Licença

### Unlimited
- **Preço Base:** $12 USD/usuário/mês
- **Ideal para:** Equipes pequenas e médias

### Business
- **Preço Base:** $19 USD/usuário/mês
- **Ideal para:** Equipes em crescimento

### Business Plus
- **Preço Base:** $24 USD/usuário/mês
- **Ideal para:** Equipes avançadas com recursos premium

### Enterprise
- **Preço Base:** $29 USD/usuário/mês
- **Ideal para:** Grandes organizações

## 💰 Estrutura de Descontos

### Descontos por Duração de Contrato
- **1 Ano:** Sem desconto (preço base)
- **2 Anos:** 10% de desconto
- **3 Anos:** 20% de desconto

### Descontos por Volume (Automáticos)
- 1-10 usuários: Sem desconto
- 11-25 usuários: 5% de desconto
- 26-50 usuários: 10% de desconto
- 51-100 usuários: 15% de desconto
- 101+ usuários: 20% de desconto

### Descontos Comerciais
- **Entrada livre:** Digite qualquer valor de 0 a 100%
- Exemplos comuns:
  - 5% - Cliente novo
  - 10% - Cliente recorrente
  - 15% - Volume alto
  - 20% - Parceiro estratégico

*Nota: Os descontos por volume e comerciais são cumulativos*

## 🎯 Add-ons Disponíveis

### Brain AI
- **Preço:** $5 USD/usuário/mês
- Assistente inteligente com IA para automação

### Noteker AI
- **Preço:** $3 USD/usuário/mês
- Transcrição e anotações automáticas

## 🖥️ Como Usar

### Criando uma Cotação com Múltiplos Itens

1. Abra o arquivo `index.html` em qualquer navegador moderno
2. **Configure um item (licença ou add-on):**
   - Selecione o tipo de produto: **"Licença ClickUp"** ou **"Add-on"**
   - Se licença: escolha Unlimited, Business, Business Plus ou Enterprise
   - Se add-on: escolha Brain AI ou Noteker AI
   - Informe a quantidade de usuários
   - Escolha a duração do contrato (1, 2 ou 3 anos)
   - Digite o desconto comercial (valor livre de 0 a 100%)
3. Clique em **"➕ Adicionar à Cotação"**
4. **Repita os passos 2-3** para adicionar mais itens (licenças ou add-ons)
5. Visualize o resumo completo com:
   - Detalhamento de cada item
   - Valor total do contrato
   - Média mensal
   - **Custo por usuário/mês**
6. **Imprima** a cotação completa

### Gerenciando a Cotação

- **Remover item:** Clique no ✕ ao lado de cada item
- **Limpar tudo:** Clique em "🗑️ Limpar Tudo" no topo da cotação
- **Nova cotação:** Limpe os itens e comece novamente

### 💡 Dica: Add-ons como Itens Separados

Agora você pode adicionar add-ons com **descontos independentes** das licenças!

**Exemplo:**
- Item 1: 50 licenças Business Plus (2 anos, 15% desconto)
- Item 2: 50 add-ons Brain AI (1 ano, 5% desconto)
- Item 3: 25 add-ons Noteker AI (3 anos, 20% desconto)

## 💡 Personalização

Todas as configurações de preços e parâmetros estão centralizadas no arquivo **`config.js`** para fácil manutenção.

### Alterar Preços das Licenças

No arquivo `config.js`, localize e modifique:

```javascript
licenses: {
    unlimited: {
        basePrice: 12, // Altere este valor
        // ...
    },
    business: {
        basePrice: 19, // Altere este valor
        // ...
    }
}
```

### Alterar Preços dos Add-ons

```javascript
addons: {
    brainAI: {
        pricePerUser: 5 // Altere este valor
    },
    notekerAI: {
        pricePerUser: 3 // Altere este valor
    }
}
```

### Alterar Descontos por Contrato

```javascript
contractDurations: {
    annual: {
        multiplier: 0.85, // 0.85 = 15% desconto
        months: 12
    }
}
```

### Alterar Descontos por Volume

```javascript
quantityDiscounts: [
    { min: 1, max: 10, discount: 0 },
    { min: 11, max: 25, discount: 5 }, // 5% desconto
    // Adicione ou modifique faixas
]
```

### Adicionar Novo Tipo de Licença

1. No `config.js`, adicione em `licenses`:
```javascript
premium: {
    id: 'premium',
    name: 'Premium',
    basePrice: 39,
    description: 'Plano premium'
}
```

2. No `index.html`, adicione a opção no select:
```html
<option value="premium">Premium - Plano premium</option>
```

## 📱 Compatibilidade

- ✅ Chrome, Firefox, Safari, Edge (versões modernas)
- ✅ Responsivo para desktop, tablet e mobile
- ✅ Suporte para impressão otimizado

## 🔧 Estrutura do Projeto

```
clickup-cotacao/
├── index.html      # Interface HTML com formulário e sistema de cotação
├── styles.css      # Estilos responsivos e design moderno
├── app.js          # Lógica de cálculo e gerenciamento de cotações
├── config.js       # ⭐ Configurações centralizadas (preços, licenças, etc)
└── README.md       # Documentação completa
```

## 📝 Notas Técnicas

- **Tecnologias:** HTML5, CSS3, JavaScript (Vanilla ES6+)
- **Moeda:** Dólares Americanos (USD)
- **Arquitetura:** Sistema de cotação multi-item com estado em memória
- **Sem dependências externas**
- **Não requer Node.js ou build tools**
- **Funciona offline**
- **Layout centralizado e responsivo**
- **Configuração modular** para fácil manutenção

## 🎨 Customização Visual

As cores principais podem ser alteradas no arquivo `styles.css` nas variáveis CSS:

```css
:root {
    --primary-color: #7b68ee;
    --primary-dark: #6552d9;
    --secondary-color: #24b47e;
    /* ... outras cores */
}
```

## 🆕 Novidades v2.5

- ✅ Sistema de cotação multi-item (adicione vários itens em uma cotação)
- ✅ **4 tipos de licença** incluindo Business Plus
- ✅ **Add-ons como itens separados** com descontos independentes
- ✅ **Contratos de 1, 2 ou 3 anos** (antes era mensal/anual/bienal)
- ✅ **Cálculo de custo por usuário/mês** em cada item
- ✅ Desconto comercial com entrada livre (0-100%)
- ✅ Valores em dólares americanos (USD)
- ✅ Configuração centralizada em arquivo separado (`config.js`)
- ✅ Layout centralizado e otimizado
- ✅ Notificações de feedback ao adicionar/remover itens
- ✅ Gerenciamento completo de itens (adicionar, remover, limpar)
- ✅ Total geral da cotação com múltiplos itens
- ✅ Impressão otimizada para cotações com vários itens

---

**Desenvolvido para facilitar cotações rápidas e precisas de licenças ClickUp**
