// Script de debug de rede para testar conectividade
const testUrls = [
    'http://192.168.15.7:3000/api/network/status',
    'http://192.168.15.7:8080/test.json',
    'http://localhost:3000/api/network/status',
    'https://httpbin.org/get'
];

async function testConnectivity() {
    console.log('🔍 Testando conectividade de rede...');

    for (const url of testUrls) {
        try {
            console.log(`\n📡 Testando: ${url}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.text();
                console.log(`✅ SUCESSO: ${url}`);
                console.log(`📊 Status: ${response.status}`);
                console.log(`📄 Response: ${data.substring(0, 100)}...`);
            } else {
                console.log(`❌ ERRO HTTP: ${url} - Status: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ ERRO REDE: ${url} - ${error.message}`);
        }
    }
}

// Função para testar no React Native
export const debugNetwork = testConnectivity;

// Para Node.js
if (typeof window === 'undefined') {
    testConnectivity();
}
