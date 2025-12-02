# Guia de Configuração - ClickUp Cotação

Este guia explica como modificar os parâmetros do sistema editando o arquivo `config.js`.

## 📝 Estrutura do config.js

O arquivo está organizado em seções:

### 1. Tipos de Licença (`licenses`)
Define os planos disponíveis e seus preços base.

```javascript
licenses: {
    unlimited: {
        id: 'unlimited',           // ID único (não mude)
        name: 'Unlimited',          // Nome exibido
        basePrice: 12,              // Preço USD/usuário/mês
        description: 'Descrição'    // Texto descritivo
    }
}
```

**Como adicionar nova licença:**
1. Copie um bloco existente
2. Mude o id e name
3. Ajuste basePrice e description
4. Adicione a opção correspondente no `index.html`

### 2. Durações de Contrato (`contractDurations`)
Define os períodos disponíveis e descontos.

```javascript
annual: {
    id: 'annual',
    name: 'Anual',
    multiplier: 0.85,    // 0.85 = 15% desconto
    months: 12,
    discount: 15         // % para referência
}
```

**Multiplier:**
- 1.0 = sem desconto
- 0.85 = 15% desconto
- 0.75 = 25% desconto
- 0.90 = 10% desconto

### 3. Add-ons (`addons`)
Produtos complementares.

```javascript
brainAI: {
    id: 'brainAI',
    name: 'Brain AI',
    pricePerUser: 5,              // USD/usuário/mês
    description: 'Assistente IA'
}
```

### 4. Descontos por Quantidade (`quantityDiscounts`)
Descontos automáticos baseados no volume.

```javascript
quantityDiscounts: [
    { min: 1, max: 10, discount: 0 },      // 0% para 1-10
    { min: 11, max: 25, discount: 5 },     // 5% para 11-25
    { min: 26, max: 50, discount: 10 },    // 10% para 26-50
    // ...
]
```

**Regras:**
- `min` e `max` definem a faixa de quantidade
- `discount` é a % de desconto automático
- Use `Infinity` para o último tier (ex: 101+)

### 5. Configurações de Moeda (`currency`)

```javascript
currency: {
    code: 'USD',        // Código ISO da moeda
    symbol: '$',        // Símbolo exibido
    locale: 'en-US'     // Locale para formatação
}
```

**Para mudar para Real (BRL):**
```javascript
currency: {
    code: 'BRL',
    symbol: 'R$',
    locale: 'pt-BR'
}
```

### 6. Informações da Empresa (`company`)

```javascript
company: {
    name: 'Volari',
    tagline: 'Revenda Autorizada ClickUp'
}
```

## 🔧 Exemplos Práticos

### Exemplo 1: Aumentar preço do Business para $22

No `config.js`, linha ~17:
```javascript
business: {
    id: 'business',
    name: 'Business',
    basePrice: 22,  // ← era 19, agora 22
    description: 'Equipes em crescimento'
}
```

### Exemplo 2: Adicionar desconto de 30% para contratos trienais

No `config.js`, adicione após `biennial`:
```javascript
triennial: {
    id: 'triennial',
    name: 'Trienal',
    multiplier: 0.70,  // 30% desconto
    months: 36,
    discount: 30
}
```

Depois adicione no `index.html` (linha ~28):
```html
<option value="triennial">Trienal (maior desconto)</option>
```

### Exemplo 3: Novo add-on "Translation AI" por $4

No `config.js`, adicione em `addons`:
```javascript
translationAI: {
    id: 'translationAI',
    name: 'Translation AI',
    pricePerUser: 4,
    description: 'Tradução automática em tempo real'
}
```

Depois adicione no `index.html` após os outros addons:
```html
<div class="form-group">
    <label class="checkbox-label">
        <input type="checkbox" id="addonTranslationAI" class="checkbox-input">
        <span class="checkbox-text">
            <strong>Translation AI</strong>
            <small>Tradução automática em tempo real</small>
        </span>
    </label>
</div>
```

E no `app.js`, adicione a lógica de cálculo (seguindo o padrão dos outros addons).

## ⚠️ Atenção

- **Sempre faça backup** antes de editar
- **Teste após cada mudança** abrindo no navegador
- **Mantenha a sintaxe JavaScript** correta (vírgulas, chaves, etc)
- IDs devem ser únicos e não conter espaços
- Preços devem ser números (não use $ ou vírgulas)

## 🎯 Dicas

1. **Use um editor de código** (VS Code, Sublime, etc) com syntax highlighting
2. **Valide o JSON** se tiver dúvidas sobre sintaxe
3. **Documente suas mudanças** nos comentários do código
4. **Versione o arquivo** se fizer mudanças frequentes

---

Para mais ajuda, consulte o README.md principal.
