import type { UserConfig } from 'vite';
const config: UserConfig = {
    build: {
        target: 'es2023',
        lib: {
            entry: {
                'nexa-transport': 'src/networking/NexaClient.ts',
                protocol: 'src/protocol/Protocol.ts',
                media: 'src/media/NexaMedia.ts',
                events: 'src/protocol/Events.ts',
                errors: 'src/networking/TransportError.ts',
            },
            formats: ['es'],
        },
        sourcemap: true,
    },
};
export default config;
