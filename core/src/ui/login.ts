import { BiometricManager } from '../auth/biometric.js';
import { PasskeyManager } from '../auth/passkey.js';

export function renderLogin() {
    const loginContainer = document.createElement('div');
    loginContainer.className = 'login-container';

    const title = document.createElement('h2');
    title.innerText = 'Login';

    const biometricButton = document.createElement('button');
    biometricButton.innerText = 'Biometric Login';
    biometricButton.addEventListener('click', () => {
        console.log('Biometric login initiated');
        // A implementação completa seria feita aqui
    });

    const passkeyButton = document.createElement('button');
    passkeyButton.innerText = 'Passkey Login';
    passkeyButton.addEventListener('click', () => {
        console.log('Passkey login initiated');
        // A implementação completa seria feita aqui
    });

    loginContainer.appendChild(title);
    loginContainer.appendChild(biometricButton);
    loginContainer.appendChild(passkeyButton);

    return loginContainer;
}

export function renderRegister() {
    const registerContainer = document.createElement('div');
    registerContainer.className = 'register-container';

    const title = document.createElement('h2');
    title.innerText = 'Register';

    const nameInput = document.createElement('input');
    nameInput.placeholder = 'Enter your name';

    const registerButton = document.createElement('button');
    registerButton.innerText = 'Register';
    registerButton.addEventListener('click', () => {
        const name = nameInput.value;
        if (name) {
            console.log(`Registering user: ${name}`);
            // A implementação completa seria feita aqui
        }
    });

    registerContainer.appendChild(title);
    registerContainer.appendChild(nameInput);
    registerContainer.appendChild(registerButton);

    return registerContainer;
}
