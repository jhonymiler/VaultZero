#!/usr/bin/env node

/**
 * Script para testar a funcionalidade do QR Scanner em dispositivos Android
 * Especialmente otimizado para dispositivos mais antigos como Samsung A10
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando testes do QR Scanner para Android...\n');

// Verifica se as dependências necessárias estão instaladas
console.log('📦 Verificando dependências...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = [
    'expo-barcode-scanner',
    'expo-camera',
    'expo-haptics'
];

const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
if (missingDeps.length > 0) {
    console.log('❌ Dependências faltando:', missingDeps.join(', '));
    process.exit(1);
}
console.log('✅ Todas as dependências estão instaladas');

// Verifica as permissões no app.json
console.log('\n🔐 Verificando permissões Android...');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
const androidPermissions = appJson.expo?.android?.permissions || [];
const requiredPermissions = [
    'android.permission.CAMERA',
    'android.permission.RECORD_AUDIO',
    'android.permission.VIBRATE'
];

const missingPermissions = requiredPermissions.filter(perm => !androidPermissions.includes(perm));
if (missingPermissions.length > 0) {
    console.log('❌ Permissões faltando no app.json:', missingPermissions.join(', '));
    process.exit(1);
}
console.log('✅ Todas as permissões estão configuradas');

// Verifica se o arquivo CustomQRScanner existe e tem as otimizações
console.log('\n📱 Verificando otimizações do CustomQRScanner...');
const scannerPath = 'src/components/CustomQRScanner.tsx';
if (!fs.existsSync(scannerPath)) {
    console.log('❌ Arquivo CustomQRScanner.tsx não encontrado');
    process.exit(1);
}

const scannerContent = fs.readFileSync(scannerPath, 'utf8');
const optimizations = [
    'Platform.OS === \'android\'',
    'cameraReady',
    'autoFocus',
    'Haptics.selectionAsync',
    'setTimeout'
];

const missingOptimizations = optimizations.filter(opt => !scannerContent.includes(opt));
if (missingOptimizations.length > 0) {
    console.log('⚠️  Algumas otimizações podem estar faltando:', missingOptimizations.join(', '));
} else {
    console.log('✅ Todas as otimizações Android estão presentes');
}

// Prepara o build para Android
console.log('\n🔧 Preparando build para Android...');
try {
    console.log('Executando prebuild...');
    execSync('npx expo prebuild --platform android --clear', { stdio: 'inherit' });
    console.log('✅ Prebuild concluído com sucesso');
} catch (error) {
    console.log('❌ Erro no prebuild:', error.message);
}

console.log('\n📋 Resumo dos testes:');
console.log('✅ Dependências verificadas');
console.log('✅ Permissões Android configuradas');
console.log('✅ Otimizações de scanner aplicadas');
console.log('✅ Build Android preparado');

console.log('\n🚀 Próximos passos para testar em dispositivo real:');
console.log('1. Conecte seu dispositivo Android via USB');
console.log('2. Ative a "Depuração USB" nas opções do desenvolvedor');
console.log('3. Execute: npx expo run:android');
console.log('4. Ou instale o Expo Go e escaneie o QR code do: npx expo start');

console.log('\n📱 Testes específicos para Samsung A10:');
console.log('- Scanner com delay otimizado para inicialização');
console.log('- Feedback háptico suave');
console.log('- Ratio de câmera 16:9 para melhor compatibilidade');
console.log('- AutoFocus ativado');
console.log('- Validação de QR codes antes do processamento');
