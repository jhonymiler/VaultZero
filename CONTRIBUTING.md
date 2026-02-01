# Contributing to VaultZero

Thank you for considering contributing to VaultZero! This document provides guidelines to make the contribution process efficient and enjoyable for everyone.

## 🌟 How to Contribute

### 1. Report Bugs

Found a bug? Help us improve:

- Check if the bug hasn't already been reported in [Issues](https://github.com/your-username/IdentityVault/issues)
- Create a new issue including:
  - Clear description of the problem
  - Steps to reproduce
  - Expected vs actual behavior
  - Screenshots (if applicable)
  - Environment (OS, Node version, etc.)

### 2. Suggest Improvements

Have an idea to improve VaultZero?

- Open an issue with the `enhancement` tag
- Describe your suggestion in detail
- Explain why it would be useful for the community

### 3. Contribute Code

#### Requirements

- Node.js 18+
- npm or yarn
- Git

#### Process

1. **Fork the repository**
   ```bash
   # Clone your fork
   git clone https://github.com/your-username/IdentityVault.git
   cd IdentityVault
   ```

2. **Set up the environment**
   ```bash
   # Install dependencies for all projects
   npm install
   cd core && npm install
   cd ../identity-vault-mobile && npm install
   cd ../website && npm install
   cd ../sdk && npm install
   ```

3. **Create a branch for your feature**
   ```bash
   git checkout -b feature/my-feature
   # or
   git checkout -b fix/my-bug-fix
   ```

4. **Develop your contribution**
   - Follow existing code patterns
   - Add tests when applicable
   - Keep commits atomic and descriptive

5. **Run the tests**
   ```bash
   # Core tests
   cd core && npm test

   # Website tests
   cd website && npm test

   # Mobile tests
   cd identity-vault-mobile && npm test
   ```

6. **Push your changes**
   ```bash
   git add .
   git commit -m "feat: add X functionality"
   git push origin feature/my-feature
   ```

7. **Open a Pull Request**
   - Describe your changes clearly
   - Reference related issues
   - Wait for team review

## 📝 Code Standards

### Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Refactoring
- `test:` Tests
- `chore:` General tasks

Examples:
```
feat: add biometric authentication
fix: resolve P2P memory leak
docs: update installation guide
```

### TypeScript/JavaScript

- Use TypeScript when possible
- Follow the configured ESLint
- Use descriptive variable names
- Comment complex code

### React Native

- Use functional components
- Prefer hooks over classes
- Keep components small and reusable

## 🏗️ Project Structure

```
VaultZero/
├── core/                  # P2P Backend (Node.js + TypeScript)
├── identity-vault-mobile/ # Mobile App (React Native + Expo)
├── sdk/                   # Integration SDK (TypeScript)
├── website/               # Demo Website (Next.js 14)
├── tests/                 # Automated tests
└── docs/                  # Documentation
```

## 🧪 Testing

Each component has its own tests:

```bash
# Core Backend
cd core && npm test

# Mobile App
cd identity-vault-mobile && npm test

# Website
cd website && npm test

# E2E Tests
cd tests && npm test
```

## 📚 Areas That Need Help

- [ ] Automated tests
- [ ] Documentation (all languages)
- [ ] Support for more mobile platforms
- [ ] Performance optimization
- [ ] Security and audits
- [ ] UI/UX improvements

## 🤝 Community

- Be respectful and constructive
- Help other contributors
- Document your changes
- Follow the code of conduct

## 📞 Support

Have questions? Get in touch:

- Open a [Discussion](https://github.com/your-username/IdentityVault/discussions)
- Join our [Discord/Slack] (if available)

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

**Thank you for contributing to VaultZero!** 🚀
