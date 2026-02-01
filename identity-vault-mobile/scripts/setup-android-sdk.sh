#!/bin/bash

# Script para configurar Android SDK no Ubuntu/Linux para desenvolvimento Expo
echo "🚀 Configurando Android SDK para VaultZero..."

# Criar diretório para Android SDK
ANDROID_HOME="$HOME/Android/sdk"
mkdir -p "$ANDROID_HOME"

# Baixar e instalar Android Command Line Tools
echo "📦 Baixando Android Command Line Tools..."
cd "$HOME/Android"
wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O commandlinetools.zip
unzip -q commandlinetools.zip
mkdir -p "$ANDROID_HOME/cmdline-tools"
mv cmdline-tools "$ANDROID_HOME/cmdline-tools/latest"
rm commandlinetools.zip

# Configurar variáveis de ambiente
echo "🔧 Configurando variáveis de ambiente..."
cat >> ~/.zshrc << 'EOF'

# Android SDK Configuration for VaultZero
export ANDROID_HOME="$HOME/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
export PATH="$PATH:$ANDROID_HOME/emulator"
EOF

# Recarregar configurações
source ~/.zshrc

# Instalar pacotes Android necessários
echo "📱 Instalando pacotes Android..."
cd "$ANDROID_HOME/cmdline-tools/latest/bin"

# Aceitar licenças
yes | ./sdkmanager --licenses

# Instalar componentes essenciais
./sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
./sdkmanager "system-images;android-34;google_apis;x86_64"

# Verificar instalação
echo "✅ Verificando instalação..."
which adb

echo "🎉 Configuração concluída!"
echo ""
echo "Para usar o Android SDK:"
echo "1. Reinicie o terminal ou execute: source ~/.zshrc"
echo "2. Conecte um dispositivo Android via USB"
echo "3. Execute: npx expo run:android"
echo ""
echo "Para usar emulador:"
echo "1. Crie um AVD: avdmanager create avd -n VaultZero -k 'system-images;android-34;google_apis;x86_64'"
echo "2. Execute: emulator -avd VaultZero"
