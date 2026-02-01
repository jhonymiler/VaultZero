/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/core/:path*',
                destination: 'http://localhost:3000/api/:path*',
            },
            {
                source: '/status',
                destination: 'http://localhost:3000/status',
            },
        ]
    },
    experimental: {
        // Removendo a configuração experimental que pode estar causando problemas
    }
}
module.exports = nextConfig
