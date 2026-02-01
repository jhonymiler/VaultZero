#!/bin/bash

# 🚀 VaultZero - Setup Automatizado
# Este script configura todo o ambiente de desenvolvimento

set -e

echo "🔐 VaultZero - Configuração Automática"
echo "=========================================="

# Verifica pré-requisitos
check_prerequisites() {
    echo "📋 Verificando pré-requisitos..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
        exit 1
    fi
    
    # NPM
    if ! command -v npm &> /dev/null; then
        echo "❌ NPM não encontrado."
        exit 1
    fi
    
    # Git
    if ! command -v git &> /dev/null; then
        echo "❌ Git não encontrado."
        exit 1
    fi
    
    echo "✅ Pré-requisitos OK"
}

# Instala dependências do projeto principal
install_root_dependencies() {
    echo "📦 Instalando dependências principais..."
    npm install
    echo "✅ Dependências principais instaladas"
}

# Configura workspace do core
setup_core() {
    echo "🧠 Configurando Core Backend..."
    cd core
    npm install
    
    # Compila TypeScript
    npm run build
    
    # Executa testes básicos
    echo "🧪 Executando testes do core..."
    npm test
    
    cd ..
    echo "✅ Core Backend configurado"
}

# Configura app mobile
setup_mobile() {
    echo "📱 Configurando Mobile App..."
    cd mobile
    
    # Verifica se Expo CLI está instalado
    if ! command -v expo &> /dev/null; then
        echo "📲 Instalando Expo CLI..."
        npm install -g @expo/cli
    fi
    
    npm install
    
    # Cria projeto Expo se não existir
    if [ ! -f "app.json" ]; then
        echo "🔧 Criando projeto Expo..."
        expo init . --template typescript
    fi
    
    cd ..
    echo "✅ Mobile App configurado"
}

# Configura app desktop
setup_desktop() {
    echo "💻 Configurando Desktop App..."
    cd desktop
    npm install
    
    # Compila TypeScript
    npm run build
    
    cd ..
    echo "✅ Desktop App configurado"
}

# Configura extensão
setup_extension() {
    echo "🌐 Configurando Browser Extension..."
    cd extension
    npm install
    
    # Build inicial
    npm run build
    
    cd ..
    echo "✅ Browser Extension configurada"
}

# Configura website
setup_website() {
    echo "🌍 Configurando Demo Website..."
    cd website
    npm install
    
    # Configura Tailwind CSS
    if [ ! -f "tailwind.config.js" ]; then
        npx tailwindcss init -p
    fi
    
    cd ..
    echo "✅ Demo Website configurado"
}

# Configura bootstrap nodes
setup_bootstrap() {
    echo "☁️ Configurando Bootstrap Nodes..."
    cd bootstrap
    npm install
    
    # Compila TypeScript
    npm run build
    
    cd ..
    echo "✅ Bootstrap Nodes configurados"
}

# Configura testes
setup_tests() {
    echo "🧪 Configurando Testes..."
    cd tests
    npm install
    
    # Instala Playwright
    npx playwright install
    
    cd ..
    echo "✅ Testes configurados"
}

# Cria arquivos de configuração
create_config_files() {
    echo "⚙️ Criando arquivos de configuração..."
    
    # .env.example
    cat > .env.example << EOF
# VaultZero Configuration
IDENTITY_VAULT_ENV=development
IDENTITY_VAULT_LOG_LEVEL=debug

# Core Backend
CORE_PORT=4001
CORE_HOST=localhost

# Bootstrap Nodes
BOOTSTRAP_NODES=localhost:4001,localhost:4002

# Security
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here

# Database
DB_PATH=./data/identity-vault.db

# P2P Network
P2P_LISTEN_PORT=4001
P2P_ANNOUNCE_ADDR=/ip4/127.0.0.1/tcp/4001
EOF

    # VSCode settings
    mkdir -p .vscode
    cat > .vscode/settings.json << EOF
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.env*": "dotenv"
  }
}
EOF

    # Git hooks
    mkdir -p .githooks
    cat > .githooks/pre-commit << EOF
#!/bin/bash
# Pre-commit hook: executa testes e linting
echo "🔍 Executando verificações pre-commit..."
npm run lint
npm run type-check
npm run test:core
echo "✅ Pre-commit verificações passaram"
EOF
    chmod +x .githooks/pre-commit
    
    echo "✅ Arquivos de configuração criados"
}

# Executa testes integrados
run_integration_tests() {
    echo "🧪 Executando testes integrados..."
    
    # Inicia core backend em background
    cd core
    npm start &
    CORE_PID=$!
    cd ..
    
    # Aguarda backend inicializar
    sleep 5
    
    # Testa conexão P2P
    cd core
    ./test_p2p_auto.sh
    cd ..
    
    # Para backend
    kill $CORE_PID
    
    echo "✅ Testes integrados passaram"
}

# Menu interativo
show_menu() {
    echo ""
    echo "🎯 Escolha o que configurar:"
    echo "1) Setup Completo (Recomendado)"
    echo "2) Apenas Core Backend"
    echo "3) Apenas Mobile App"
    echo "4) Apenas Desktop App"
    echo "5) Apenas Browser Extension"
    echo "6) Apenas Demo Website"
    echo "7) Apenas Bootstrap Nodes"
    echo "8) Apenas Testes"
    echo "9) Criar arquivos de configuração"
    echo "0) Sair"
    echo ""
    read -p "Digite sua escolha (0-9): " choice
}

# Função principal
main() {
    check_prerequisites
    
    while true; do
        show_menu
        
        case $choice in
            1)
                echo "🚀 Executando setup completo..."
                install_root_dependencies
                setup_core
                setup_mobile
                setup_desktop
                setup_extension
                setup_website
                setup_bootstrap
                setup_tests
                create_config_files
                run_integration_tests
                echo ""
                echo "🎉 Setup completo finalizado!"
                echo "📖 Leia o README.md para próximos passos"
                break
                ;;
            2)
                install_root_dependencies
                setup_core
                echo "✅ Core Backend configurado!"
                ;;
            3)
                setup_mobile
                echo "✅ Mobile App configurado!"
                ;;
            4)
                setup_desktop
                echo "✅ Desktop App configurado!"
                ;;
            5)
                setup_extension
                echo "✅ Browser Extension configurada!"
                ;;
            6)
                setup_website
                echo "✅ Demo Website configurado!"
                ;;
            7)
                setup_bootstrap
                echo "✅ Bootstrap Nodes configurados!"
                ;;
            8)
                setup_tests
                echo "✅ Testes configurados!"
                ;;
            9)
                create_config_files
                echo "✅ Arquivos de configuração criados!"
                ;;
            0)
                echo "👋 Até logo!"
                exit 0
                ;;
            *)
                echo "❌ Opção inválida. Tente novamente."
                ;;
        esac
    done
}

# Executa script
main
