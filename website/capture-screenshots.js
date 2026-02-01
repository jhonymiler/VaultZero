const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Cria pasta para armazenar os screenshots se não existir
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
}

// Configurações de dispositivos
const devices = {
    desktop: {
        name: 'desktop',
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
    },
    mobile: {
        name: 'mobile',
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
    }
};

// Lista de páginas para capturar screenshots
const pages = [
    { url: '/', name: 'homepage' },
    { url: '/dashboard', name: 'dashboard' },
    { url: '/demo', name: 'demo' },
    { url: '/login', name: 'login' },
    { url: '/status', name: 'status' }
];

// Temas disponíveis
const themes = ['light', 'dark'];

(async () => {
    console.log('Iniciando o navegador...');
    const browser = await chromium.launch({ headless: true });

    try {
        // Para cada dispositivo
        for (const [deviceKey, deviceConfig] of Object.entries(devices)) {
            console.log(`\nConfigurando para ${deviceKey}...`);

            // Para cada tema
            for (const theme of themes) {
                console.log(`\nCapturando em tema ${theme}...`);
                const context = await browser.newContext({
                    viewport: deviceConfig.viewport,
                    deviceScaleFactor: deviceConfig.deviceScaleFactor,
                    isMobile: deviceConfig.isMobile || false,
                });

                const page = await context.newPage();

                // Configure o tema antes de navegar
                if (theme === 'dark') {
                    await context.addInitScript(() => {
                        document.documentElement.classList.add('dark');
                        localStorage.setItem('vaultzero-theme', 'dark');
                    });
                } else {
                    await context.addInitScript(() => {
                        document.documentElement.classList.remove('dark');
                        localStorage.setItem('vaultzero-theme', 'light');
                    });
                }

                // Para cada página da aplicação
                for (const { url, name } of pages) {
                    const fullUrl = `http://localhost:3002${url}`;
                    console.log(`Acessando ${fullUrl}...`);

                    await page.goto(fullUrl);
                    await page.waitForTimeout(2000); // Aguarda carregamento completo                    // Verifica se o menu mobile está disponível (apenas em dispositivos móveis)
                    if (deviceKey === 'mobile') {
                        try {
                            // Captura inicial sem menu mobile
                            const filename = path.join(screenshotsDir, `${name}-${deviceKey}-${theme}.png`);
                            await page.screenshot({ path: filename, fullPage: true });

                            // Tenta abrir o menu mobile e captura novamente
                            const mobileMenuButton = await page.$('button[aria-label="Toggle menu"]');
                            if (!mobileMenuButton) {
                                console.log(`Menu mobile não encontrado na página ${name} com seletor 'button[aria-label="Toggle menu"]'`);
                                // Tenta encontrar pelo ícone de menu
                                const menuIcon = await page.$('button:has(.lucide-menu)');
                                if (menuIcon) {
                                    await menuIcon.click();
                                    await page.waitForTimeout(1000); // Aguarda animação do menu
                                    const filenameWithMenu = path.join(screenshotsDir, `${name}-${deviceKey}-${theme}-menu.png`);
                                    await page.screenshot({ path: filenameWithMenu, fullPage: true });
                                    console.log(`Menu mobile capturado para ${name} usando seletor alternativo`);
                                } else {
                                    console.log(`Menu mobile não encontrado na página ${name} com seletor alternativo`);
                                }
                            } else {
                                await mobileMenuButton.click();
                                await page.waitForTimeout(1000); // Aguarda animação do menu
                                const filenameWithMenu = path.join(screenshotsDir, `${name}-${deviceKey}-${theme}-menu.png`);
                                await page.screenshot({ path: filenameWithMenu, fullPage: true });
                                console.log(`Menu mobile capturado para ${name}`);
                            }
                        } catch (err) {
                            console.log(`Erro ao tentar capturar menu mobile na página ${name}:`, err);
                        }
                    } else {
                        // Apenas captura a tela em desktop
                        const filename = path.join(screenshotsDir, `${name}-${deviceKey}-${theme}.png`);
                        await page.screenshot({ path: filename, fullPage: true });
                    }
                }

                await context.close();
            }
        }

        console.log('\nScreenshots capturados com sucesso!');
        console.log(`Arquivos salvos na pasta: ${screenshotsDir}`);
    } catch (error) {
        console.error('Erro ao capturar screenshots:', error);
    } finally {
        await browser.close();
    }
})();
