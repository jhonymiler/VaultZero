---
applyTo: '**'
---
# Guia de Desenvolvimento do VaultZero

## Visão Geral do Projeto

O VaultZero é um sistema de autenticação sem senhas baseado em blockchain P2P descentralizada que implementa Self-Sovereign Identity (SSI). O objetivo é permitir aos usuários controlar totalmente suas identidades digitais usando endereços blockchain únicos e seeds de 12 palavras para recuperação, sem depender de autoridades centralizadas.

## Comportamento importante
E lembre-se *importatne. Não crie arquivos desnecessariamente, edite os existentes sempre
Sempre que eu te corrigir sobre uma instrução quero que atualize este arquivo de instruções

## Arquitetura e Componentes

O projeto VaultZero consiste em três componentes principais:

1. **Core** (`/core`): Backend P2P já implementado, responsável pelo gerenciamento da rede blockchain e comunicação distribuída.
2. **Aplicativo Mobile** (`/identity-vault-mobile`): Aplicativo React Native que gerencia a identidade do usuário.
3. **Website** (`/website`): Website de demonstração para testar o sistema de login sem senha.

## Objetivos de Implementação

### Aplicativo Mobile (Identity Vault Mobile)

O aplicativo mobile deve ser o centro de controle da identidade digital do usuário, com as seguintes responsabilidades:

- **Gestão de Identidade**:
  - Criar identidade blockchain única
  - Gerar e gerenciar as palavras mnemônicas (seed de 12 palavras)
  - Autenticar usuários via biometria (impressão digital/reconhecimento facial)
  - Gerenciar dispositivos autorizados
  - Controlar permissões concedidas a websites

- **Sincronização P2P**:
  - Compartilhar identidade entre dispositivos do mesmo usuário
  - Sincronizar estado da identidade através da rede P2P
  - Emparelhar novos dispositivos de forma segura via QR Code

- **Gestão de Privacidade**:
  - Aplicar princípio do direito ao esquecimento
  - Gerenciar seletivamente quais dados serão compartilhados com sites
  - Revogar acessos previamente concedidos

### Website (Demonstrativo)

O website deve servir como demonstração do sistema de autenticação, com:

- **Landing Page** explicando a tecnologia
- **Página de Login** para testar a autenticação via QR Code
- **Área Restrita** que mostra apenas os dados que o usuário autorizou compartilhar
- **Implementação do Direito ao Esquecimento** não armazenando permanentemente os dados do usuário

### Interação Mobile-Website

1. Website solicita autenticação via QR Code
2. Usuário escaneia o código com o aplicativo mobile
3. Aplicativo solicita autorização do usuário (biometria)
4. Aplicativo pergunta quais dados podem ser compartilhados
5. Usuário autoriza o compartilhamento
6. Website recebe apenas os dados autorizados
7. Website não armazena os dados permanentemente (direito ao esquecimento)

## Fluxos de Implementação

### Criação de Identidade no Mobile

1. **Onboarding**:
   - Coleta de dados básicos do usuário
   - Configuração de biometria
   - Geração de identidade blockchain
   - Backup das palavras mnemônicas

2. **Adição de Novo Dispositivo**:
   - Dispositivo já autenticado gera QR Code
   - Novo dispositivo escaneia o código
   - Transferência segura da seed/identidade

### Processo de Login no Website

1. **Solicitação de Login**:
   - Website gera QR Code com desafio único
   - Aplicativo escaneia o código
   - Aplicativo verifica autenticidade do site

2. **Autorização e Compartilhamento**:
   - Aplicativo solicita biometria do usuário
   - Aplicativo mostra quais dados o site está solicitando
   - Usuário seleciona quais dados autoriza compartilhar
   - Aplicativo assina o desafio e envia os dados autorizados

3. **Autenticação Completa**:
   - Website verifica a assinatura
   - Website concede acesso apenas aos dados autorizados
   - Sessão é estabelecida por tempo limitado

### Direito ao Esquecimento

Para implementar o direito ao esquecimento no website:

1. Use apenas armazenamento em memória ou sessão para os dados do usuário
2. Implemente temporizadores para apagar dados após uso
3. Não persista dados em banco de dados sem consentimento explícito
4. Utilize técnicas como JWTs assinados para verificar autenticidade sem armazenar dados

## Tecnologias Principais

- **Core**: Node.js, TypeScript, libp2p
- **App Mobile**: React Native, Expo, Biometria nativa
- **Website**: Next.js, React

## Considerações de Segurança

- Toda comunicação deve ser criptografada
- Chaves privadas nunca devem deixar o dispositivo do usuário
- Autenticação biométrica deve ser local (não enviar templates)
- Verificações de assinatura devem ser feitas do lado do cliente e do servidor
- QR Codes devem conter desafios únicos com prazo de validade

## Roadmap de Desenvolvimento

1. **Fase 1:** Implementar criação/restauração de identidade no aplicativo mobile
2. **Fase 2:** Implementar autenticação biométrica e gestão de identidade
3. **Fase 3:** Implementar sincronização P2P entre dispositivos
4. **Fase 4:** Implementar sistema de QR Code para login no website
5. **Fase 5:** Implementar gestão de permissões e compartilhamento seletivo
6. **Fase 6:** Implementar direito ao esquecimento no website

## Testes

Priorizar os seguintes testes:

1. **Autenticação biométrica no app mobile**
2. **Login no website via QR Code**
3. **Sincronização entre dois dispositivos do mesmo usuário**
4. **Compartilhamento seletivo de dados**
5. **Verificação do direito ao esquecimento**

---

Este guia serve como referência para o desenvolvimento contínuo do VaultZero, mantendo o foco na proteção da privacidade do usuário e na descentralização da identidade.
