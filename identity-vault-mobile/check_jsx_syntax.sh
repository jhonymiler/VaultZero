#!/bin/bash

echo "🔍 Procurando por problemas de sintaxe JSX..."

# Buscar por patterns problemáticos em arquivos TSX
PROBLEM_FILES=()

# Buscar por color=Colors. (sem chaves)
echo "Verificando padrão: color=Colors..."
FILES=$(find /home/jhony/Projetos/login-sem-senha/IdentityVault/identity-vault-mobile/src -name "*.tsx" -exec grep -l "color=Colors\." {} \; 2>/dev/null)
if [ ! -z "$FILES" ]; then
    echo "❌ Encontrados arquivos com color=Colors (sem chaves):"
    echo "$FILES"
    PROBLEM_FILES+=($FILES)
fi

# Buscar por size=Numbers. (sem chaves)
echo "Verificando padrão: size=Numbers..."
FILES=$(find /home/jhony/Projetos/login-sem-senha/IdentityVault/identity-vault-mobile/src -name "*.tsx" -exec grep -l "size=[A-Z][a-zA-Z]*\." {} \; 2>/dev/null)
if [ ! -z "$FILES" ]; then
    echo "❌ Encontrados arquivos com size=Variable (sem chaves):"
    echo "$FILES"
    PROBLEM_FILES+=($FILES)
fi

# Buscar por outros padrões problemáticos
echo "Verificando outros padrões problemáticos..."
FILES=$(find /home/jhony/Projetos/login-sem-senha/IdentityVault/identity-vault-mobile/src -name "*.tsx" -exec grep -l " [a-zA-Z]*=[A-Z][a-zA-Z]*\." {} \; 2>/dev/null)
if [ ! -z "$FILES" ]; then
    echo "❌ Encontrados arquivos com propriedades sem chaves:"
    echo "$FILES"
    PROBLEM_FILES+=($FILES)
fi

if [ ${#PROBLEM_FILES[@]} -eq 0 ]; then
    echo "✅ Nenhum problema de sintaxe JSX encontrado!"
else
    echo "📝 Resumo dos arquivos com problemas:"
    printf '%s\n' "${PROBLEM_FILES[@]}" | sort | uniq
fi

echo "✅ Verificação concluída!"
