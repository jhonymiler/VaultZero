import crypto from 'crypto';

export class Encryption {
    private algorithm: string;
    private key: Buffer;

    constructor(secret: string) {
        this.algorithm = 'aes-256-cbc';
        this.key = crypto.scryptSync(secret, 'salt', 32);
    }

    encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    decrypt(encryptedText: string): string {
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts.shift()!, 'hex');
        const encryptedTextBuffer = Buffer.from(parts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        let decrypted = decipher.update(encryptedTextBuffer);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString('utf8');
    }
}