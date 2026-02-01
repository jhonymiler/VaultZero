export function renderDashboard(user: any) {
    const dashboardElement = document.createElement('div');
    dashboardElement.className = 'dashboard';

    const welcomeMessage = document.createElement('h1');
    welcomeMessage.textContent = `Bem-vindo, ${user.name}!`;
    dashboardElement.appendChild(welcomeMessage);

    const userInfo = document.createElement('p');
    userInfo.textContent = `Seu ID de usuário é: ${user.id}`;
    dashboardElement.appendChild(userInfo);

    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Sair';
    logoutButton.onclick = () => {
        // Implementar lógica de logout
        console.log('Usuário desconectado');
    };
    dashboardElement.appendChild(logoutButton);

    document.body.appendChild(dashboardElement);
}