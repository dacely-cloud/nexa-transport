import type { UserConfig } from 'vite';
const config: UserConfig = {
    build: {
        target: 'es2023',
        lib: {
            entry: {
                'redteam-client': 'src/redteam/RedTeamClient.ts',
                'history-records': 'src/networking/HistoryRecordDecoder.ts',
                'session-files': 'src/networking/SessionFilePager.ts',
                'archive-requests': 'src/networking/SessionArchiveRequests.ts',
                'nexa-transport': 'src/networking/NexaClient.ts',
                media: 'src/media/Media.ts',
                events: 'src/protocol/Events.ts',
                errors: 'src/networking/TransportError.ts',
            },
            formats: ['es'],
        },
        rolldownOptions: {
            external: [/^nexa-protocol\//u],
            output: { entryFileNames: '[name].js', chunkFileNames: 'chunks/[name].js' },
        },
        sourcemap: true,
    },
};
export default config;
