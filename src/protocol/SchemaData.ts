import type { Schema } from './Schema.js';
/** Generated Nexa protocol snapshot. */
export const schema: Schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
        AccountCreateParams: {
            description: 'How the UI creates an account.',
            properties: {
                displayName: {
                    type: 'string',
                },
                localId: {
                    type: 'string',
                },
                model: {
                    type: 'string',
                },
                role: {
                    type: 'string',
                },
            },
            required: ['displayName'],
            type: 'object',
        },
        AccountRemoveParams: {
            description: 'How the UI removes one.',
            properties: {
                principalId: {
                    type: 'string',
                },
                removeWorkspace: {
                    description:
                        "Whether the workspace directory goes too. Defaults to FALSE.\n\nExplicit because deleting somebody's files as a side effect of removing their login is not a\ndecision a default should be making.",
                    type: 'boolean',
                },
            },
            required: ['principalId'],
            type: 'object',
        },
        AccountSummary: {
            description:
                'One account, as the control UI lists it.\n\nThe principal and its profile flattened into one row on purpose. Every consumer needs both, they\nare stored apart only because identity and accounts are separate layers, and making the page do\nthe join means the page owns a rule about what happens when one half is missing.',
            properties: {
                createdAt: {
                    type: 'number',
                },
                disabled: {
                    type: 'boolean',
                },
                displayName: {
                    type: 'string',
                },
                model: {
                    description: 'The model this user chose, when they chose one.',
                    type: 'string',
                },
                principalId: {
                    type: 'string',
                },
                role: {
                    description: 'The role its grants match, or a count of custom ones.',
                    type: 'string',
                },
                shares: {
                    description: 'Share ids they reach, with the mode they get.',
                    items: {
                        properties: {
                            id: {
                                type: 'string',
                            },
                            mode: {
                                type: 'string',
                            },
                        },
                        required: ['id', 'mode'],
                        type: 'object',
                    },
                    type: 'array',
                },
                teams: {
                    description: 'Team ids they belong to.',
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                workspacePath: {
                    type: 'string',
                },
            },
            required: [
                'createdAt',
                'disabled',
                'displayName',
                'principalId',
                'role',
                'shares',
                'teams',
                'workspacePath',
            ],
            type: 'object',
        },
        AccountsUsageParams: {
            description: 'What window to report spend over.',
            properties: {
                fromMs: {
                    type: 'number',
                },
                toMs: {
                    type: 'number',
                },
                userId: {
                    description: 'One account, or every account when absent.',
                    type: 'string',
                },
            },
            type: 'object',
        },
        AccountsUsageResult: {
            description: 'Per-user, per-model spend. Mirrors `AccountsUsageReport` over the wire.',
            properties: {
                entries: {
                    type: 'number',
                },
                fromMs: {
                    type: 'number',
                },
                toMs: {
                    type: 'number',
                },
                totalMicrocents: {
                    type: 'number',
                },
                users: {
                    items: {
                        properties: {
                            cachedInputTokens: {
                                type: 'number',
                            },
                            displayName: {
                                type: 'string',
                            },
                            entries: {
                                type: 'number',
                            },
                            inputTokens: {
                                type: 'number',
                            },
                            microcents: {
                                type: 'number',
                            },
                            models: {
                                items: {
                                    properties: {
                                        inputTokens: {
                                            type: 'number',
                                        },
                                        microcents: {
                                            type: 'number',
                                        },
                                        model: {
                                            type: 'string',
                                        },
                                        outputTokens: {
                                            type: 'number',
                                        },
                                        provider: {
                                            type: 'string',
                                        },
                                    },
                                    required: [
                                        'inputTokens',
                                        'microcents',
                                        'model',
                                        'outputTokens',
                                        'provider',
                                    ],
                                    type: 'object',
                                },
                                type: 'array',
                            },
                            nonModelMicrocents: {
                                type: 'number',
                            },
                            outputTokens: {
                                type: 'number',
                            },
                            userId: {
                                type: 'string',
                            },
                        },
                        required: [
                            'cachedInputTokens',
                            'entries',
                            'inputTokens',
                            'microcents',
                            'models',
                            'nonModelMicrocents',
                            'outputTokens',
                            'userId',
                        ],
                        type: 'object',
                    },
                    type: 'array',
                },
            },
            required: ['entries', 'fromMs', 'toMs', 'totalMicrocents', 'users'],
            type: 'object',
        },
        AgentDefineParams: {
            description: 'Registers or replaces an agent.',
            properties: {
                agent: {
                    $ref: '#/definitions/AgentDefinition',
                },
            },
            required: ['agent'],
            type: 'object',
        },
        AgentDefinition: {
            description: "One agent's configuration.",
            properties: {
                advertisedTools: {
                    description:
                        'The subset of `tools` whose DEFINITIONS are sent to the model.\n\nA rendering choice, never a permission — the deferred-tool catalog uses it to keep a thousand\nschemas out of the context window while leaving the tools reachable through `tool_call` and\nthrough a name the model remembers. `tools` and `excludeTools` are what decide whether a call\nruns; conflating the two is how "the model was not shown it" gets mistaken for "the model\ncannot use it", which is only true of a model that is not being steered by anybody.',
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                approvalMode: {
                    description: 'How the agent asks before acting.',
                    enum: ['cautious', 'permissive', 'standard', 'unattended'],
                    type: 'string',
                },
                excludeTools: {
                    description: 'Tools this agent may never use, applied after `tools`.',
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                id: {
                    type: 'string',
                },
                maxIterations: {
                    description:
                        'How many model round-trips one turn may take before it is stopped.',
                    type: 'number',
                },
                maxTokens: {
                    type: 'number',
                },
                metadata: {
                    $ref: '#/definitions/Record%3Cstring%2Cstring%3E',
                    description: 'Free-form metadata a deployment attaches.',
                },
                model: {
                    type: 'string',
                },
                name: {
                    description:
                        'What the agent calls itself. User-changeable at runtime ("call yourself Ada").',
                    type: 'string',
                },
                provider: {
                    type: 'string',
                },
                reasoning: {
                    $ref: '#/definitions/ReasoningOptions',
                    description: 'Reasoning configuration for a request.',
                },
                systemPrompt: {
                    description:
                        "The agent's own system prompt, replacing the default persona entirely when set.\n\nPer-agent rather than global because a deployment runs several agents with genuinely different\njobs — a code reviewer and a support responder should not share a persona.",
                    type: 'string',
                },
                systemPromptSuffix: {
                    description:
                        'Appended to the assembled system prompt, for a tweak that should not discard the default.',
                    type: 'string',
                },
                temperature: {
                    type: 'number',
                },
                tools: {
                    description: 'Tools this agent may use. Absent means every registered tool.',
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                voice: {
                    $ref: '#/definitions/AgentVoice',
                    description: 'Voice settings, when the agent speaks.',
                },
            },
            required: ['id', 'model', 'name', 'provider'],
            type: 'object',
        },
        AgentVoice: {
            description: 'How an agent speaks.',
            properties: {
                autoSpeak: {
                    description: 'Whether replies are spoken by default.',
                    type: 'boolean',
                },
                provider: {
                    description: 'The TTS provider id, e.g. `elevenlabs`.',
                    type: 'string',
                },
                voiceId: {
                    description: "The provider's voice id.",
                    type: 'string',
                },
            },
            required: ['provider', 'voiceId'],
            type: 'object',
        },
        ApplicationBoundary: {
            properties: {
                id: {
                    type: 'string',
                },
                kind: {
                    $ref: '#/definitions/ApplicationBoundaryKind',
                },
                location: {
                    $ref: '#/definitions/ApplicationLocation',
                },
                operation: {
                    type: 'string',
                },
                value: {
                    type: ['null', 'string'],
                },
            },
            required: ['id', 'kind', 'location', 'operation', 'value'],
            type: 'object',
        },
        ApplicationBoundaryKind: {
            description:
                'Observed call sites, never claims that an IPC channel, route or native addon was exercised.',
            enum: ['browser-window', 'context-bridge', 'ipc', 'native-addon', 'preload', 'route'],
            type: 'string',
        },
        ApplicationConnection: {
            enum: ['connected', 'setup-required', 'unavailable'],
            type: 'string',
        },
        ApplicationIssue: {
            description:
                'Explicit incomplete coverage rather than silently omitted files or unsupported syntax.',
            properties: {
                message: {
                    type: 'string',
                },
                path: {
                    type: 'string',
                },
            },
            required: ['message', 'path'],
            type: 'object',
        },
        ApplicationLocation: {
            description:
                'Exact generated-source location of a static observation. Columns and offsets are zero-based.',
            properties: {
                column: {
                    type: 'number',
                },
                end: {
                    type: 'number',
                },
                endColumn: {
                    type: 'number',
                },
                endLine: {
                    type: 'number',
                },
                line: {
                    type: 'number',
                },
                module: {
                    type: 'string',
                },
                start: {
                    type: 'number',
                },
            },
            required: ['column', 'end', 'endColumn', 'endLine', 'line', 'module', 'start'],
            type: 'object',
        },
        ApplicationModule: {
            description:
                'An inventoried module with a digest of the exact bytes parsed, including syntax failures.',
            properties: {
                bytes: {
                    type: 'string',
                },
                functions: {
                    type: 'number',
                },
                id: {
                    type: 'string',
                },
                imports: {
                    type: 'number',
                },
                language: {
                    description:
                        'Source grammars are explicit; bytecode formats use separate version-aware adapters.',
                    enum: ['c', 'cpp', 'javascript', 'lua', 'luau'],
                    type: 'string',
                },
                parseError: {
                    type: ['null', 'string'],
                },
                path: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
                sourceMap: {
                    type: ['null', 'string'],
                },
            },
            required: [
                'bytes',
                'functions',
                'id',
                'imports',
                'parseError',
                'path',
                'sha256',
                'sourceMap',
            ],
            type: 'object',
        },
        ApprovalRequestedData: {
            description: 'The payload of a {@link GATEWAY_EVENTS.ApprovalRequested} event.',
            properties: {
                approvalId: {
                    type: 'string',
                },
                detail: {
                    description:
                        'The exact command or path, so an operator approves what will actually run.\n\nCarried because an approval prompt without it is a rubber stamp: "run a shell command" is not\na decision anybody can make. It is the tool\'s own rendering, never the model\'s prose.',
                    type: 'string',
                },
                expiresAt: {
                    type: 'number',
                },
                principalId: {
                    type: 'string',
                },
                requestedAt: {
                    type: 'number',
                },
                risk: {
                    $ref: '#/definitions/RiskLevel',
                },
                sessionId: {
                    type: ['null', 'string'],
                },
                summary: {
                    type: 'string',
                },
                tool: {
                    type: 'string',
                },
            },
            required: [
                'approvalId',
                'expiresAt',
                'principalId',
                'requestedAt',
                'risk',
                'sessionId',
                'summary',
                'tool',
            ],
            type: 'object',
        },
        ApprovalResolvedData: {
            description: 'The payload of a {@link GATEWAY_EVENTS.ApprovalResolved} event.',
            properties: {
                approvalId: {
                    type: 'string',
                },
                approved: {
                    type: 'boolean',
                },
                by: {
                    type: ['null', 'string'],
                },
                outcome: {
                    description:
                        '`expired` distinguishes "nobody answered" from "somebody said no", which read differently.',
                    enum: ['answered', 'cancelled', 'expired'],
                    type: 'string',
                },
            },
            required: ['approvalId', 'approved', 'by', 'outcome'],
            type: 'object',
        },
        ApprovalResolveParams: {
            description: "An operator's answer to one approval.",
            properties: {
                approvalId: {
                    type: 'string',
                },
                approved: {
                    type: 'boolean',
                },
                reason: {
                    type: 'string',
                },
            },
            required: ['approvalId', 'approved'],
            type: 'object',
        },
        AskParams: {
            description: 'What one turn is asked for.',
            properties: {
                agentId: {
                    type: 'string',
                },
                attachments: {
                    description:
                        'User-authored image, video, document, and text blocks, in display order.',
                    items: {
                        $ref: '#/definitions/InboundAttachment',
                    },
                    type: 'array',
                },
                conversationId: {
                    description: 'Continues an existing conversation.',
                    type: 'string',
                },
                cwd: {
                    description: 'Where tools operate.',
                    type: 'string',
                },
                message: {
                    description:
                        'User text; may be blank when at least one attachment contains content.',
                    type: 'string',
                },
                reasoningEffort: {
                    description:
                        'Per-turn reasoning preference; never changes the saved agent configuration.',
                    enum: ['high', 'low', 'max', 'medium', 'minimal', 'off', 'xhigh'],
                    type: 'string',
                },
                targetTimeSeconds: {
                    description: 'Soft task time target in seconds; never a cancellation deadline.',
                    maximum: 172800,
                    minimum: 1,
                    type: 'integer',
                },
                userId: {
                    description: 'The principal the turn is billed and authorized as.',
                    type: 'string',
                },
            },
            required: ['message'],
            type: 'object',
        },
        AskResult: {
            description: 'What a finished turn produced.',
            properties: {
                attachments: {
                    description:
                        'Delivered files; IDs match attachment events so clients can deduplicate.',
                    items: {
                        $ref: '#/definitions/DeliveredAttachment',
                    },
                    type: 'array',
                },
                conversationId: {
                    type: ['null', 'string'],
                },
                finishReason: {
                    $ref: '#/definitions/FinishReason',
                },
                incompleteReason: {
                    description:
                        'A stopped response may leave the task unfinished and its background resources active.',
                    type: 'string',
                },
                iterations: {
                    type: 'number',
                },
                reasoning: {
                    type: 'string',
                },
                sessionKey: {
                    description:
                        "The session id this turn was filed under — `sessions.get`'s id, not the provider's.\n\nThe one field a client needs to mirror its own conversation. `conversationId` is null for\nevery provider that does not hold history itself, and even when it is not, the gateway's\nsession key is namespaced by principal: a client that subscribed to what it typed named\n`main` while the record was `alice::main`, so `sessions.subscribe` refused it and the second\ndevice watched nothing. Passing this straight back as the next turn's `conversationId`\nresumes the same conversation, so a client never has to reconstruct the namespacing itself.\n\nAbsent from a gateway older than this field. Every reader here treats a missing value as\n\"this server cannot tell me\" rather than declaring it optional, because it is never optional\non the server that produced it.",
                    type: 'string',
                },
                text: {
                    type: 'string',
                },
                turnId: {
                    type: 'string',
                },
                usage: {
                    $ref: '#/definitions/TokenUsage',
                },
            },
            required: [
                'conversationId',
                'finishReason',
                'iterations',
                'reasoning',
                'sessionKey',
                'text',
                'turnId',
                'usage',
            ],
            type: 'object',
        },
        BackgroundProcess: {
            description: 'Browser-safe background job receipt, without host pids or log paths.',
            properties: {
                command: {
                    type: 'string',
                },
                cwd: {
                    type: 'string',
                },
                endedAt: {
                    type: ['null', 'string'],
                },
                exitCode: {
                    type: ['null', 'number'],
                },
                foreground: {
                    description:
                        'A command still attached to its launching tool has an inline terminal.',
                    type: 'boolean',
                },
                processId: {
                    type: 'string',
                },
                running: {
                    type: 'boolean',
                },
                signal: {
                    type: ['null', 'string'],
                },
                startedAt: {
                    type: 'string',
                },
            },
            required: [
                'command',
                'cwd',
                'endedAt',
                'exitCode',
                'processId',
                'running',
                'signal',
                'startedAt',
            ],
            type: 'object',
        },
        BackgroundProcessLog: {
            description:
                'A bounded tail and complete byte boundary, represented losslessly on the wire.',
            properties: {
                endOffset: {
                    type: 'string',
                },
                text: {
                    type: 'string',
                },
                truncated: {
                    type: 'boolean',
                },
            },
            required: ['endOffset', 'text', 'truncated'],
            type: 'object',
        },
        BackgroundProcessRef: {
            description: 'A process must always be addressed inside its owning conversation.',
            properties: {
                processId: {
                    type: 'string',
                },
                sessionId: {
                    type: 'string',
                },
            },
            required: ['processId', 'sessionId'],
            type: 'object',
        },
        BinarySource: {
            anyOf: [
                {
                    properties: {
                        data: {
                            type: 'string',
                        },
                        kind: {
                            const: 'base64',
                            type: 'string',
                        },
                        mediaType: {
                            type: 'string',
                        },
                    },
                    required: ['data', 'kind', 'mediaType'],
                    type: 'object',
                },
                {
                    properties: {
                        kind: {
                            const: 'url',
                            type: 'string',
                        },
                        url: {
                            type: 'string',
                        },
                    },
                    required: ['kind', 'url'],
                    type: 'object',
                },
            ],
            description:
                'Where binary content comes from: inline base64, or a URL the provider fetches.',
        },
        BrowserAccessibilityNode: {
            description:
                'Accessibility node identity and backend links never imply that names or values were read.',
            properties: {
                backendNodeId: {
                    type: ['null', 'string'],
                },
                childCount: {
                    type: 'string',
                },
                depth: {
                    type: ['null', 'number'],
                },
                id: {
                    type: 'string',
                },
                ignored: {
                    type: 'boolean',
                },
                kind: {
                    const: 'accessibility',
                    type: 'string',
                },
                missingChildren: {
                    type: 'string',
                },
                parentId: {
                    type: ['null', 'string'],
                },
                role: {
                    type: ['null', 'string'],
                },
            },
            required: [
                'backendNodeId',
                'childCount',
                'depth',
                'id',
                'ignored',
                'kind',
                'missingChildren',
                'parentId',
                'role',
            ],
            type: 'object',
        },
        BrowserActivityConsole: {
            description:
                'Delivered console argument types and an optional validated source, without primitive values.',
            properties: {
                argumentTypes: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                callType: {
                    type: 'string',
                },
                kind: {
                    const: 'console',
                    type: 'string',
                },
                ordinal: {
                    type: 'number',
                },
                source: {
                    anyOf: [
                        {
                            $ref: '#/definitions/BrowserActivityLocation',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                timestamp: {
                    type: 'string',
                },
            },
            required: ['argumentTypes', 'callType', 'kind', 'ordinal', 'source', 'timestamp'],
            type: 'object',
        },
        BrowserActivityCoverage: {
            description:
                'Coverage describes attach-window evidence and explicitly accounts for missing observations.',
            properties: {
                excluded: {
                    type: 'string',
                },
                missingPredecessors: {
                    type: 'string',
                },
                networkCompleteWithinWindow: {
                    type: 'boolean',
                },
                priorActivityAvailable: {
                    const: false,
                    type: 'boolean',
                },
                reusedRequestIds: {
                    type: 'string',
                },
                truncated: {
                    type: 'boolean',
                },
                unfinishedRequests: {
                    type: 'string',
                },
            },
            required: [
                'excluded',
                'missingPredecessors',
                'networkCompleteWithinWindow',
                'priorActivityAvailable',
                'reusedRequestIds',
                'truncated',
                'unfinishedRequests',
            ],
            type: 'object',
        },
        BrowserActivityLocation: {
            description: 'A CDP source location is attributed only to the selected origin.',
            properties: {
                column: {
                    type: 'number',
                },
                line: {
                    type: 'number',
                },
                url: {
                    type: 'string',
                },
            },
            required: ['column', 'line', 'url'],
            type: 'object',
        },
        BrowserActivityNavigation: {
            description:
                'Same-origin main-frame navigations are observed without driving the page.',
            properties: {
                kind: {
                    const: 'navigation',
                    type: 'string',
                },
                ordinal: {
                    type: 'number',
                },
                sameDocument: {
                    type: 'boolean',
                },
                url: {
                    type: 'string',
                },
            },
            required: ['kind', 'ordinal', 'sameDocument', 'url'],
            type: 'object',
        },
        BrowserActivityRecord: {
            anyOf: [
                {
                    $ref: '#/definitions/BrowserActivityRequest',
                },
                {
                    $ref: '#/definitions/BrowserActivityConsole',
                },
                {
                    $ref: '#/definitions/BrowserActivitySocket',
                },
                {
                    $ref: '#/definitions/BrowserActivityNavigation',
                },
            ],
            description:
                'Records form one ordered, bounded capture with independent request-generation identity.',
        },
        BrowserActivityRequest: {
            description: 'One request generation; reused CDP IDs retain distinct predecessors.',
            properties: {
                encodedBytes: {
                    type: ['null', 'string'],
                },
                failed: {
                    type: 'boolean',
                },
                finished: {
                    type: 'boolean',
                },
                frameId: {
                    type: 'string',
                },
                initiator: {
                    anyOf: [
                        {
                            $ref: '#/definitions/BrowserActivityLocation',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                kind: {
                    const: 'request',
                    type: 'string',
                },
                method: {
                    type: 'string',
                },
                mimeType: {
                    type: ['null', 'string'],
                },
                ordinal: {
                    type: 'number',
                },
                redirectedTo: {
                    type: ['null', 'number'],
                },
                requestId: {
                    type: 'string',
                },
                resourceType: {
                    type: 'string',
                },
                reusedWithoutRedirect: {
                    type: 'boolean',
                },
                status: {
                    type: ['null', 'number'],
                },
                timestamp: {
                    type: 'string',
                },
                url: {
                    type: 'string',
                },
            },
            required: [
                'encodedBytes',
                'failed',
                'finished',
                'frameId',
                'initiator',
                'kind',
                'method',
                'mimeType',
                'ordinal',
                'redirectedTo',
                'requestId',
                'resourceType',
                'reusedWithoutRedirect',
                'status',
                'timestamp',
                'url',
            ],
            type: 'object',
        },
        BrowserActivitySocket: {
            description:
                'WebSocket payloads are reduced immediately to direction, opcode and byte count.',
            properties: {
                bytes: {
                    type: 'string',
                },
                direction: {
                    type: 'string',
                },
                kind: {
                    const: 'websocket',
                    type: 'string',
                },
                opcode: {
                    type: 'number',
                },
                ordinal: {
                    type: 'number',
                },
                requestId: {
                    type: 'string',
                },
                timestamp: {
                    type: 'string',
                },
                url: {
                    type: 'string',
                },
            },
            required: [
                'bytes',
                'direction',
                'kind',
                'opcode',
                'ordinal',
                'requestId',
                'timestamp',
                'url',
            ],
            type: 'object',
        },
        BrowserAnalysisInput: {
            description:
                'Body-free provenance links a derived shared analysis to the exact original browser capture.',
            properties: {
                capturedAt: {
                    type: 'string',
                },
                coverage: {
                    $ref: '#/definitions/BrowserSourcesCoverage',
                },
                exportedFiles: {
                    type: 'string',
                },
                frameId: {
                    type: 'string',
                },
                importMap: {
                    $ref: '#/definitions/BrowserAnalysisMapInput',
                    description:
                        'Body-free identity of an exact map member in the immutable analysis snapshot.',
                },
                includeSources: {
                    type: 'boolean',
                },
                manifestBytes: {
                    type: 'string',
                },
                manifestSha256: {
                    type: 'string',
                },
                origin: {
                    type: 'string',
                },
                priorActivityAvailable: {
                    const: false,
                    type: 'boolean',
                },
                provider: {
                    const: 'cdp-passive',
                    type: 'string',
                },
                reference: {
                    $ref: '#/definitions/ReverseBrowserReference',
                },
                resourceCount: {
                    type: 'string',
                },
                scriptCount: {
                    type: 'string',
                },
                sourceRunSha256: {
                    type: 'string',
                },
                targetId: {
                    type: 'string',
                },
            },
            required: [
                'capturedAt',
                'coverage',
                'exportedFiles',
                'frameId',
                'includeSources',
                'manifestBytes',
                'manifestSha256',
                'origin',
                'priorActivityAvailable',
                'provider',
                'reference',
                'resourceCount',
                'scriptCount',
                'sourceRunSha256',
                'targetId',
            ],
            type: 'object',
        },
        BrowserAnalysisMapInput: {
            description:
                'Body-free identity of an exact map member in the immutable analysis snapshot.',
            properties: {
                baseUrl: {
                    type: 'string',
                },
                bytes: {
                    type: 'string',
                },
                selector: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
            },
            required: ['baseUrl', 'bytes', 'selector', 'sha256'],
            type: 'object',
        },
        BrowserAttributeName: {
            description: 'An attribute directory contains names only.',
            properties: {
                index: {
                    type: 'number',
                },
                kind: {
                    const: 'attribute',
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
            },
            required: ['index', 'kind', 'name', 'nodeId'],
            type: 'object',
        },
        BrowserDomNode: {
            description:
                'DOM node identity is local to this capture, with attribute values and text excluded.',
            properties: {
                attributeCount: {
                    type: 'string',
                },
                backendNodeId: {
                    type: ['null', 'string'],
                },
                childCount: {
                    type: 'string',
                },
                depth: {
                    type: 'number',
                },
                id: {
                    type: 'string',
                },
                kind: {
                    const: 'dom',
                    type: 'string',
                },
                localName: {
                    type: 'string',
                },
                missingChildren: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
                nodeType: {
                    type: 'number',
                },
                parentId: {
                    type: ['null', 'string'],
                },
                relation: {
                    $ref: '#/definitions/BrowserDomRelation',
                },
                valueLength: {
                    type: 'string',
                },
            },
            required: [
                'attributeCount',
                'backendNodeId',
                'childCount',
                'depth',
                'id',
                'kind',
                'localName',
                'missingChildren',
                'name',
                'nodeType',
                'parentId',
                'relation',
                'valueLength',
            ],
            type: 'object',
        },
        BrowserDomRelation: {
            description:
                'The containment relation preserves the difference between light DOM, shadow and embedded documents.\nFinite DOM containment relations.',
            enum: [
                'child',
                'content-document',
                'document',
                'imported-document',
                'pseudo-element',
                'shadow-root',
                'template-content',
            ],
            type: 'string',
        },
        BrowserModuleCandidateRow: {
            description:
                'Candidate metadata points to original source pages and never carries captured code.',
            properties: {
                frameId: {
                    type: 'string',
                },
                hasSourceUrl: {
                    type: 'boolean',
                },
                id: {
                    type: 'string',
                },
                isModule: {
                    type: 'boolean',
                },
                kind: {
                    const: 'candidate',
                    type: 'string',
                },
                match: {
                    $ref: '#/definitions/BrowserModuleMatch',
                },
                sourceBytes: {
                    type: ['null', 'string'],
                },
                sourceSha256: {
                    type: ['null', 'string'],
                },
                startColumn: {
                    type: 'number',
                },
                startLine: {
                    type: 'number',
                },
                state: {
                    $ref: '#/definitions/BrowserScriptSourceState',
                },
                url: {
                    type: 'string',
                },
                urlCharacters: {
                    type: 'string',
                },
            },
            required: [
                'frameId',
                'hasSourceUrl',
                'id',
                'isModule',
                'kind',
                'match',
                'sourceBytes',
                'sourceSha256',
                'startColumn',
                'startLine',
                'state',
                'url',
                'urlCharacters',
            ],
            type: 'object',
        },
        BrowserModuleContext: {
            description:
                'Importer selection provenance never claims an observed installed runtime base.\nSelected source URL context provenance.',
            enum: ['explicit-importer-url', 'reported-source-url'],
            type: 'string',
        },
        BrowserModuleDirectoryRow: {
            anyOf: [
                {
                    $ref: '#/definitions/BrowserModuleImportRow',
                },
                {
                    $ref: '#/definitions/BrowserModuleCandidateRow',
                },
            ],
            description: 'One finite row in the selected saved directory.',
        },
        BrowserModuleImportRow: {
            description:
                'Literal identity and native errors are previews; exact fields are independently paged.',
            properties: {
                candidateCount: {
                    type: 'number',
                },
                errorCharacters: {
                    type: ['null', 'string'],
                },
                errorMessage: {
                    type: ['null', 'string'],
                },
                errorName: {
                    type: ['null', 'string'],
                },
                execution: {
                    const: 'unknown',
                    type: 'string',
                },
                expression: {
                    type: ['null', 'string'],
                },
                expressionCharacters: {
                    type: ['null', 'string'],
                },
                expressionTruncated: {
                    type: 'boolean',
                },
                id: {
                    type: 'string',
                },
                kind: {
                    const: 'import',
                    type: 'string',
                },
                location: {
                    $ref: '#/definitions/BrowserModulePosition',
                },
                specifier: {
                    type: ['null', 'string'],
                },
                specifierCharacters: {
                    type: ['null', 'string'],
                },
                status: {
                    $ref: '#/definitions/BrowserModuleTraceStatus',
                },
                syntax: {
                    type: 'string',
                },
                url: {
                    type: ['null', 'string'],
                },
                urlCharacters: {
                    type: ['null', 'string'],
                },
            },
            required: [
                'candidateCount',
                'errorCharacters',
                'errorMessage',
                'errorName',
                'execution',
                'expression',
                'expressionCharacters',
                'expressionTruncated',
                'id',
                'kind',
                'location',
                'specifier',
                'specifierCharacters',
                'status',
                'syntax',
                'url',
                'urlCharacters',
            ],
            type: 'object',
        },
        BrowserModuleMatch: {
            description:
                'Captured URL match strength is independent of execution and content identity.\nBrowser URL candidate matching provenance.',
            enum: ['exact-reported-url', 'response-url-without-fragment'],
            type: 'string',
        },
        BrowserModuleMetadata: {
            description:
                'Compact context previews identify exact text available through the text representation.',
            properties: {
                context: {
                    $ref: '#/definitions/BrowserModuleContext',
                },
                engine: {
                    const: 'chromium-import-meta-resolve',
                    type: 'string',
                },
                engineVersion: {
                    type: ['null', 'string'],
                },
                excludedNonEs: {
                    type: 'string',
                },
                excludedTypeOnly: {
                    type: 'string',
                },
                importCount: {
                    type: 'string',
                },
                importMapBaseCharacters: {
                    type: ['null', 'string'],
                },
                importMapBaseUrl: {
                    type: ['null', 'string'],
                },
                importMapBytes: {
                    type: ['null', 'string'],
                },
                importMapSha256: {
                    type: ['null', 'string'],
                },
                importerCharacters: {
                    type: 'string',
                },
                importerUrl: {
                    type: 'string',
                },
                module: {
                    type: 'string',
                },
                moduleCharacters: {
                    type: 'string',
                },
                parseError: {
                    type: ['null', 'string'],
                },
                parseErrorCharacters: {
                    type: ['null', 'string'],
                },
                sourceBytes: {
                    type: 'string',
                },
                sourceCapture: {
                    anyOf: [
                        {
                            $ref: '#/definitions/BrowserModuleSourceCapture',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                sourceSha256: {
                    type: 'string',
                },
            },
            required: [
                'context',
                'engine',
                'engineVersion',
                'excludedNonEs',
                'excludedTypeOnly',
                'importCount',
                'importMapBaseCharacters',
                'importMapBaseUrl',
                'importMapBytes',
                'importMapSha256',
                'importerCharacters',
                'importerUrl',
                'module',
                'moduleCharacters',
                'parseError',
                'parseErrorCharacters',
                'sourceBytes',
                'sourceCapture',
                'sourceSha256',
            ],
            type: 'object',
        },
        BrowserModulePage: {
            description:
                'At most twenty previews or one bounded UTF-16 range, with immutable provenance.',
            properties: {
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                field: {
                    anyOf: [
                        {
                            enum: [
                                'error-message',
                                'expression',
                                'importer-url',
                                'map-base-url',
                                'module',
                                'parse-error',
                                'resolved-url',
                                'specifier',
                            ],
                            type: 'string',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                metadata: {
                    $ref: '#/definitions/BrowserModuleMetadata',
                },
                nextCursor: {
                    type: ['null', 'string'],
                },
                records: {
                    items: {
                        $ref: '#/definitions/BrowserModuleDirectoryRow',
                    },
                    type: 'array',
                },
                reportSha256: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                selector: {
                    type: ['null', 'string'],
                },
                sha256: {
                    type: 'string',
                },
                text: {
                    type: ['null', 'string'],
                },
                textSha256: {
                    type: ['null', 'string'],
                },
                total: {
                    type: 'string',
                },
                view: {
                    $ref: '#/definitions/BrowserModuleView',
                },
            },
            required: [
                'cursor',
                'evidenceId',
                'field',
                'metadata',
                'nextCursor',
                'records',
                'reportSha256',
                'runId',
                'selector',
                'sha256',
                'text',
                'textSha256',
                'total',
                'view',
            ],
            type: 'object',
        },
        BrowserModulePosition: {
            description:
                'Coordinates identify the exact selected source without repeating a long path in every row.',
            properties: {
                column: {
                    type: 'number',
                },
                end: {
                    type: 'number',
                },
                endColumn: {
                    type: 'number',
                },
                endLine: {
                    type: 'number',
                },
                line: {
                    type: 'number',
                },
                start: {
                    type: 'number',
                },
            },
            required: ['column', 'end', 'endColumn', 'endLine', 'line', 'start'],
            type: 'object',
        },
        BrowserModuleQuery: {
            description: 'Requests contain archive IDs, never workspace paths or URLs to fetch.',
            properties: {
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                field: {
                    description:
                        'Full fields are read only after selecting an import or its context.\nExact field text selector, independent of source bodies.',
                    enum: [
                        'error-message',
                        'expression',
                        'importer-url',
                        'map-base-url',
                        'module',
                        'parse-error',
                        'resolved-url',
                        'specifier',
                    ],
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                selector: {
                    type: 'string',
                },
                view: {
                    $ref: '#/definitions/BrowserModuleView',
                },
            },
            required: ['evidenceId', 'id', 'runId', 'view'],
            type: 'object',
        },
        BrowserModuleSourceCapture: {
            description:
                'Original capture identity remains separate from derived analysis and report identities.',
            properties: {
                captureSha256: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
            },
            required: ['captureSha256', 'evidenceId', 'runId', 'sha256'],
            type: 'object',
        },
        BrowserModuleTraceStatus: {
            description:
                'Native URL evidence is distinct from computed syntax and runtime execution.\nResolution state for one outgoing ES module relationship.',
            enum: ['computed-specifier', 'native-resolution', 'unsupported-literal'],
            type: 'string',
        },
        BrowserModuleView: {
            description:
                'Metadata directories and exact text have independent bounded cursors.\nSaved browser module representation.',
            enum: ['candidates', 'imports', 'text'],
            type: 'string',
        },
        BrowserPageProjection: {
            description: 'One passive structure inspection tied to a stable selected document.',
            properties: {
                accessibility: {
                    $ref: '#/definitions/BrowserStructureProjection',
                },
                capturedAt: {
                    type: 'string',
                },
                dom: {
                    $ref: '#/definitions/BrowserStructureProjection',
                },
                frameId: {
                    type: 'string',
                },
                limitations: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                origin: {
                    type: 'string',
                },
                priorActivityAvailable: {
                    const: false,
                    type: 'boolean',
                },
                provider: {
                    const: 'cdp-passive',
                    type: 'string',
                },
                targetId: {
                    type: 'string',
                },
                url: {
                    type: 'string',
                },
            },
            required: [
                'accessibility',
                'capturedAt',
                'dom',
                'frameId',
                'limitations',
                'origin',
                'priorActivityAvailable',
                'provider',
                'targetId',
                'url',
            ],
            type: 'object',
        },
        BrowserPixelBounds: {
            description:
                'Pixel rectangle uses inclusive left/top and exclusive right/bottom coordinates.',
            properties: {
                height: {
                    type: 'number',
                },
                width: {
                    type: 'number',
                },
                x: {
                    type: 'number',
                },
                y: {
                    type: 'number',
                },
            },
            required: ['height', 'width', 'x', 'y'],
            type: 'object',
        },
        BrowserPixelComparison: {
            description:
                'Counts are decimal strings; averages retain all RGBA deltas, including tolerated pixels.',
            properties: {
                absoluteChannelDelta: {
                    type: ['null', 'string'],
                },
                afterHeight: {
                    type: 'number',
                },
                afterWidth: {
                    type: 'number',
                },
                algorithm: {
                    const: 'rgba-channel-v1',
                    type: 'string',
                },
                beforeHeight: {
                    type: 'number',
                },
                beforeWidth: {
                    type: 'number',
                },
                bounds: {
                    anyOf: [
                        {
                            $ref: '#/definitions/BrowserPixelBounds',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                changedPixels: {
                    type: ['null', 'string'],
                },
                changedRatio: {
                    type: ['null', 'number'],
                },
                channelThreshold: {
                    type: 'number',
                },
                comparedPixels: {
                    type: 'string',
                },
                maximumChannelDelta: {
                    type: ['null', 'number'],
                },
                meanAbsoluteChannelDelta: {
                    type: ['null', 'number'],
                },
                status: {
                    $ref: '#/definitions/BrowserPixelStatus',
                },
            },
            required: [
                'absoluteChannelDelta',
                'afterHeight',
                'afterWidth',
                'algorithm',
                'beforeHeight',
                'beforeWidth',
                'bounds',
                'changedPixels',
                'changedRatio',
                'channelThreshold',
                'comparedPixels',
                'maximumChannelDelta',
                'meanAbsoluteChannelDelta',
                'status',
            ],
            type: 'object',
        },
        BrowserPixelStatus: {
            description:
                'Pixel outcomes keep tolerated changes separate from exact equality.\nOne bounded local pixel-comparison outcome.',
            enum: ['different', 'dimension-mismatch', 'identical', 'within-threshold'],
            type: 'string',
        },
        BrowserSchemaProperty: {
            description:
                'Schema keys are retained as escaped JSON pointers; leaf values are excluded.',
            properties: {
                id: {
                    type: 'string',
                },
                observations: {
                    type: 'string',
                },
                path: {
                    type: 'string',
                },
                types: {
                    items: {
                        $ref: '#/definitions/BrowserSchemaType',
                    },
                    type: 'array',
                },
            },
            required: ['id', 'observations', 'path', 'types'],
            type: 'object',
        },
        BrowserSchemaSummary: {
            description:
                'Structural coverage reports a finite observed schema traversal rather than parameter validation.',
            properties: {
                complete: {
                    type: 'boolean',
                },
                maximumDepth: {
                    type: 'number',
                },
                nodeCount: {
                    type: 'string',
                },
                propertyCount: {
                    type: 'string',
                },
                rootType: {
                    $ref: '#/definitions/BrowserSchemaType',
                },
            },
            required: ['complete', 'maximumDepth', 'nodeCount', 'propertyCount', 'rootType'],
            type: 'object',
        },
        BrowserSchemaType: {
            description:
                "Value-free schema summaries use the native JSON value vocabulary.\nOne observed JSON value kind, independent of a schema's declared semantics.",
            enum: ['array', 'boolean', 'null', 'number', 'object', 'string'],
            type: 'string',
        },
        BrowserScreenshotComparisonSnapshot: {
            description: 'Body-free progress also identifies the archived comparison report.',
            properties: {
                after: {
                    $ref: '#/definitions/BrowserScreenshotComparisonSource',
                },
                before: {
                    $ref: '#/definitions/BrowserScreenshotComparisonSource',
                },
                metrics: {
                    $ref: '#/definitions/BrowserPixelComparison',
                },
                reference: {
                    $ref: '#/definitions/ReverseBrowserReference',
                },
            },
            required: ['after', 'before', 'metrics', 'reference'],
            type: 'object',
        },
        BrowserScreenshotComparisonSource: {
            description: 'Comparison retains each original capture and image digest separately.',
            properties: {
                metadata: {
                    $ref: '#/definitions/BrowserScreenshotMetadata',
                },
                reference: {
                    $ref: '#/definitions/ReverseBrowserReference',
                },
                sha256: {
                    type: 'string',
                },
            },
            required: ['metadata', 'reference', 'sha256'],
            type: 'object',
        },
        BrowserScreenshotMetadata: {
            description:
                'Image-free historical receipt for one explicitly requested visible viewport.',
            properties: {
                bytes: {
                    type: 'string',
                },
                capturedAt: {
                    type: 'string',
                },
                coverage: {
                    const: 'visible-viewport',
                    type: 'string',
                },
                frameId: {
                    type: 'string',
                },
                height: {
                    type: 'number',
                },
                mimeType: {
                    const: 'image/png',
                    type: 'string',
                },
                origin: {
                    type: 'string',
                },
                provider: {
                    const: 'cdp-passive',
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
                targetId: {
                    type: 'string',
                },
                viewport: {
                    $ref: '#/definitions/BrowserScreenshotViewport',
                },
                width: {
                    type: 'number',
                },
            },
            required: [
                'bytes',
                'capturedAt',
                'coverage',
                'frameId',
                'height',
                'mimeType',
                'origin',
                'provider',
                'sha256',
                'targetId',
                'viewport',
                'width',
            ],
            type: 'object',
        },
        BrowserScreenshotPage: {
            description: 'Capture and PNG digests identify different immutable artifacts.',
            properties: {
                captureSha256: {
                    type: 'string',
                },
                cursor: {
                    type: 'string',
                },
                data: {
                    type: ['null', 'string'],
                },
                evidenceId: {
                    type: 'string',
                },
                metadata: {
                    $ref: '#/definitions/BrowserScreenshotMetadata',
                },
                nextCursor: {
                    type: ['null', 'string'],
                },
                runId: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
                view: {
                    $ref: '#/definitions/BrowserScreenshotView',
                },
            },
            required: [
                'captureSha256',
                'cursor',
                'data',
                'evidenceId',
                'metadata',
                'nextCursor',
                'runId',
                'sha256',
                'view',
            ],
            type: 'object',
        },
        BrowserScreenshotQuery: {
            description:
                'Saved image reads accept archive IDs and canonical byte offsets, never URLs or files.',
            properties: {
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                view: {
                    $ref: '#/definitions/BrowserScreenshotView',
                },
            },
            required: ['evidenceId', 'id', 'runId', 'view'],
            type: 'object',
        },
        BrowserScreenshotSnapshot: {
            description: 'Progress retains an owner-bound archive identity without any image data.',
            properties: {
                bytes: {
                    type: 'string',
                },
                capturedAt: {
                    type: 'string',
                },
                coverage: {
                    const: 'visible-viewport',
                    type: 'string',
                },
                frameId: {
                    type: 'string',
                },
                height: {
                    type: 'number',
                },
                mimeType: {
                    const: 'image/png',
                    type: 'string',
                },
                origin: {
                    type: 'string',
                },
                provider: {
                    const: 'cdp-passive',
                    type: 'string',
                },
                reference: {
                    $ref: '#/definitions/ReverseBrowserReference',
                },
                sha256: {
                    type: 'string',
                },
                targetId: {
                    type: 'string',
                },
                viewport: {
                    $ref: '#/definitions/BrowserScreenshotViewport',
                },
                width: {
                    type: 'number',
                },
            },
            required: [
                'bytes',
                'capturedAt',
                'coverage',
                'frameId',
                'height',
                'mimeType',
                'origin',
                'provider',
                'reference',
                'sha256',
                'targetId',
                'viewport',
                'width',
            ],
            type: 'object',
        },
        BrowserScreenshotView: {
            description:
                'Metadata reads contain no pixels; selected image pages contain at most 49152 decoded bytes.\nOne finite saved screenshot representation.',
            enum: ['image', 'metadata'],
            type: 'string',
        },
        BrowserScreenshotViewport: {
            description:
                "CSS viewport coordinates are separate from the PNG's physical pixel dimensions.",
            properties: {
                height: {
                    type: 'number',
                },
                pageX: {
                    type: 'number',
                },
                pageY: {
                    type: 'number',
                },
                scale: {
                    type: 'number',
                },
                width: {
                    type: 'number',
                },
            },
            required: ['height', 'pageX', 'pageY', 'scale', 'width'],
            type: 'object',
        },
        BrowserScriptSourceMap: {
            description:
                'A source-map declaration is retained independently of fetched or decoded map coverage.',
            properties: {
                declarationLength: {
                    type: 'string',
                },
                declarationSha256: {
                    type: 'string',
                },
                inline: {
                    type: 'boolean',
                },
                url: {
                    type: ['null', 'string'],
                },
            },
            required: ['declarationLength', 'declarationSha256', 'inline', 'url'],
            type: 'object',
        },
        BrowserScriptSourceState: {
            description:
                'Source coverage is separate from script inventory and resource presence.\nReasons for having or omitting Debugger source text.',
            enum: ['budget-exhausted', 'captured', 'non-javascript', 'not-selected'],
            type: 'string',
        },
        BrowserSourceDirectoryRow: {
            anyOf: [
                {
                    $ref: '#/definitions/BrowserSourceScriptRow',
                },
                {
                    $ref: '#/definitions/BrowserSourceResourceRow',
                },
            ],
            description: 'Finite source directory rows are independently paged from text.',
        },
        BrowserSourceResourceRow: {
            description:
                'Resource metadata remains distinct from a script artifact or execution observation.',
            properties: {
                canceled: {
                    type: 'boolean',
                },
                contentSize: {
                    type: ['null', 'string'],
                },
                failed: {
                    type: 'boolean',
                },
                frameId: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                kind: {
                    const: 'resource',
                    type: 'string',
                },
                mimeType: {
                    type: 'string',
                },
                type: {
                    type: 'string',
                },
                url: {
                    type: 'string',
                },
            },
            required: [
                'canceled',
                'contentSize',
                'failed',
                'frameId',
                'id',
                'kind',
                'mimeType',
                'type',
                'url',
            ],
            type: 'object',
        },
        BrowserSourcesCoverage: {
            description:
                'Coverage counters describe observations, including repeats rejected before identity retention.',
            properties: {
                capturedSources: {
                    type: 'string',
                },
                excludedFrames: {
                    type: 'boolean',
                },
                excludedResources: {
                    type: 'string',
                },
                excludedScriptObservations: {
                    type: 'string',
                },
                omittedScriptObservations: {
                    type: 'string',
                },
                partial: {
                    type: 'boolean',
                },
                sourceBytes: {
                    type: 'string',
                },
            },
            required: [
                'capturedSources',
                'excludedFrames',
                'excludedResources',
                'excludedScriptObservations',
                'omittedScriptObservations',
                'partial',
                'sourceBytes',
            ],
            type: 'object',
        },
        BrowserSourceScriptRow: {
            description:
                'A directory script row has source identity and coverage, without the source body.',
            properties: {
                cdpHash: {
                    type: ['null', 'string'],
                },
                endColumn: {
                    type: 'number',
                },
                endLine: {
                    type: 'number',
                },
                frameId: {
                    type: 'string',
                },
                hasSourceUrl: {
                    type: 'boolean',
                },
                id: {
                    type: 'string',
                },
                isModule: {
                    type: 'boolean',
                },
                kind: {
                    const: 'script',
                    type: 'string',
                },
                language: {
                    type: 'string',
                },
                length: {
                    type: ['null', 'string'],
                },
                resourceIds: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                source: {
                    $ref: '#/definitions/Omit%3CBrowserScriptSource%2C%22text%22%3E',
                },
                sourceMap: {
                    anyOf: [
                        {
                            $ref: '#/definitions/BrowserScriptSourceMap',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                sourceMapOmitted: {
                    type: 'boolean',
                },
                startColumn: {
                    type: 'number',
                },
                startLine: {
                    type: 'number',
                },
                url: {
                    type: 'string',
                },
            },
            required: [
                'cdpHash',
                'endColumn',
                'endLine',
                'frameId',
                'hasSourceUrl',
                'id',
                'isModule',
                'kind',
                'language',
                'length',
                'resourceIds',
                'source',
                'sourceMap',
                'sourceMapOmitted',
                'startColumn',
                'startLine',
                'url',
            ],
            type: 'object',
        },
        BrowserSourcesPage: {
            description:
                "Source pages use exact UTF-16 offsets and retain the complete source's UTF-8 digest/byte count.",
            properties: {
                captureSha256: {
                    type: 'string',
                },
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                metadata: {
                    $ref: '#/definitions/BrowserSourcesProjection',
                },
                nextCursor: {
                    type: ['null', 'string'],
                },
                records: {
                    items: {
                        $ref: '#/definitions/BrowserSourceDirectoryRow',
                    },
                    type: 'array',
                },
                runId: {
                    type: 'string',
                },
                selector: {
                    type: ['null', 'string'],
                },
                sha256: {
                    type: 'string',
                },
                sourceBytes: {
                    type: ['null', 'string'],
                },
                sourceSha256: {
                    type: ['null', 'string'],
                },
                text: {
                    type: ['null', 'string'],
                },
                total: {
                    type: 'string',
                },
                view: {
                    $ref: '#/definitions/BrowserSourcesView',
                },
            },
            required: [
                'captureSha256',
                'cursor',
                'evidenceId',
                'metadata',
                'nextCursor',
                'records',
                'runId',
                'selector',
                'sha256',
                'sourceBytes',
                'sourceSha256',
                'text',
                'total',
                'view',
            ],
            type: 'object',
        },
        BrowserSourcesProjection: {
            description:
                'Source progress carries coverage and counts without code or full inventories.',
            properties: {
                capturedAt: {
                    type: 'string',
                },
                coverage: {
                    $ref: '#/definitions/BrowserSourcesCoverage',
                },
                frameId: {
                    type: 'string',
                },
                includeSources: {
                    type: 'boolean',
                },
                origin: {
                    type: 'string',
                },
                priorActivityAvailable: {
                    const: false,
                    type: 'boolean',
                },
                provider: {
                    const: 'cdp-passive',
                    type: 'string',
                },
                resourceCount: {
                    type: 'string',
                },
                scriptCount: {
                    type: 'string',
                },
                targetId: {
                    type: 'string',
                },
            },
            required: [
                'capturedAt',
                'coverage',
                'frameId',
                'includeSources',
                'origin',
                'priorActivityAvailable',
                'provider',
                'resourceCount',
                'scriptCount',
                'targetId',
            ],
            type: 'object',
        },
        BrowserSourcesQuery: {
            description:
                'Saved source selectors carry IDs and offsets, never sockets, capabilities or workspace paths.',
            properties: {
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                selector: {
                    type: 'string',
                },
                view: {
                    $ref: '#/definitions/BrowserSourcesView',
                },
            },
            required: ['evidenceId', 'id', 'runId', 'view'],
            type: 'object',
        },
        BrowserSourcesSnapshot: {
            description: 'A native source capture references one immutable owner-scoped archive.',
            properties: {
                capturedAt: {
                    type: 'string',
                },
                coverage: {
                    $ref: '#/definitions/BrowserSourcesCoverage',
                },
                frameId: {
                    type: 'string',
                },
                includeSources: {
                    type: 'boolean',
                },
                origin: {
                    type: 'string',
                },
                priorActivityAvailable: {
                    const: false,
                    type: 'boolean',
                },
                provider: {
                    const: 'cdp-passive',
                    type: 'string',
                },
                reference: {
                    $ref: '#/definitions/ReverseBrowserReference',
                },
                resourceCount: {
                    type: 'string',
                },
                scriptCount: {
                    type: 'string',
                },
                targetId: {
                    type: 'string',
                },
            },
            required: [
                'capturedAt',
                'coverage',
                'frameId',
                'includeSources',
                'origin',
                'priorActivityAvailable',
                'provider',
                'reference',
                'resourceCount',
                'scriptCount',
                'targetId',
            ],
            type: 'object',
        },
        BrowserSourcesView: {
            description:
                'Metadata and source content are selected independently, with distinct cursors.\nSaved capture views do not attach or execute page code.',
            enum: ['resources', 'scripts', 'source'],
            type: 'string',
        },
        BrowserStorageChange: {
            description:
                'Stable comparison ordinals refer to the original saved rows without returning their values.',
            properties: {
                after: {
                    anyOf: [
                        {
                            $ref: '#/definitions/BrowserStorageRow',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                before: {
                    anyOf: [
                        {
                            $ref: '#/definitions/BrowserStorageRow',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                change: {
                    $ref: '#/definitions/BrowserStorageChangeKind',
                },
                group: {
                    $ref: '#/definitions/BrowserStorageGroup',
                },
                id: {
                    type: 'string',
                },
            },
            required: ['after', 'before', 'change', 'group', 'id'],
            type: 'object',
        },
        BrowserStorageChangeKind: {
            description:
                'Absence becomes a change only when both inventories are complete.\nA proven difference between admissible saved rows.',
            enum: ['added', 'modified', 'removed'],
            type: 'string',
        },
        BrowserStorageCompareMode: {
            description:
                'Independent opt-ins determine whether content or only a name inventory can be compared.\nSelected comparison authority for one store.',
            enum: ['fingerprints', 'names', 'unavailable'],
            type: 'string',
        },
        BrowserStorageCompareStatus: {
            description:
                'Matching observations prove equality only within their declared complete coverage.\nOne storage comparison outcome independent of whether its detail list was retained in full.',
            enum: ['changed', 'unchanged', 'unknown'],
            type: 'string',
        },
        BrowserStorageComparison: {
            description:
                'Progress includes counters and provenance while changes stay in independently paged evidence.',
            properties: {
                after: {
                    $ref: '#/definitions/BrowserStorageComparisonSource',
                },
                algorithm: {
                    const: 'storage-observations-v1',
                    type: 'string',
                },
                before: {
                    $ref: '#/definitions/BrowserStorageComparisonSource',
                },
                complete: {
                    type: 'boolean',
                },
                detailsComplete: {
                    type: 'boolean',
                },
                groups: {
                    $ref: '#/definitions/Record%3CBrowserStorageGroup%2CBrowserStorageGroupComparison%3E',
                },
                limitations: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                quota: {
                    $ref: '#/definitions/BrowserStorageQuotaComparison',
                },
                status: {
                    $ref: '#/definitions/BrowserStorageCompareStatus',
                },
            },
            required: [
                'after',
                'algorithm',
                'before',
                'complete',
                'detailsComplete',
                'groups',
                'limitations',
                'quota',
                'status',
            ],
            type: 'object',
        },
        BrowserStorageComparisonPage: {
            description:
                'Header reads contain no changes; store reads return at most twenty directly indexed differences.',
            properties: {
                captureSha256: {
                    type: 'string',
                },
                changes: {
                    items: {
                        $ref: '#/definitions/BrowserStorageChange',
                    },
                    type: 'array',
                },
                comparison: {
                    $ref: '#/definitions/BrowserStorageComparison',
                },
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                group: {
                    anyOf: [
                        {
                            enum: [
                                'cache-storage',
                                'cookies',
                                'indexed-db',
                                'local-storage',
                                'session-storage',
                            ],
                            type: 'string',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                nextCursor: {
                    type: ['null', 'string'],
                },
                runId: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
            },
            required: [
                'captureSha256',
                'changes',
                'comparison',
                'cursor',
                'evidenceId',
                'group',
                'nextCursor',
                'runId',
                'sha256',
            ],
            type: 'object',
        },
        BrowserStorageComparisonQuery: {
            description:
                'A comparison directory selects one store and a retained-change ordinal, independently from text offsets.',
            properties: {
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                group: {
                    description:
                        'Each storage authority has independently reported coverage.\nFinite storage authorities admitted by passive capture and saved row queries.',
                    enum: [
                        'cache-storage',
                        'cookies',
                        'indexed-db',
                        'local-storage',
                        'session-storage',
                    ],
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['evidenceId', 'id', 'runId'],
            type: 'object',
        },
        BrowserStorageComparisonSnapshot: {
            description:
                'Archived progress binds the report itself independently of its two source captures.',
            properties: {
                after: {
                    $ref: '#/definitions/BrowserStorageComparisonSource',
                },
                algorithm: {
                    const: 'storage-observations-v1',
                    type: 'string',
                },
                before: {
                    $ref: '#/definitions/BrowserStorageComparisonSource',
                },
                complete: {
                    type: 'boolean',
                },
                detailsComplete: {
                    type: 'boolean',
                },
                groups: {
                    $ref: '#/definitions/Record%3CBrowserStorageGroup%2CBrowserStorageGroupComparison%3E',
                },
                limitations: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                quota: {
                    $ref: '#/definitions/BrowserStorageQuotaComparison',
                },
                reference: {
                    $ref: '#/definitions/ReverseBrowserReference',
                },
                status: {
                    $ref: '#/definitions/BrowserStorageCompareStatus',
                },
            },
            required: [
                'after',
                'algorithm',
                'before',
                'complete',
                'detailsComplete',
                'groups',
                'limitations',
                'quota',
                'reference',
                'status',
            ],
            type: 'object',
        },
        BrowserStorageComparisonSource: {
            description:
                'Body-free source provenance retains the independent run and original capture hashes.',
            properties: {
                metadata: {
                    $ref: '#/definitions/BrowserStorageMetadata',
                },
                reference: {
                    $ref: '#/definitions/ReverseBrowserReference',
                },
                sha256: {
                    type: 'string',
                },
            },
            required: ['metadata', 'reference', 'sha256'],
            type: 'object',
        },
        BrowserStorageCoverage: {
            description: 'Omitted rows or observed mutations prevent completeness claims.',
            properties: {
                available: {
                    type: 'boolean',
                },
                changedDuringCapture: {
                    type: 'boolean',
                },
                complete: {
                    type: 'boolean',
                },
                omitted: {
                    type: 'string',
                },
                rows: {
                    type: 'string',
                },
                selected: {
                    type: 'boolean',
                },
            },
            required: [
                'available',
                'changedDuringCapture',
                'complete',
                'omitted',
                'rows',
                'selected',
            ],
            type: 'object',
        },
        BrowserStorageGroup: {
            description:
                'Each storage authority has independently reported coverage.\nFinite storage authorities admitted by passive capture and saved row queries.',
            enum: ['cache-storage', 'cookies', 'indexed-db', 'local-storage', 'session-storage'],
            type: 'string',
        },
        BrowserStorageGroupComparison: {
            description:
                'Decimal counts cover all proven differences even if the bounded detail inventory is truncated.',
            properties: {
                added: {
                    type: 'string',
                },
                ambiguousIdentities: {
                    type: 'string',
                },
                complete: {
                    type: 'boolean',
                },
                mode: {
                    $ref: '#/definitions/BrowserStorageCompareMode',
                },
                modified: {
                    type: 'string',
                },
                omittedChanges: {
                    type: 'string',
                },
                reason: {
                    type: ['null', 'string'],
                },
                removed: {
                    type: 'string',
                },
                retainedChanges: {
                    type: 'string',
                },
                status: {
                    $ref: '#/definitions/BrowserStorageCompareStatus',
                },
                totalChanges: {
                    type: 'string',
                },
                unchanged: {
                    type: 'string',
                },
            },
            required: [
                'added',
                'ambiguousIdentities',
                'complete',
                'mode',
                'modified',
                'omittedChanges',
                'reason',
                'removed',
                'retainedChanges',
                'status',
                'totalChanges',
                'unchanged',
            ],
            type: 'object',
        },
        BrowserStorageKind: {
            description:
                'A row distinguishes store existence, schema and record fingerprints.\nFinite row interpretations preserved by content identity.',
            enum: ['cache-entry', 'name', 'record', 'schema', 'value'],
            type: 'string',
        },
        BrowserStorageMetadata: {
            description:
                'Projected capture identity includes no key/value bodies or unselected names.',
            properties: {
                capturedAt: {
                    type: 'string',
                },
                coverage: {
                    $ref: '#/definitions/Record%3CBrowserStorageGroup%2CBrowserStorageCoverage%3E',
                },
                fingerprintAlgorithm: {
                    const: 'sha256-canonical-json-v1',
                    type: 'string',
                },
                fingerprintsComplete: {
                    type: 'boolean',
                },
                frameId: {
                    type: 'string',
                },
                includeFingerprints: {
                    type: 'boolean',
                },
                includeNames: {
                    type: 'boolean',
                },
                limitations: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                origin: {
                    type: 'string',
                },
                provider: {
                    const: 'cdp-passive',
                    type: 'string',
                },
                quota: {
                    $ref: '#/definitions/BrowserStorageQuota',
                },
                targetId: {
                    type: 'string',
                },
                url: {
                    type: 'string',
                },
                valuesRedacted: {
                    const: true,
                    type: 'boolean',
                },
            },
            required: [
                'capturedAt',
                'coverage',
                'fingerprintAlgorithm',
                'fingerprintsComplete',
                'frameId',
                'includeFingerprints',
                'includeNames',
                'limitations',
                'origin',
                'provider',
                'quota',
                'targetId',
                'url',
                'valuesRedacted',
            ],
            type: 'object',
        },
        BrowserStoragePage: {
            description:
                'Metadata-only reads omit a group; selected groups contain at most twenty rows.',
            properties: {
                captureSha256: {
                    type: 'string',
                },
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                group: {
                    anyOf: [
                        {
                            enum: [
                                'cache-storage',
                                'cookies',
                                'indexed-db',
                                'local-storage',
                                'session-storage',
                            ],
                            type: 'string',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                metadata: {
                    $ref: '#/definitions/BrowserStorageMetadata',
                },
                nextCursor: {
                    type: ['null', 'string'],
                },
                rows: {
                    items: {
                        $ref: '#/definitions/BrowserStorageRow',
                    },
                    type: 'array',
                },
                runId: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
            },
            required: [
                'captureSha256',
                'cursor',
                'evidenceId',
                'group',
                'metadata',
                'nextCursor',
                'rows',
                'runId',
                'sha256',
            ],
            type: 'object',
        },
        BrowserStorageQuery: {
            description: 'Saved rows select one storage group with independent ordinal paging.',
            properties: {
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                group: {
                    description:
                        'Each storage authority has independently reported coverage.\nFinite storage authorities admitted by passive capture and saved row queries.',
                    enum: [
                        'cache-storage',
                        'cookies',
                        'indexed-db',
                        'local-storage',
                        'session-storage',
                    ],
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['evidenceId', 'id', 'runId'],
            type: 'object',
        },
        BrowserStorageQuota: {
            description: 'Quota byte counts retain exact validated integer representations.',
            properties: {
                available: {
                    type: 'boolean',
                },
                quotaBytes: {
                    type: ['null', 'string'],
                },
                usageBytes: {
                    type: ['null', 'string'],
                },
            },
            required: ['available', 'quotaBytes', 'usageBytes'],
            type: 'object',
        },
        BrowserStorageQuotaComparison: {
            description:
                'Byte deltas are exact signed integers and are available only for the same reported origin.',
            properties: {
                quotaDeltaBytes: {
                    type: ['null', 'string'],
                },
                status: {
                    $ref: '#/definitions/BrowserStorageCompareStatus',
                },
                usageDeltaBytes: {
                    type: ['null', 'string'],
                },
            },
            required: ['quotaDeltaBytes', 'status', 'usageDeltaBytes'],
            type: 'object',
        },
        BrowserStorageRow: {
            description:
                'Names appear only when selected; hashes identify data without returning its values.',
            properties: {
                complete: {
                    type: 'boolean',
                },
                group: {
                    $ref: '#/definitions/BrowserStorageGroup',
                },
                id: {
                    type: 'string',
                },
                identitySha256: {
                    type: ['null', 'string'],
                },
                kind: {
                    $ref: '#/definitions/BrowserStorageKind',
                },
                name: {
                    type: ['null', 'string'],
                },
                valueSha256: {
                    type: ['null', 'string'],
                },
            },
            required: ['complete', 'group', 'id', 'identitySha256', 'kind', 'name', 'valueSha256'],
            type: 'object',
        },
        BrowserStorageSnapshot: {
            description: 'Progress identifies a saved redacted capture without embedding its rows.',
            properties: {
                capturedAt: {
                    type: 'string',
                },
                coverage: {
                    $ref: '#/definitions/Record%3CBrowserStorageGroup%2CBrowserStorageCoverage%3E',
                },
                fingerprintAlgorithm: {
                    const: 'sha256-canonical-json-v1',
                    type: 'string',
                },
                fingerprintsComplete: {
                    type: 'boolean',
                },
                frameId: {
                    type: 'string',
                },
                includeFingerprints: {
                    type: 'boolean',
                },
                includeNames: {
                    type: 'boolean',
                },
                limitations: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                origin: {
                    type: 'string',
                },
                provider: {
                    const: 'cdp-passive',
                    type: 'string',
                },
                quota: {
                    $ref: '#/definitions/BrowserStorageQuota',
                },
                reference: {
                    $ref: '#/definitions/ReverseBrowserReference',
                },
                targetId: {
                    type: 'string',
                },
                url: {
                    type: 'string',
                },
                valuesRedacted: {
                    const: true,
                    type: 'boolean',
                },
            },
            required: [
                'capturedAt',
                'coverage',
                'fingerprintAlgorithm',
                'fingerprintsComplete',
                'frameId',
                'includeFingerprints',
                'includeNames',
                'limitations',
                'origin',
                'provider',
                'quota',
                'reference',
                'targetId',
                'url',
                'valuesRedacted',
            ],
            type: 'object',
        },
        BrowserStructureCount: {
            description: 'Value-free DOM tag and accessibility role counts.',
            properties: {
                count: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
            },
            required: ['count', 'name'],
            type: 'object',
        },
        BrowserStructurePage: {
            description: 'One independently selected, bounded topology or attribute directory.',
            properties: {
                captureSha256: {
                    type: 'string',
                },
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                metadata: {
                    $ref: '#/definitions/BrowserPageProjection',
                },
                nextCursor: {
                    type: ['null', 'string'],
                },
                records: {
                    items: {
                        $ref: '#/definitions/BrowserStructureRow',
                    },
                    type: 'array',
                },
                runId: {
                    type: 'string',
                },
                selector: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
                total: {
                    type: 'string',
                },
                view: {
                    $ref: '#/definitions/BrowserStructureView',
                },
            },
            required: [
                'captureSha256',
                'cursor',
                'evidenceId',
                'metadata',
                'nextCursor',
                'records',
                'runId',
                'selector',
                'sha256',
                'total',
                'view',
            ],
            type: 'object',
        },
        BrowserStructureProjection: {
            description:
                'Bounded structure coverage does not imply that page text or earlier activity was inspected.',
            properties: {
                available: {
                    type: 'boolean',
                },
                countPreviewPartial: {
                    type: 'boolean',
                },
                counts: {
                    items: {
                        $ref: '#/definitions/BrowserStructureCount',
                    },
                    type: 'array',
                },
                nodes: {
                    type: 'string',
                },
                partial: {
                    type: 'boolean',
                },
            },
            required: ['available', 'countPreviewPartial', 'counts', 'nodes', 'partial'],
            type: 'object',
        },
        BrowserStructureQuery: {
            description:
                'Selectors are all, roots, node:ID, children:ID or attributes:ID; authority is never supplied by a selector.',
            properties: {
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                selector: {
                    type: 'string',
                },
                view: {
                    $ref: '#/definitions/BrowserStructureView',
                },
            },
            required: ['evidenceId', 'id', 'runId', 'view'],
            type: 'object',
        },
        BrowserStructureRow: {
            anyOf: [
                {
                    $ref: '#/definitions/BrowserDomNode',
                },
                {
                    $ref: '#/definitions/BrowserAccessibilityNode',
                },
                {
                    $ref: '#/definitions/BrowserAttributeName',
                },
            ],
            description: 'Each response row has an explicit representation discriminator.',
        },
        BrowserStructureSnapshot: {
            description: 'A progress receipt references structure without carrying complete trees.',
            properties: {
                accessibility: {
                    $ref: '#/definitions/BrowserStructureProjection',
                },
                capturedAt: {
                    type: 'string',
                },
                dom: {
                    $ref: '#/definitions/BrowserStructureProjection',
                },
                frameId: {
                    type: 'string',
                },
                limitations: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                origin: {
                    type: 'string',
                },
                priorActivityAvailable: {
                    const: false,
                    type: 'boolean',
                },
                provider: {
                    const: 'cdp-passive',
                    type: 'string',
                },
                reference: {
                    $ref: '#/definitions/ReverseBrowserReference',
                },
                targetId: {
                    type: 'string',
                },
                url: {
                    type: 'string',
                },
            },
            required: [
                'accessibility',
                'capturedAt',
                'dom',
                'frameId',
                'limitations',
                'origin',
                'priorActivityAvailable',
                'provider',
                'reference',
                'targetId',
                'url',
            ],
            type: 'object',
        },
        BrowserStructureView: {
            description:
                'Independent tree representations use the same immutable document capture.\nThe finite browser structure representations.',
            enum: ['accessibility', 'dom'],
            type: 'string',
        },
        BrowserWebMcpAnnotations: {
            description:
                'Page-provided booleans remain untrusted annotations, never authorization decisions.',
            properties: {
                autosubmit: {
                    type: ['null', 'boolean'],
                },
                consequential: {
                    type: ['null', 'boolean'],
                },
                debugging: {
                    type: ['null', 'boolean'],
                },
                readOnly: {
                    type: ['null', 'boolean'],
                },
                untrustedContent: {
                    type: ['null', 'boolean'],
                },
            },
            required: ['autosubmit', 'consequential', 'debugging', 'readOnly', 'untrustedContent'],
            type: 'object',
        },
        BrowserWebMcpDeclaration: {
            description:
                'Declarations are inventory evidence; they never become executable Nexa tools.\nHow the page registered a declaration.',
            enum: ['declarative', 'imperative'],
            type: 'string',
        },
        BrowserWebMcpDescriptor: {
            description:
                'A directory row excludes its separately paged structural schema properties.',
            properties: {
                annotations: {
                    $ref: '#/definitions/BrowserWebMcpAnnotations',
                },
                declaration: {
                    $ref: '#/definitions/BrowserWebMcpDeclaration',
                },
                description: {
                    type: 'string',
                },
                frameId: {
                    type: 'string',
                },
                frameUrl: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                inputSchema: {
                    anyOf: [
                        {
                            $ref: '#/definitions/BrowserSchemaSummary',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                key: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
                origin: {
                    type: 'string',
                },
                registrationSource: {
                    anyOf: [
                        {
                            $ref: '#/definitions/BrowserWebMcpSource',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                trust: {
                    const: 'page-declared-untrusted',
                    type: 'string',
                },
            },
            required: [
                'annotations',
                'declaration',
                'description',
                'frameId',
                'frameUrl',
                'id',
                'inputSchema',
                'key',
                'name',
                'origin',
                'registrationSource',
                'trust',
            ],
            type: 'object',
        },
        BrowserWebMcpMetadata: {
            description:
                'Captured scope distinguishes unsupported protocols and explicit retention/authority gaps.',
            properties: {
                allowedOrigins: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                available: {
                    type: 'boolean',
                },
                capturedAt: {
                    type: 'string',
                },
                complete: {
                    type: 'boolean',
                },
                dropped: {
                    type: 'string',
                },
                frameCoverageComplete: {
                    type: 'boolean',
                },
                frameId: {
                    type: 'string',
                },
                invocationAvailable: {
                    const: false,
                    type: 'boolean',
                },
                limitations: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                observationMs: {
                    type: 'number',
                },
                origin: {
                    type: 'string',
                },
                provider: {
                    const: 'cdp-passive',
                    type: 'string',
                },
                schemaCoverageComplete: {
                    type: 'boolean',
                },
                schemaValuesExcluded: {
                    const: true,
                    type: 'boolean',
                },
                targetId: {
                    type: 'string',
                },
                toolCount: {
                    type: 'string',
                },
                url: {
                    type: 'string',
                },
            },
            required: [
                'allowedOrigins',
                'available',
                'capturedAt',
                'complete',
                'dropped',
                'frameCoverageComplete',
                'frameId',
                'invocationAvailable',
                'limitations',
                'observationMs',
                'origin',
                'provider',
                'schemaCoverageComplete',
                'schemaValuesExcluded',
                'targetId',
                'toolCount',
                'url',
            ],
            type: 'object',
        },
        BrowserWebMcpPage: {
            description:
                'Only selected rows are transferred; schema leaves and complete originals remain host-side.',
            properties: {
                captureSha256: {
                    type: 'string',
                },
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                metadata: {
                    $ref: '#/definitions/BrowserWebMcpMetadata',
                },
                nextCursor: {
                    type: ['null', 'string'],
                },
                properties: {
                    items: {
                        $ref: '#/definitions/BrowserSchemaProperty',
                    },
                    type: 'array',
                },
                runId: {
                    type: 'string',
                },
                selectedTool: {
                    anyOf: [
                        {
                            $ref: '#/definitions/BrowserWebMcpDescriptor',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                selector: {
                    type: ['null', 'string'],
                },
                sha256: {
                    type: 'string',
                },
                tools: {
                    items: {
                        $ref: '#/definitions/BrowserWebMcpDescriptor',
                    },
                    type: 'array',
                },
                view: {
                    $ref: '#/definitions/BrowserWebMcpView',
                },
            },
            required: [
                'captureSha256',
                'cursor',
                'evidenceId',
                'metadata',
                'nextCursor',
                'properties',
                'runId',
                'selectedTool',
                'selector',
                'sha256',
                'tools',
                'view',
            ],
            type: 'object',
        },
        BrowserWebMcpQuery: {
            description:
                'Gateway authority is checked against the original owner and conversation before any index read.',
            properties: {
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                selector: {
                    type: 'string',
                },
                view: {
                    description:
                        'Metadata, declaration rows and one selected schema have independent transfer budgets.\nOne selected saved representation.',
                    enum: ['metadata', 'schema', 'tools'],
                    type: 'string',
                },
            },
            required: ['evidenceId', 'id', 'runId'],
            type: 'object',
        },
        BrowserWebMcpSnapshot: {
            description:
                'Progress binds metadata to the original report without tool/schema arrays.',
            properties: {
                allowedOrigins: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                available: {
                    type: 'boolean',
                },
                capturedAt: {
                    type: 'string',
                },
                complete: {
                    type: 'boolean',
                },
                dropped: {
                    type: 'string',
                },
                frameCoverageComplete: {
                    type: 'boolean',
                },
                frameId: {
                    type: 'string',
                },
                invocationAvailable: {
                    const: false,
                    type: 'boolean',
                },
                limitations: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                observationMs: {
                    type: 'number',
                },
                origin: {
                    type: 'string',
                },
                provider: {
                    const: 'cdp-passive',
                    type: 'string',
                },
                reference: {
                    $ref: '#/definitions/ReverseBrowserReference',
                },
                schemaCoverageComplete: {
                    type: 'boolean',
                },
                schemaValuesExcluded: {
                    const: true,
                    type: 'boolean',
                },
                targetId: {
                    type: 'string',
                },
                toolCount: {
                    type: 'string',
                },
                url: {
                    type: 'string',
                },
            },
            required: [
                'allowedOrigins',
                'available',
                'capturedAt',
                'complete',
                'dropped',
                'frameCoverageComplete',
                'frameId',
                'invocationAvailable',
                'limitations',
                'observationMs',
                'origin',
                'provider',
                'reference',
                'schemaCoverageComplete',
                'schemaValuesExcluded',
                'targetId',
                'toolCount',
                'url',
            ],
            type: 'object',
        },
        BrowserWebMcpSource: {
            description:
                'A registration call frame is exposed only for an admitted HTTP(S) source origin.',
            properties: {
                column: {
                    type: ['null', 'number'],
                },
                line: {
                    type: ['null', 'number'],
                },
                url: {
                    type: 'string',
                },
            },
            required: ['column', 'line', 'url'],
            type: 'object',
        },
        BrowserWebMcpView: {
            description:
                'Metadata, declaration rows and one selected schema have independent transfer budgets.\nOne selected saved representation.',
            enum: ['metadata', 'schema', 'tools'],
            type: 'string',
        },
        Budget: {
            description: 'A spending limit over one scope.',
            properties: {
                alertThresholds: {
                    description:
                        'Fractions of the limit at which to raise a warning (e.g. `[0.8, 0.95]`).',
                    items: {
                        type: 'number',
                    },
                    type: 'array',
                },
                createdAt: {
                    type: 'number',
                },
                enforcement: {
                    $ref: '#/definitions/BudgetEnforcement',
                    description:
                        'What happens at the cap.\n\n`block` refuses further spend; `warn` records and allows it. The default is `warn`, because a\nbudget that silently halts an enterprise agent mid-task is a worse failure than an overrun\nsomebody can see — blocking must be chosen deliberately.',
                },
                id: {
                    type: 'string',
                },
                limitMicrocents: {
                    description: 'The cap in micro-cents for the window.',
                    type: 'number',
                },
                period: {
                    $ref: '#/definitions/BudgetPeriod',
                    description: 'The window the cap applies over.',
                },
                scope: {
                    $ref: '#/definitions/CreditScope',
                },
                scopeId: {
                    description: "The scope's id (a user id, an agent id…). Ignored for `global`.",
                    type: 'string',
                },
                updatedAt: {
                    type: 'number',
                },
            },
            required: [
                'createdAt',
                'enforcement',
                'id',
                'limitMicrocents',
                'period',
                'scope',
                'scopeId',
                'updatedAt',
            ],
            type: 'object',
        },
        BudgetEnforcement: {
            description: 'What a budget does when its limit is reached.',
            enum: ['block', 'warn'],
            type: 'string',
        },
        BudgetPeriod: {
            description: "The window a budget's limit applies over.",
            enum: ['daily', 'hourly', 'monthly', 'total', 'weekly'],
            type: 'string',
        },
        ChangedData: {
            description:
                'The payload of a {@link GATEWAY_EVENTS.JobsChanged} or {@link GATEWAY_EVENTS.AgentsChanged}.',
            properties: {
                change: {
                    description:
                        'What happened, so a client can decide whether a full re-read is worth it.',
                    enum: ['added', 'defined', 'removed'],
                    type: 'string',
                },
                id: {
                    description: "The record's id.",
                    type: 'string',
                },
            },
            required: ['change', 'id'],
            type: 'object',
        },
        ChannelInfo: {
            description: 'One channel account the deployment is running.',
            properties: {
                actions: {
                    description: "The message actions the platform's adapter actually implements.",
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                id: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
            },
            required: ['actions', 'id', 'name'],
            type: 'object',
        },
        ChannelStatusResult: {
            description: "A channel's live health, as its own adapter reports it.",
            properties: {
                configured: {
                    type: 'boolean',
                },
                connected: {
                    type: 'boolean',
                },
                id: {
                    type: 'string',
                },
                issues: {
                    items: {
                        properties: {
                            kind: {
                                type: 'string',
                            },
                            message: {
                                type: 'string',
                            },
                        },
                        required: ['kind', 'message'],
                        type: 'object',
                    },
                    type: 'array',
                },
                lastError: {
                    type: 'string',
                },
                lifecycle: {
                    enum: ['blocked', 'ready', 'recovering', 'starting', 'stopped', 'unknown'],
                    type: 'string',
                },
            },
            required: ['configured', 'connected', 'id', 'issues', 'lifecycle'],
            type: 'object',
        },
        ChargeKind: {
            enum: [
                'adjustment',
                'completion',
                'embedding',
                'media',
                'speech',
                'tool',
                'transcription',
            ],
            type: 'string',
        },
        ChatGraph: {
            description: 'A non-executable graph delivered directly into a conversation.',
            properties: {
                description: {
                    type: 'string',
                },
                edges: {
                    items: {
                        $ref: '#/definitions/ChatGraphEdge',
                    },
                    type: 'array',
                },
                id: {
                    type: 'string',
                },
                nodes: {
                    items: {
                        $ref: '#/definitions/ChatGraphNode',
                    },
                    type: 'array',
                },
                title: {
                    type: 'string',
                },
            },
            required: ['description', 'edges', 'id', 'nodes', 'title'],
            type: 'object',
        },
        ChatGraphColor: {
            description:
                'Available semantic colors, shared by the agent and workflow-based chat renderer.\nA supported graph card color.',
            enum: ['blue', 'gray', 'green', 'orange', 'purple', 'red'],
            type: 'string',
        },
        ChatGraphEdge: {
            description: 'A directed, labelled relationship between two existing nodes.',
            properties: {
                from: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                label: {
                    type: 'string',
                },
                to: {
                    type: 'string',
                },
            },
            required: ['from', 'id', 'label', 'to'],
            type: 'object',
        },
        ChatGraphNode: {
            description: 'A named idea or capability; descriptions are plain text.',
            properties: {
                color: {
                    $ref: '#/definitions/ChatGraphColor',
                },
                description: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                label: {
                    type: 'string',
                },
            },
            required: ['color', 'description', 'id', 'label'],
            type: 'object',
        },
        CommandExecutionReceipt: {
            description:
                'Host-produced command termination evidence, separate from model-visible output.',
            properties: {
                command: {
                    type: 'string',
                },
                cwd: {
                    type: 'string',
                },
                exitCode: {
                    type: ['null', 'number'],
                },
                processId: {
                    type: ['null', 'string'],
                },
                processToken: {
                    type: ['null', 'string'],
                },
                remote: {
                    type: 'boolean',
                },
                running: {
                    type: 'boolean',
                },
                signal: {
                    type: ['null', 'string'],
                },
                terminalOutput: {
                    description:
                        'Original terminal stream, including ANSI styles and cursor controls.',
                    type: 'string',
                },
            },
            required: [
                'command',
                'cwd',
                'exitCode',
                'processId',
                'processToken',
                'remote',
                'running',
                'signal',
            ],
            type: 'object',
        },
        ComponentCategory: {
            description:
                'Catalog grouping retains all requested capability areas without declaring runtime support.',
            enum: [
                'agents',
                'api',
                'browser',
                'cache',
                'collection',
                'conditions',
                'connections',
                'context',
                'documents',
                'entities',
                'experiments',
                'flow',
                'human',
                'media',
                'messaging',
                'models',
                'observability',
                'output',
                'personas',
                'planning',
                'policy',
                'programs',
                'prompts',
                'quality',
                'research',
                'resources',
                'storage',
                'teams',
                'time',
                'tools',
                'transform',
                'triggers',
                'utilities',
            ],
            type: 'string',
        },
        ComponentDefinition: {
            description:
                'Registry version is pinned in every saved node. Runtime and UI share this exact definition.',
            properties: {
                category: {
                    $ref: '#/definitions/ComponentCategory',
                },
                configuration: {
                    $ref: '#/definitions/ObjectSchema',
                },
                defaults: {
                    $ref: '#/definitions/WorkflowObject',
                },
                display: {
                    $ref: '#/definitions/ComponentDisplay',
                },
                execution: {
                    anyOf: [
                        {
                            $ref: '#/definitions/ComponentExecution',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                externalFamily: {
                    description:
                        'Present only on external resource cards, distinct from account or editor workspaces.',
                    enum: [
                        'application',
                        'compute',
                        'computer',
                        'database',
                        'feed',
                        'files',
                        'workspace',
                    ],
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                migratesFrom: {
                    description:
                        'Older versions requiring explicit migrations; no silent rewrite is permitted.',
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                ports: {
                    items: {
                        $ref: '#/definitions/ComponentPort',
                    },
                    type: 'array',
                },
                resourceRole: {
                    type: ['null', 'string'],
                },
                resources: {
                    items: {
                        $ref: '#/definitions/ComponentResourceSlot',
                    },
                    type: 'array',
                },
                role: {
                    $ref: '#/definitions/ComponentRole',
                },
                version: {
                    type: 'string',
                },
            },
            required: [
                'category',
                'configuration',
                'defaults',
                'display',
                'execution',
                'id',
                'migratesFrom',
                'ports',
                'resourceRole',
                'resources',
                'role',
                'version',
            ],
            type: 'object',
        },
        ComponentDisplay: {
            description:
                'Declarative presentation hints support family-specific cards without coupling contracts to React.',
            properties: {
                accent: {
                    type: 'string',
                },
                card: {
                    type: 'string',
                },
                compactFields: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                description: {
                    type: 'string',
                },
                example: {
                    type: 'string',
                },
                inspectorFields: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                tags: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                title: {
                    type: 'string',
                },
            },
            required: [
                'accent',
                'card',
                'compactFields',
                'description',
                'example',
                'inspectorFields',
                'tags',
                'title',
            ],
            type: 'object',
        },
        ComponentEffect: {
            enum: ['external', 'inference', 'pure', 'wait'],
            type: 'string',
        },
        ComponentExecution: {
            description:
                'Runtime availability is explicit; a schema definition alone cannot authorize or execute work.',
            properties: {
                cancellation: {
                    type: 'string',
                },
                capabilities: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                credits: {
                    type: 'string',
                },
                effect: {
                    $ref: '#/definitions/ComponentEffect',
                },
                handler: {
                    type: ['null', 'string'],
                },
                maxAttempts: {
                    type: 'number',
                },
                mock: {
                    $ref: '#/definitions/MockBehavior',
                },
                permissions: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                persistence: {
                    type: 'string',
                },
                retryErrors: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                streaming: {
                    type: 'boolean',
                },
                timeoutMs: {
                    type: 'string',
                },
            },
            required: [
                'cancellation',
                'capabilities',
                'credits',
                'effect',
                'handler',
                'maxAttempts',
                'mock',
                'permissions',
                'persistence',
                'retryErrors',
                'streaming',
                'timeoutMs',
            ],
            type: 'object',
        },
        ComponentPort: {
            description:
                'Literal inputs and wire inputs share one schema; connecting both is ambiguous and rejected.',
            properties: {
                cardinality: {
                    $ref: '#/definitions/PortCardinality',
                },
                direction: {
                    $ref: '#/definitions/PortDirection',
                },
                id: {
                    type: 'string',
                },
                incoming: {
                    $ref: '#/definitions/IncomingPolicy',
                },
                kind: {
                    $ref: '#/definitions/WorkflowEdgeKind',
                },
                label: {
                    type: 'string',
                },
                literalField: {
                    type: ['null', 'string'],
                },
                maxConnections: {
                    type: 'number',
                },
                modelCapabilities: {
                    description:
                        "Authoring hint; runtime must still verify the provider's actual supported operations.",
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                required: {
                    type: 'boolean',
                },
                schema: {
                    $ref: '#/definitions/ValueSchema',
                },
            },
            required: [
                'cardinality',
                'direction',
                'id',
                'incoming',
                'kind',
                'label',
                'literalField',
                'maxConnections',
                'required',
                'schema',
            ],
            type: 'object',
        },
        ComponentResourceSlot: {
            description:
                'Inline resource bindings have the same capability requirements as exposed resource cards.',
            properties: {
                family: {
                    $ref: '#/definitions/ResourceFamily',
                },
                uses: {
                    items: {
                        $ref: '#/definitions/ResourceUse',
                    },
                    type: 'array',
                },
            },
            required: ['family', 'uses'],
            type: 'object',
        },
        ComponentRole: {
            description: 'The four authoring roles have different scheduling semantics.',
            enum: ['resource', 'step', 'trigger', 'visual'],
            type: 'string',
        },
        ConfigResult: {
            description: 'The effective configuration, with secrets removed.',
            properties: {
                config: {
                    $ref: '#/definitions/Record%3Cstring%2Cunknown%3E',
                    description:
                        'The merged config as JSON. Redacted — see `redactConfig` in the server.',
                },
                defaults: {
                    $ref: '#/definitions/Record%3Cstring%2Cunknown%3E',
                    description:
                        'The configuration as it would be with no file and no environment at all.\n\nSent so a UI can offer a settings EDITOR rather than a settings viewer. Three things need it\nand none can be derived from the merged config alone: the type of a key the operator has not\nset yet (an absent key has no value to infer one from), whether the current value differs from\nthe shipped one, and what "reset" would restore. Without it a console can only show what is\nset, which is precisely the half an operator already knows.',
                },
                path: {
                    description:
                        'The file it was loaded from, or null when everything came from defaults and the env.',
                    type: ['null', 'string'],
                },
                redacted: {
                    description:
                        'Field paths whose values were replaced by a placeholder, so a UI can say so.',
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
            },
            required: ['config', 'defaults', 'path', 'redacted'],
            type: 'object',
        },
        ConfigWriteParams: {
            description: 'One setting, by dotted path.',
            properties: {
                key: {
                    type: 'string',
                },
                value: {
                    description:
                        'The value, already parsed.\n\nA JSON value rather than a string, unlike the CLI\'s argument: a caller speaking this protocol\nhas types, and re-parsing a string here would make `"true"` and `true` indistinguishable at\nexactly the boundary where the difference matters.',
                },
            },
            required: ['key', 'value'],
            type: 'object',
        },
        ConfigWriteResult: {
            description: 'What a write did.',
            properties: {
                key: {
                    type: 'string',
                },
                ok: {
                    const: true,
                    type: 'boolean',
                },
                path: {
                    description: 'The file that was written.',
                    type: 'string',
                },
            },
            required: ['key', 'ok', 'path'],
            type: 'object',
        },
        ConnectChallengeData: {
            description: 'The payload of a {@link GATEWAY_EVENTS.ConnectChallenge}.',
            properties: {
                minProtocol: {
                    type: 'number',
                },
                nonce: {
                    description: 'Echoed back in {@link ConnectParams.nonce}.',
                    type: 'string',
                },
                protocol: {
                    type: 'number',
                },
                ts: {
                    description: "The server's clock when the challenge was issued.",
                    type: 'number',
                },
            },
            required: ['minProtocol', 'nonce', 'protocol', 'ts'],
            type: 'object',
        },
        ConnectClientInfo: {
            description: 'How a client identifies itself in the handshake.',
            properties: {
                id: {
                    description: 'Stable per install, so a reconnect is recognisable in the logs.',
                    type: 'string',
                },
                metadataOnlyAttachments: {
                    description:
                        'Deliver saved file descriptors; clients explicitly request original bytes.',
                    type: 'boolean',
                },
                mode: {
                    enum: ['automation', 'cli', 'node', 'tui', 'ui'],
                    type: 'string',
                },
                platform: {
                    type: 'string',
                },
                version: {
                    type: 'string',
                },
            },
            required: ['id', 'mode', 'platform', 'version'],
            type: 'object',
        },
        ConnectParams: {
            description: "The `connect` frame's params.",
            properties: {
                client: {
                    $ref: '#/definitions/ConnectClientInfo',
                },
                maxProtocol: {
                    description: 'The newest protocol the client can speak.',
                    type: 'number',
                },
                minProtocol: {
                    description: 'The oldest protocol the client can speak.',
                    type: 'number',
                },
                nonce: {
                    description:
                        "The challenge nonce, proving the client read the server's first frame.",
                    type: 'string',
                },
            },
            required: ['client', 'maxProtocol', 'minProtocol', 'nonce'],
            type: 'object',
        },
        ContentBlock: {
            anyOf: [
                {
                    properties: {
                        text: {
                            type: 'string',
                        },
                        type: {
                            const: 'text',
                            type: 'string',
                        },
                    },
                    required: ['text', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        signature: {
                            type: 'string',
                        },
                        thinking: {
                            type: 'string',
                        },
                        type: {
                            const: 'thinking',
                            description:
                                "The model's reasoning trace. `signature` is Anthropic's integrity token: it MUST be\nround-tripped verbatim on a later turn or the API rejects the thinking block.",
                            type: 'string',
                        },
                    },
                    required: ['thinking', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        data: {
                            type: 'string',
                        },
                        type: {
                            const: 'redacted-thinking',
                            description:
                                'Reasoning the provider encrypted. Opaque, and round-tripped as-is.',
                            type: 'string',
                        },
                    },
                    required: ['data', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        source: {
                            $ref: '#/definitions/BinarySource',
                        },
                        title: {
                            type: 'string',
                        },
                        type: {
                            const: 'image',
                            type: 'string',
                        },
                    },
                    required: ['source', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        source: {
                            $ref: '#/definitions/BinarySource',
                        },
                        title: {
                            type: 'string',
                        },
                        type: {
                            const: 'video',
                            description:
                                'An encoded video or animation container decoded natively by a multimodal model.',
                            type: 'string',
                        },
                    },
                    required: ['source', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        source: {
                            $ref: '#/definitions/BinarySource',
                        },
                        title: {
                            type: 'string',
                        },
                        type: {
                            const: 'video-frame',
                            description:
                                'One ordered frame of a video or animation. Consecutive frames form one clip.',
                            type: 'string',
                        },
                    },
                    required: ['source', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        source: {
                            $ref: '#/definitions/BinarySource',
                        },
                        title: {
                            type: 'string',
                        },
                        type: {
                            const: 'document',
                            type: 'string',
                        },
                    },
                    required: ['source', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        id: {
                            type: 'string',
                        },
                        input: {
                            $ref: '#/definitions/JsonValue',
                        },
                        name: {
                            type: 'string',
                        },
                        signature: {
                            description:
                                'An integrity token some providers attach to a tool call made while reasoning.\n\nOpaque, and round-tripped verbatim on the next turn. Gemini rejects a replayed function\ncall whose thought signature is missing or altered, so this must travel WITH the block\nrather than in a side table — a cache keyed by call id does not survive a session being\nreloaded from disk, which is exactly when the replay happens.',
                            type: 'string',
                        },
                        type: {
                            const: 'tool-use',
                            description:
                                "The model asking for a tool to run. `id` is the provider's own call id and is what a\nresult must quote back.",
                            type: 'string',
                        },
                    },
                    required: ['id', 'input', 'name', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        chatGraph: {
                            $ref: '#/definitions/ChatGraph',
                            description:
                                'Saved visual delivery; providers only consume the ordinary content.',
                        },
                        content: {
                            anyOf: [
                                {
                                    items: {
                                        $ref: '#/definitions/ContentBlock',
                                    },
                                    type: 'array',
                                },
                                {
                                    type: 'string',
                                },
                            ],
                        },
                        inspectedMediaSha256: {
                            description:
                                'Host-authored observation evidence; never inferred from result prose.',
                            items: {
                                type: 'string',
                            },
                            type: 'array',
                        },
                        isError: {
                            type: 'boolean',
                        },
                        toolUseId: {
                            type: 'string',
                        },
                        type: {
                            const: 'tool-result',
                            description: 'The outcome of a tool call, sent back on the next turn.',
                            type: 'string',
                        },
                    },
                    required: ['content', 'toolUseId', 'type'],
                    type: 'object',
                },
            ],
            description: "One block of a message's content.",
        },
        ConversationInput: {
            description:
                'Only editable text and a media count cross the wire when opening the message editor.',
            properties: {
                attachmentCount: {
                    type: 'number',
                },
                text: {
                    type: 'string',
                },
            },
            required: ['attachmentCount', 'text'],
            type: 'object',
        },
        ConversationMessageRef: {
            description:
                'A stable input, response stream, or canonical entry in a saved conversation.',
            properties: {
                key: {
                    type: 'string',
                },
                kind: {
                    enum: ['entry', 'input', 'input-stream', 'response'],
                    type: 'string',
                },
            },
            required: ['key', 'kind'],
            type: 'object',
        },
        ConversationPin: {
            description: 'A private, durable bookmark with an authoritative saved excerpt.',
            properties: {
                createdAt: {
                    type: 'number',
                },
                excerpt: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                message: {
                    $ref: '#/definitions/ConversationMessageRef',
                },
                role: {
                    enum: ['assistant', 'user'],
                    type: 'string',
                },
                sessionId: {
                    type: 'string',
                },
                timestamp: {
                    type: 'number',
                },
                title: {
                    type: 'string',
                },
            },
            required: [
                'createdAt',
                'excerpt',
                'id',
                'message',
                'role',
                'sessionId',
                'timestamp',
                'title',
            ],
            type: 'object',
        },
        ConversationPinParams: {
            description: 'A message selected from an owned saved conversation.',
            properties: {
                id: {
                    type: 'string',
                },
                message: {
                    $ref: '#/definitions/ConversationMessageRef',
                },
            },
            required: ['id', 'message'],
            type: 'object',
        },
        ConversationPinsPage: {
            description:
                'A page of owned pins, with the continuation cursor if more records exist.',
            properties: {
                nextBefore: {
                    type: 'string',
                },
                pins: {
                    items: {
                        $ref: '#/definitions/ConversationPin',
                    },
                    type: 'array',
                },
            },
            required: ['pins'],
            type: 'object',
        },
        ConversationPinsParams: {
            description: 'Bounded newest-first bookmarks, with an opaque owned-record cursor.',
            properties: {
                before: {
                    type: 'string',
                },
                limit: {
                    type: 'number',
                },
            },
            type: 'object',
        },
        ConversationRenameParams: {
            description: 'Changes a title only if the editor still sees the current title.',
            properties: {
                expectedTitle: {
                    type: ['null', 'string'],
                },
                id: {
                    type: 'string',
                },
                title: {
                    type: 'string',
                },
            },
            required: ['expectedTitle', 'id', 'title'],
            type: 'object',
        },
        ConversationRetryParams: {
            description:
                'Edits a human prompt or repeats its response in a separate saved version.',
            properties: {
                id: {
                    type: 'string',
                },
                message: {
                    $ref: '#/definitions/ConversationMessageRef',
                },
                mode: {
                    enum: ['edit', 'regenerate'],
                    type: 'string',
                },
                reasoningEffort: {
                    enum: ['high', 'low', 'max', 'medium', 'minimal', 'off', 'xhigh'],
                    type: 'string',
                },
                requestId: {
                    type: 'string',
                },
                targetTimeSeconds: {
                    type: 'number',
                },
                text: {
                    type: 'string',
                },
            },
            required: ['id', 'message', 'mode', 'requestId'],
            type: 'object',
        },
        ConversationRetryResult: {
            description:
                'A saved version is returned even when its model run was already started by a lost acknowledgement.',
            properties: {
                session: {
                    $ref: '#/definitions/Flatten%3C%7Breadonlytitle%3Astring%7Cnull%3Breadonlyid%3Astring%3BreadonlyagentId%3Astring%3BreadonlycreatedAt%3Anumber%3BreadonlyupdatedAt%3Anumber%3BreadonlyconversationId%3Astring%7Cnull%3Breadonlyparticipants%3Areadonlystring%5B%5D%3BreadonlymessageCount%3Anumber%3Breadonlyusage%3ATokenUsage%3B%7D%26%7BreadonlytitleEdited%3F%3Aboolean%7Cundefined%3BreadonlyretrySourceId%3F%3Astring%7Cundefined%3BreadonlyretryRequestId%3F%3Astring%7Cundefined%3BreadonlyretryState%3F%3Astring%7Cundefined%3BreadonlyretryFingerprint%3F%3Astring%7Cundefined%3BreadonlyactiveToolFamilies%3F%3Areadonlystring%5B%5D%7Cundefined%3BreadonlyprojectId%3F%3Astring%7Cundefined%3BreadonlyuserId%3F%3Astring%7Cundefined%3BreadonlyworkspaceId%3F%3Astring%7Cundefined%3BreadonlyturnOpen%3F%3Aboolean%7Cundefined%3B%7D%3E',
                },
                started: {
                    type: 'boolean',
                },
                streamId: {
                    type: 'string',
                },
            },
            required: ['session', 'started', 'streamId'],
            type: 'object',
        },
        ConversationUnpinParams: {
            description:
                'Removes only a bookmark belonging to the current authenticated principal.',
            properties: {
                pinId: {
                    type: 'string',
                },
            },
            required: ['pinId'],
            type: 'object',
        },
        CreditScope: {
            description: 'The scopes a balance or budget can be defined over.',
            enum: ['agent', 'conversation', 'global', 'project', 'user'],
            type: 'string',
        },
        CreditSummary: {
            description: 'Spend totals over some slice of the ledger.',
            properties: {
                byCategory: {
                    $ref: '#/definitions/Record%3Cstring%2Cnumber%3E',
                    description:
                        'Missing on older authorities; other includes historical unclassified usage.',
                },
                byKind: {
                    $ref: '#/definitions/Record%3Cstring%2Cnumber%3E',
                    description:
                        'Totals split by charge kind, so "how much of this was voice" is answerable.',
                },
                byModel: {
                    $ref: '#/definitions/Record%3Cstring%2Cnumber%3E',
                    description: 'Totals split by model.',
                },
                cachedInputTokens: {
                    type: 'number',
                },
                entries: {
                    type: 'number',
                },
                from: {
                    type: 'number',
                },
                inputTokens: {
                    type: 'number',
                },
                microcents: {
                    type: 'number',
                },
                outputTokens: {
                    type: 'number',
                },
                scope: {
                    $ref: '#/definitions/CreditScope',
                },
                scopeId: {
                    type: 'string',
                },
                supportedWorkloads: {
                    description:
                        'Classified reports this authority accepts; absent on earlier deployments.',
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                to: {
                    type: 'number',
                },
            },
            required: [
                'byKind',
                'byModel',
                'cachedInputTokens',
                'entries',
                'from',
                'inputTokens',
                'microcents',
                'outputTokens',
                'scope',
                'scopeId',
                'to',
            ],
            type: 'object',
        },
        CreditSummaryParams: {
            description: 'A spend query.',
            properties: {
                from: {
                    type: 'number',
                },
                scope: {
                    description: 'The scopes a balance or budget can be defined over.',
                    enum: ['agent', 'conversation', 'global', 'project', 'user'],
                    type: 'string',
                },
                scopeId: {
                    type: 'string',
                },
                to: {
                    type: 'number',
                },
            },
            type: 'object',
        },
        DataFile: {
            description: 'A complete source file the agent can process directly in its workspace.',
            properties: {
                byteLength: {
                    type: 'string',
                },
                filename: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                path: {
                    type: 'string',
                },
            },
            required: ['byteLength', 'filename', 'id', 'path'],
            type: 'object',
        },
        DataUpload: {
            description: 'A disk-backed upload; byte counts use decimal strings on the wire.',
            properties: {
                byteLength: {
                    type: 'string',
                },
                filename: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
            },
            required: ['byteLength', 'filename', 'id'],
            type: 'object',
        },
        DataUploadChunkParams: {
            description: 'One bounded base64 chunk with an exact byte offset.',
            properties: {
                data: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                offset: {
                    type: 'string',
                },
            },
            required: ['data', 'id', 'offset'],
            type: 'object',
        },
        DataUploadIdParams: {
            description: 'Addresses an upload owned by the authenticated principal.',
            properties: {
                id: {
                    type: 'string',
                },
            },
            required: ['id'],
            type: 'object',
        },
        DataUploadPosition: {
            description: 'The durable position acknowledged after one bounded upload chunk.',
            properties: {
                id: {
                    type: 'string',
                },
                offset: {
                    type: 'string',
                },
            },
            required: ['id', 'offset'],
            type: 'object',
        },
        DataUploadStartParams: {
            description: 'Starts an upload without embedding source bytes in an agent request.',
            properties: {
                byteLength: {
                    type: 'string',
                },
                filename: {
                    type: 'string',
                },
            },
            required: ['byteLength', 'filename'],
            type: 'object',
        },
        DeadLetter: {
            description: 'One recorded failure.',
            properties: {
                agentId: {
                    description:
                        'The agent the route picked, or null when routing never got that far.',
                    type: ['null', 'string'],
                },
                at: {
                    type: 'number',
                },
                channel: {
                    type: 'string',
                },
                conversationId: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                messageId: {
                    type: 'string',
                },
                reason: {
                    type: 'string',
                },
                senderId: {
                    type: 'string',
                },
                sessionKey: {
                    type: ['null', 'string'],
                },
                stage: {
                    $ref: '#/definitions/DeadLetterStage',
                },
                text: {
                    description: 'Present only when the sink was built with `retainContent`.',
                    type: 'string',
                },
                textHash: {
                    description:
                        "SHA-256 of the message text, hex. See this file's comment for why it is not the text.",
                    type: 'string',
                },
                textLength: {
                    type: 'number',
                },
                threadId: {
                    type: 'string',
                },
            },
            required: [
                'agentId',
                'at',
                'channel',
                'conversationId',
                'id',
                'reason',
                'senderId',
                'sessionKey',
                'stage',
                'textHash',
                'textLength',
            ],
            type: 'object',
        },
        DeadLetterStage: {
            description: 'How far a message got before it failed.',
            enum: ['deliver', 'gate', 'route', 'turn'],
            type: 'string',
        },
        DeliveredAttachment: {
            description: 'A file delivered to an application through the gateway.',
            properties: {
                asFile: {
                    type: 'boolean',
                },
                byteLength: {
                    description: 'Size of the accompanying binary WebSocket payload.',
                    type: 'number',
                },
                description: {
                    type: 'string',
                },
                filename: {
                    type: 'string',
                },
                id: {
                    description:
                        'Stable delivery identifier shared by the event and terminal result.',
                    type: 'string',
                },
                mimeType: {
                    type: 'string',
                },
            },
            required: ['byteLength', 'filename', 'id', 'mimeType'],
            type: 'object',
        },
        DeliveryDestination: {
            description:
                'A destination excludes response tokens and distinguishes threaded conversations.',
            properties: {
                channel: {
                    type: 'string',
                },
                conversationId: {
                    type: 'string',
                },
                threadId: {
                    type: ['null', 'string'],
                },
            },
            required: ['channel', 'conversationId', 'threadId'],
            type: 'object',
        },
        DeliveryReceipt: {
            description:
                'Host receipt for the exact bytes submitted to an acknowledged channel send.',
            properties: {
                acknowledgment: {
                    $ref: '#/definitions/DeliveryDestination',
                },
                at: {
                    type: 'string',
                },
                byteLength: {
                    type: 'string',
                },
                destination: {
                    $ref: '#/definitions/DeliveryDestination',
                },
                filename: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                mediaId: {
                    type: ['null', 'string'],
                },
                messageId: {
                    type: ['null', 'string'],
                },
                mimeType: {
                    type: 'string',
                },
                path: {
                    type: ['null', 'string'],
                },
                revision: {
                    type: ['null', 'string'],
                },
                sessionId: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
                taskId: {
                    type: ['null', 'string'],
                },
                toolCallId: {
                    type: 'string',
                },
                turnId: {
                    type: ['null', 'string'],
                },
            },
            required: [
                'acknowledgment',
                'at',
                'byteLength',
                'destination',
                'filename',
                'id',
                'mediaId',
                'messageId',
                'mimeType',
                'path',
                'revision',
                'sessionId',
                'sha256',
                'taskId',
                'toolCallId',
                'turnId',
            ],
            type: 'object',
        },
        DesignAction: {
            description: 'Prototype actions.\nPrototype action.',
            enum: ['back', 'navigate', 'overlay'],
            type: 'string',
        },
        DesignAlign: {
            description: 'Alignment within the available layout space.\nAlignment choice.',
            enum: ['between', 'center', 'end', 'start', 'stretch'],
            type: 'string',
        },
        DesignBox: {
            description:
                'Resolved layout boxes are separate from authored values and never written back implicitly.',
            properties: {
                clipId: {
                    type: ['null', 'string'],
                },
                depth: {
                    type: 'number',
                },
                height: {
                    type: 'number',
                },
                id: {
                    type: 'string',
                },
                rotation: {
                    type: 'number',
                },
                width: {
                    type: 'number',
                },
                x: {
                    type: 'number',
                },
                y: {
                    type: 'number',
                },
            },
            required: ['clipId', 'depth', 'height', 'id', 'rotation', 'width', 'x', 'y'],
            type: 'object',
        },
        DesignChangesMethod: {
            description: 'Forward delta RPC contract.',
            properties: {
                params: {
                    $ref: '#/definitions/DesignChangesRequest',
                },
                result: {
                    $ref: '#/definitions/DesignRecordPage',
                },
            },
            required: ['params', 'result'],
            type: 'object',
        },
        DesignChangesRequest: {
            description: 'Changed entities exclude undo preimages.',
            properties: {
                commandId: {
                    type: 'string',
                },
                cursor: {
                    anyOf: [
                        {
                            $ref: '#/definitions/DesignCursor',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                id: {
                    type: 'string',
                },
                limit: {
                    type: 'number',
                },
            },
            required: ['commandId', 'cursor', 'id', 'limit'],
            type: 'object',
        },
        DesignComment: {
            description: 'Anchored comments can refer to exact layers or canvas coordinates.',
            properties: {
                author: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                nodeId: {
                    type: ['null', 'string'],
                },
                resolved: {
                    type: 'boolean',
                },
                text: {
                    type: 'string',
                },
                x: {
                    type: 'number',
                },
                y: {
                    type: 'number',
                },
            },
            required: ['author', 'id', 'nodeId', 'resolved', 'text', 'x', 'y'],
            type: 'object',
        },
        DesignCommentRecord: {
            description: 'Comment record.',
            properties: {
                id: {
                    type: 'string',
                },
                kind: {
                    const: 'comment',
                    type: 'string',
                },
                value: {
                    anyOf: [
                        {
                            $ref: '#/definitions/DesignComment',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
            },
            required: ['id', 'kind', 'value'],
            type: 'object',
        },
        DesignConstraint: {
            description:
                'Absolute children retain a chosen relation to a resized parent.\nConstraint choice.',
            enum: ['center', 'end', 'scale', 'start', 'stretch'],
            type: 'string',
        },
        DesignCorners: {
            description: 'Four independent corner radii, in clockwise order.',
            properties: {
                bottomLeft: {
                    type: 'number',
                },
                bottomRight: {
                    type: 'number',
                },
                topLeft: {
                    type: 'number',
                },
                topRight: {
                    type: 'number',
                },
            },
            required: ['bottomLeft', 'bottomRight', 'topLeft', 'topRight'],
            type: 'object',
        },
        DesignCreateMethod: {
            description: 'Create-document RPC contract.',
            properties: {
                params: {
                    $ref: '#/definitions/DesignCreateRequest',
                },
                result: {
                    $ref: '#/definitions/DesignReceipt',
                },
            },
            required: ['params', 'result'],
            type: 'object',
        },
        DesignCreateRequest: {
            description: 'Empty document creation is durable and idempotent.',
            properties: {
                commandId: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
            },
            required: ['commandId', 'id', 'name'],
            type: 'object',
        },
        DesignCursor: {
            description:
                'Record and UTF-16 character offsets allow large entities to remain bounded on the wire.',
            properties: {
                character: {
                    type: 'number',
                },
                record: {
                    type: 'number',
                },
            },
            required: ['character', 'record'],
            type: 'object',
        },
        DesignEventsMethod: {
            description: 'Revision-journal RPC contract.',
            properties: {
                params: {
                    $ref: '#/definitions/DesignEventsRequest',
                },
                result: {
                    $ref: '#/definitions/DesignEventsPage',
                },
            },
            required: ['params', 'result'],
            type: 'object',
        },
        DesignEventsPage: {
            description: 'A missed retained revision requires a fresh paged snapshot.',
            properties: {
                commits: {
                    items: {
                        $ref: '#/definitions/DesignReceipt',
                    },
                    type: 'array',
                },
                reset: {
                    type: 'boolean',
                },
                summary: {
                    $ref: '#/definitions/DesignSummary',
                },
            },
            required: ['commits', 'reset', 'summary'],
            type: 'object',
        },
        DesignEventsRequest: {
            description: 'Users and agents consume the same durable revision journal.',
            properties: {
                afterRevision: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                limit: {
                    type: 'number',
                },
            },
            required: ['afterRevision', 'id', 'limit'],
            type: 'object',
        },
        DesignFlow: {
            description: 'Free positioning and responsive container layouts.\nLayout direction.',
            enum: ['absolute', 'column', 'grid', 'row'],
            type: 'string',
        },
        DesignGradientStop: {
            description: 'Color stop in a normalized gradient.',
            properties: {
                color: {
                    type: 'string',
                },
                offset: {
                    type: 'number',
                },
            },
            required: ['color', 'offset'],
            type: 'object',
        },
        DesignImage: {
            description: 'Workspace image reference and crop transform.',
            properties: {
                assetId: {
                    type: 'string',
                },
                cropX: {
                    type: 'number',
                },
                cropY: {
                    type: 'number',
                },
                fit: {
                    $ref: '#/definitions/DesignImageFit',
                },
                scale: {
                    type: 'number',
                },
            },
            required: ['assetId', 'cropX', 'cropY', 'fit', 'scale'],
            type: 'object',
        },
        DesignImageFit: {
            description: 'Image scaling mode.',
            enum: ['contain', 'cover'],
            type: 'string',
        },
        DesignInsert: {
            description: 'Insert a standalone node at a precise location in a page or container.',
            properties: {
                index: {
                    type: 'number',
                },
                node: {
                    $ref: '#/definitions/DesignNode',
                },
                op: {
                    const: 'insert',
                    type: 'string',
                },
                pageId: {
                    type: 'string',
                },
                parentId: {
                    type: ['null', 'string'],
                },
            },
            required: ['index', 'node', 'op', 'pageId', 'parentId'],
            type: 'object',
        },
        DesignInsets: {
            description: 'Box padding.',
            properties: {
                bottom: {
                    type: 'number',
                },
                left: {
                    type: 'number',
                },
                right: {
                    type: 'number',
                },
                top: {
                    type: 'number',
                },
            },
            required: ['bottom', 'left', 'right', 'top'],
            type: 'object',
        },
        DesignInteraction: {
            description:
                'Click, hover and timed prototype links are independent of editable layout.',
            properties: {
                action: {
                    $ref: '#/definitions/DesignAction',
                },
                durationMs: {
                    type: 'number',
                },
                id: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
                targetId: {
                    type: 'string',
                },
                transition: {
                    $ref: '#/definitions/DesignTransition',
                },
                trigger: {
                    $ref: '#/definitions/DesignTrigger',
                },
            },
            required: ['action', 'durationMs', 'id', 'nodeId', 'targetId', 'transition', 'trigger'],
            type: 'object',
        },
        DesignInteractionRecord: {
            description: 'Prototype record.',
            properties: {
                id: {
                    type: 'string',
                },
                kind: {
                    const: 'interaction',
                    type: 'string',
                },
                value: {
                    anyOf: [
                        {
                            $ref: '#/definitions/DesignInteraction',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
            },
            required: ['id', 'kind', 'value'],
            type: 'object',
        },
        DesignKind: {
            description:
                'Editable scene primitives, including reusable component definitions and instances.\nPrimitive identity.',
            enum: [
                'component',
                'ellipse',
                'frame',
                'group',
                'image',
                'instance',
                'line',
                'path',
                'polygon',
                'rectangle',
                'text',
            ],
            type: 'string',
        },
        DesignLayout: {
            description: 'Container layout, including wrapping, grid tracks and content alignment.',
            properties: {
                align: {
                    $ref: '#/definitions/DesignAlign',
                },
                clip: {
                    type: 'boolean',
                },
                columns: {
                    type: 'number',
                },
                flow: {
                    $ref: '#/definitions/DesignFlow',
                },
                gap: {
                    type: 'number',
                },
                justify: {
                    $ref: '#/definitions/DesignAlign',
                },
                padding: {
                    $ref: '#/definitions/DesignInsets',
                },
                rowGap: {
                    type: 'number',
                },
                wrap: {
                    type: 'boolean',
                },
            },
            required: [
                'align',
                'clip',
                'columns',
                'flow',
                'gap',
                'justify',
                'padding',
                'rowGap',
                'wrap',
            ],
            type: 'object',
        },
        DesignLayoutMethod: {
            description: 'Computed-geometry RPC contract.',
            properties: {
                params: {
                    $ref: '#/definitions/DesignLayoutRequest',
                },
                result: {
                    $ref: '#/definitions/DesignLayoutPage',
                },
            },
            required: ['params', 'result'],
            type: 'object',
        },
        DesignLayoutPage: {
            description: 'Native geometry uses the same layout engine as the canvas.',
            properties: {
                boxes: {
                    items: {
                        $ref: '#/definitions/DesignBox',
                    },
                    type: 'array',
                },
                nextOffset: {
                    type: ['null', 'number'],
                },
                summary: {
                    $ref: '#/definitions/DesignSummary',
                },
            },
            required: ['boxes', 'nextOffset', 'summary'],
            type: 'object',
        },
        DesignLayoutRequest: {
            description: 'Agent geometry inspection is revision-pinned and separately paged.',
            properties: {
                id: {
                    type: 'string',
                },
                limit: {
                    type: 'number',
                },
                offset: {
                    type: 'number',
                },
                pageId: {
                    type: 'string',
                },
                revision: {
                    type: 'string',
                },
            },
            required: ['id', 'limit', 'offset', 'pageId', 'revision'],
            type: 'object',
        },
        DesignListMethod: {
            description: 'Owner-scoped library RPC contract.',
            properties: {
                params: {
                    $ref: '#/definitions/DesignListRequest',
                },
                result: {
                    $ref: '#/definitions/DesignListPage',
                },
            },
            required: ['params', 'result'],
            type: 'object',
        },
        DesignListPage: {
            description: 'Bounded library page.',
            properties: {
                items: {
                    items: {
                        $ref: '#/definitions/DesignSummary',
                    },
                    type: 'array',
                },
                nextAfter: {
                    type: ['null', 'string'],
                },
            },
            required: ['items', 'nextAfter'],
            type: 'object',
        },
        DesignListRequest: {
            description: 'Owner-scoped document listing.',
            properties: {
                after: {
                    type: ['null', 'string'],
                },
                limit: {
                    type: 'number',
                },
            },
            required: ['after', 'limit'],
            type: 'object',
        },
        DesignMetadata: {
            description:
                'Document properties and supporting design-system or collaboration records.',
            properties: {
                comments: {
                    items: {
                        $ref: '#/definitions/DesignComment',
                    },
                    type: 'array',
                },
                interactions: {
                    items: {
                        $ref: '#/definitions/DesignInteraction',
                    },
                    type: 'array',
                },
                name: {
                    type: 'string',
                },
                op: {
                    const: 'metadata',
                    type: 'string',
                },
                tokens: {
                    items: {
                        $ref: '#/definitions/DesignToken',
                    },
                    type: 'array',
                },
            },
            required: ['op'],
            type: 'object',
        },
        DesignMove: {
            description: 'Reparent or reorder without breaking both sides of the tree.',
            properties: {
                id: {
                    type: 'string',
                },
                index: {
                    type: 'number',
                },
                op: {
                    const: 'move',
                    type: 'string',
                },
                pageId: {
                    type: 'string',
                },
                parentId: {
                    type: ['null', 'string'],
                },
            },
            required: ['id', 'index', 'op', 'pageId', 'parentId'],
            type: 'object',
        },
        DesignNode: {
            description:
                'All layer state is explicit and editable; no generated markup is the source of truth.',
            properties: {
                children: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                componentId: {
                    type: ['null', 'string'],
                },
                height: {
                    type: 'number',
                },
                id: {
                    type: 'string',
                },
                image: {
                    anyOf: [
                        {
                            $ref: '#/definitions/DesignImage',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                kind: {
                    $ref: '#/definitions/DesignKind',
                },
                layout: {
                    $ref: '#/definitions/DesignLayout',
                },
                locked: {
                    type: 'boolean',
                },
                name: {
                    type: 'string',
                },
                opacity: {
                    type: 'number',
                },
                overrides: {
                    items: {
                        $ref: '#/definitions/DesignOverride',
                    },
                    type: 'array',
                },
                parentId: {
                    type: ['null', 'string'],
                },
                path: {
                    items: {
                        $ref: '#/definitions/DesignPathCommand',
                    },
                    type: 'array',
                },
                placement: {
                    $ref: '#/definitions/DesignPlacement',
                },
                rotation: {
                    type: 'number',
                },
                style: {
                    $ref: '#/definitions/DesignStyle',
                },
                text: {
                    anyOf: [
                        {
                            $ref: '#/definitions/DesignText',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                visible: {
                    type: 'boolean',
                },
                width: {
                    type: 'number',
                },
                x: {
                    type: 'number',
                },
                y: {
                    type: 'number',
                },
            },
            required: [
                'children',
                'componentId',
                'height',
                'id',
                'image',
                'kind',
                'layout',
                'locked',
                'name',
                'opacity',
                'overrides',
                'parentId',
                'path',
                'placement',
                'rotation',
                'style',
                'text',
                'visible',
                'width',
                'x',
                'y',
            ],
            type: 'object',
        },
        DesignNodeChanges: {
            description:
                'Editable properties exclude identity and tree links, which have dedicated operations.',
            properties: {
                componentId: {
                    type: ['null', 'string'],
                },
                height: {
                    type: 'number',
                },
                image: {
                    anyOf: [
                        {
                            $ref: '#/definitions/DesignImage',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                kind: {
                    description:
                        'Editable scene primitives, including reusable component definitions and instances.\nPrimitive identity.',
                    enum: [
                        'component',
                        'ellipse',
                        'frame',
                        'group',
                        'image',
                        'instance',
                        'line',
                        'path',
                        'polygon',
                        'rectangle',
                        'text',
                    ],
                    type: 'string',
                },
                layout: {
                    $ref: '#/definitions/DesignLayout',
                    description:
                        'Container layout, including wrapping, grid tracks and content alignment.',
                },
                locked: {
                    type: 'boolean',
                },
                name: {
                    type: 'string',
                },
                opacity: {
                    type: 'number',
                },
                overrides: {
                    items: {
                        $ref: '#/definitions/DesignOverride',
                    },
                    type: 'array',
                },
                path: {
                    items: {
                        $ref: '#/definitions/DesignPathCommand',
                    },
                    type: 'array',
                },
                placement: {
                    $ref: '#/definitions/DesignPlacement',
                    description: 'Child sizing and positioning relative to its parent.',
                },
                rotation: {
                    type: 'number',
                },
                style: {
                    $ref: '#/definitions/DesignStyle',
                    description: 'Style can be shared across arbitrary primitives.',
                },
                text: {
                    anyOf: [
                        {
                            $ref: '#/definitions/DesignText',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                visible: {
                    type: 'boolean',
                },
                width: {
                    type: 'number',
                },
                x: {
                    type: 'number',
                },
                y: {
                    type: 'number',
                },
            },
            type: 'object',
        },
        DesignNodeRecord: {
            description: 'Layer record.',
            properties: {
                id: {
                    type: 'string',
                },
                kind: {
                    const: 'node',
                    type: 'string',
                },
                value: {
                    anyOf: [
                        {
                            $ref: '#/definitions/DesignNode',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
            },
            required: ['id', 'kind', 'value'],
            type: 'object',
        },
        DesignOperation: {
            anyOf: [
                {
                    $ref: '#/definitions/DesignInsert',
                },
                {
                    $ref: '#/definitions/DesignUpdate',
                },
                {
                    $ref: '#/definitions/DesignMove',
                },
                {
                    $ref: '#/definitions/DesignRemove',
                },
                {
                    $ref: '#/definitions/DesignPageOperation',
                },
                {
                    $ref: '#/definitions/DesignMetadata',
                },
            ],
            description: 'A transaction can contain different operation types.',
        },
        DesignOverride: {
            description:
                'Instance overrides target a source layer without modifying its component definition.',
            properties: {
                name: {
                    type: ['null', 'string'],
                },
                nodeId: {
                    type: 'string',
                },
                style: {
                    anyOf: [
                        {
                            $ref: '#/definitions/DesignStyle',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                text: {
                    type: ['null', 'string'],
                },
                visible: {
                    type: ['null', 'boolean'],
                },
            },
            required: ['name', 'nodeId', 'style', 'text', 'visible'],
            type: 'object',
        },
        DesignPage: {
            description: 'A page has its own root layers and viewport.',
            properties: {
                background: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
                roots: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
            },
            required: ['background', 'id', 'name', 'roots'],
            type: 'object',
        },
        DesignPageOperation: {
            description:
                'Create, rename or remove a page. Root lists are managed by tree operations.',
            properties: {
                background: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                name: {
                    type: ['null', 'string'],
                },
                op: {
                    const: 'page',
                    type: 'string',
                },
            },
            required: ['background', 'id', 'name', 'op'],
            type: 'object',
        },
        DesignPageRecord: {
            description: 'Page record.',
            properties: {
                id: {
                    type: 'string',
                },
                kind: {
                    const: 'page',
                    type: 'string',
                },
                value: {
                    anyOf: [
                        {
                            $ref: '#/definitions/DesignPage',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
            },
            required: ['id', 'kind', 'value'],
            type: 'object',
        },
        DesignPaint: {
            description: 'Layer paint. Colors are validated hex values, never arbitrary CSS.',
            properties: {
                angle: {
                    type: 'number',
                },
                assetId: {
                    type: ['null', 'string'],
                },
                color: {
                    type: 'string',
                },
                kind: {
                    $ref: '#/definitions/DesignPaintKind',
                },
                opacity: {
                    type: 'number',
                },
                stops: {
                    items: {
                        $ref: '#/definitions/DesignGradientStop',
                    },
                    type: 'array',
                },
                tokenId: {
                    type: ['null', 'string'],
                },
            },
            required: ['angle', 'assetId', 'color', 'kind', 'opacity', 'stops', 'tokenId'],
            type: 'object',
        },
        DesignPaintKind: {
            description:
                'Supported paint sources. Image assets use workspace references.\nPaint kind.',
            enum: ['image', 'linear', 'radial', 'solid'],
            type: 'string',
        },
        DesignPathCommand: {
            description: 'A vector instruction in layer-local coordinates.',
            properties: {
                values: {
                    items: {
                        type: 'number',
                    },
                    type: 'array',
                },
                verb: {
                    $ref: '#/definitions/DesignPathVerb',
                },
            },
            required: ['values', 'verb'],
            type: 'object',
        },
        DesignPathVerb: {
            description:
                'Path verbs use explicit coordinates; cubic curves are preserved as editable geometry.\nVector path verb.',
            enum: ['C', 'L', 'M', 'Q', 'Z'],
            type: 'string',
        },
        DesignPlacement: {
            description: 'Child sizing and positioning relative to its parent.',
            properties: {
                absolute: {
                    type: 'boolean',
                },
                columnSpan: {
                    type: 'number',
                },
                height: {
                    $ref: '#/definitions/DesignSizing',
                },
                horizontal: {
                    $ref: '#/definitions/DesignConstraint',
                },
                maxHeight: {
                    type: 'number',
                },
                maxWidth: {
                    type: 'number',
                },
                minHeight: {
                    type: 'number',
                },
                minWidth: {
                    type: 'number',
                },
                rowSpan: {
                    type: 'number',
                },
                vertical: {
                    $ref: '#/definitions/DesignConstraint',
                },
                width: {
                    $ref: '#/definitions/DesignSizing',
                },
            },
            required: [
                'absolute',
                'columnSpan',
                'height',
                'horizontal',
                'maxHeight',
                'maxWidth',
                'minHeight',
                'minWidth',
                'rowSpan',
                'vertical',
                'width',
            ],
            type: 'object',
        },
        DesignReadMethod: {
            description: 'Bounded snapshot RPC contract.',
            properties: {
                params: {
                    $ref: '#/definitions/DesignReadRequest',
                },
                result: {
                    $ref: '#/definitions/DesignRecordPage',
                },
            },
            required: ['params', 'result'],
            type: 'object',
        },
        DesignReadRequest: {
            description:
                'Strictly revision-pinned pagination prevents merging chunks from different documents.',
            properties: {
                cursor: {
                    anyOf: [
                        {
                            $ref: '#/definitions/DesignCursor',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                id: {
                    type: 'string',
                },
                limit: {
                    type: 'number',
                },
                revision: {
                    type: ['null', 'string'],
                },
            },
            required: ['cursor', 'id', 'limit', 'revision'],
            type: 'object',
        },
        DesignReceipt: {
            description: 'Commit acknowledgements contain no large text or scene snapshot.',
            properties: {
                actor: {
                    type: 'string',
                },
                commandId: {
                    type: 'string',
                },
                previousRevision: {
                    type: ['null', 'string'],
                },
                summary: {
                    $ref: '#/definitions/DesignSummary',
                },
                undoable: {
                    type: 'boolean',
                },
            },
            required: ['actor', 'commandId', 'previousRevision', 'summary', 'undoable'],
            type: 'object',
        },
        DesignRecord: {
            anyOf: [
                {
                    $ref: '#/definitions/DesignNodeRecord',
                },
                {
                    $ref: '#/definitions/DesignPageRecord',
                },
                {
                    $ref: '#/definitions/DesignTokenRecord',
                },
                {
                    $ref: '#/definitions/DesignInteractionRecord',
                },
                {
                    $ref: '#/definitions/DesignCommentRecord',
                },
            ],
            description: 'One complete entity, or a tombstone in a delta page.',
        },
        DesignRecordFragment: {
            description:
                'Large records use contiguous fragments, decoded only after complete assembly.',
            properties: {
                id: {
                    type: 'string',
                },
                kind: {
                    $ref: '#/definitions/DesignRecordKind',
                },
                offset: {
                    type: 'number',
                },
                text: {
                    type: 'string',
                },
                total: {
                    type: 'number',
                },
            },
            required: ['id', 'kind', 'offset', 'text', 'total'],
            type: 'object',
        },
        DesignRecordKind: {
            description: 'Scene entities have independent transport identities.\nEntity family.',
            enum: ['comment', 'interaction', 'node', 'page', 'token'],
            type: 'string',
        },
        DesignRecordPage: {
            description: 'Independently bounded entity page with at most one partial record.',
            properties: {
                fragment: {
                    anyOf: [
                        {
                            $ref: '#/definitions/DesignRecordFragment',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                nextCursor: {
                    anyOf: [
                        {
                            $ref: '#/definitions/DesignCursor',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                records: {
                    items: {
                        $ref: '#/definitions/DesignRecord',
                    },
                    type: 'array',
                },
                summary: {
                    $ref: '#/definitions/DesignSummary',
                },
            },
            required: ['fragment', 'nextCursor', 'records', 'summary'],
            type: 'object',
        },
        DesignRemove: {
            description: 'Delete a subtree and its anchored comments and prototype links.',
            properties: {
                id: {
                    type: 'string',
                },
                op: {
                    const: 'remove',
                    type: 'string',
                },
            },
            required: ['id', 'op'],
            type: 'object',
        },
        DesignSaveMethod: {
            description: 'Atomic editing RPC contract.',
            properties: {
                params: {
                    $ref: '#/definitions/DesignSaveRequest',
                },
                result: {
                    $ref: '#/definitions/DesignReceipt',
                },
            },
            required: ['params', 'result'],
            type: 'object',
        },
        DesignSaveRequest: {
            description: 'Patch uses optimistic concurrency and a durable retry identity.',
            properties: {
                commandId: {
                    type: 'string',
                },
                expectedRevision: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                operations: {
                    items: {
                        $ref: '#/definitions/DesignOperation',
                    },
                    type: 'array',
                },
            },
            required: ['commandId', 'expectedRevision', 'id', 'operations'],
            type: 'object',
        },
        DesignShadow: {
            description: 'Drop or inner shadow.',
            properties: {
                blur: {
                    type: 'number',
                },
                color: {
                    type: 'string',
                },
                inner: {
                    type: 'boolean',
                },
                spread: {
                    type: 'number',
                },
                x: {
                    type: 'number',
                },
                y: {
                    type: 'number',
                },
            },
            required: ['blur', 'color', 'inner', 'spread', 'x', 'y'],
            type: 'object',
        },
        DesignSizing: {
            description: 'Sizing relative to the parent and content.\nSizing choice.',
            enum: ['fill', 'fixed', 'hug'],
            type: 'string',
        },
        DesignStroke: {
            description: 'Outline properties.',
            properties: {
                dash: {
                    items: {
                        type: 'number',
                    },
                    type: 'array',
                },
                paint: {
                    $ref: '#/definitions/DesignPaint',
                },
                width: {
                    type: 'number',
                },
            },
            required: ['dash', 'paint', 'width'],
            type: 'object',
        },
        DesignStyle: {
            description: 'Style can be shared across arbitrary primitives.',
            properties: {
                blur: {
                    type: 'number',
                },
                corners: {
                    $ref: '#/definitions/DesignCorners',
                },
                fills: {
                    items: {
                        $ref: '#/definitions/DesignPaint',
                    },
                    type: 'array',
                },
                shadows: {
                    items: {
                        $ref: '#/definitions/DesignShadow',
                    },
                    type: 'array',
                },
                stroke: {
                    anyOf: [
                        {
                            $ref: '#/definitions/DesignStroke',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
            },
            required: ['blur', 'corners', 'fills', 'shadows', 'stroke'],
            type: 'object',
        },
        DesignSummary: {
            description:
                'Tiny management projection. Timestamps and revisions retain full integer precision.',
            properties: {
                id: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
                nodeCount: {
                    type: 'number',
                },
                pageCount: {
                    type: 'number',
                },
                revision: {
                    type: 'string',
                },
                updatedAt: {
                    type: 'string',
                },
            },
            required: ['id', 'name', 'nodeCount', 'pageCount', 'revision', 'updatedAt'],
            type: 'object',
        },
        DesignText: {
            description: 'Text layout is shared by the canvas, tools and exported designs.',
            properties: {
                align: {
                    $ref: '#/definitions/DesignAlign',
                },
                content: {
                    type: 'string',
                },
                family: {
                    type: 'string',
                },
                italic: {
                    type: 'boolean',
                },
                letterSpacing: {
                    type: 'number',
                },
                lineHeight: {
                    type: 'number',
                },
                runs: {
                    items: {
                        $ref: '#/definitions/DesignTextRun',
                    },
                    type: 'array',
                },
                size: {
                    type: 'number',
                },
                weight: {
                    type: 'number',
                },
            },
            required: [
                'align',
                'content',
                'family',
                'italic',
                'letterSpacing',
                'lineHeight',
                'runs',
                'size',
                'weight',
            ],
            type: 'object',
        },
        DesignTextRun: {
            description: "Rich text range. Offsets are UTF-16 indices into the layer's text.",
            properties: {
                color: {
                    type: 'string',
                },
                end: {
                    type: 'number',
                },
                family: {
                    type: 'string',
                },
                italic: {
                    type: 'boolean',
                },
                size: {
                    type: 'number',
                },
                start: {
                    type: 'number',
                },
                underline: {
                    type: 'boolean',
                },
                weight: {
                    type: 'number',
                },
            },
            required: ['color', 'end', 'family', 'italic', 'size', 'start', 'underline', 'weight'],
            type: 'object',
        },
        DesignToken: {
            description: 'Named design-system values.',
            properties: {
                category: {
                    $ref: '#/definitions/DesignTokenCategory',
                },
                id: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
                value: {
                    type: 'string',
                },
            },
            required: ['category', 'id', 'name', 'value'],
            type: 'object',
        },
        DesignTokenCategory: {
            description: 'Token families.\nToken family.',
            enum: ['color', 'spacing', 'typography'],
            type: 'string',
        },
        DesignTokenRecord: {
            description: 'Token record.',
            properties: {
                id: {
                    type: 'string',
                },
                kind: {
                    const: 'token',
                    type: 'string',
                },
                value: {
                    anyOf: [
                        {
                            $ref: '#/definitions/DesignToken',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
            },
            required: ['id', 'kind', 'value'],
            type: 'object',
        },
        DesignTransition: {
            description: 'Prototype transitions.\nPrototype transition.',
            enum: ['dissolve', 'instant', 'slide'],
            type: 'string',
        },
        DesignTrigger: {
            description: 'Prototype triggers.\nPrototype trigger.',
            enum: ['after', 'click', 'hover'],
            type: 'string',
        },
        DesignUndoMethod: {
            description: 'Conflict-safe undo RPC contract.',
            properties: {
                params: {
                    $ref: '#/definitions/DesignUndoRequest',
                },
                result: {
                    $ref: '#/definitions/DesignReceipt',
                },
            },
            required: ['params', 'result'],
            type: 'object',
        },
        DesignUndoRequest: {
            description:
                'Undo names the committed transaction rather than accepting an untrusted state snapshot.',
            properties: {
                commandId: {
                    type: 'string',
                },
                expectedRevision: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                targetCommandId: {
                    type: 'string',
                },
            },
            required: ['commandId', 'expectedRevision', 'id', 'targetCommandId'],
            type: 'object',
        },
        DesignUpdate: {
            description: 'Update only chosen properties, preserving unrelated edits.',
            properties: {
                changes: {
                    $ref: '#/definitions/DesignNodeChanges',
                },
                id: {
                    type: 'string',
                },
                op: {
                    const: 'update',
                    type: 'string',
                },
            },
            required: ['changes', 'id', 'op'],
            type: 'object',
        },
        DeviceApproveParams: {
            description: 'Approving a device, optionally overriding the scopes it asked for.',
            properties: {
                requestId: {
                    type: 'string',
                },
                scopes: {
                    description:
                        'Absent grants exactly what the device requested. A list here REPLACES that, and may widen it.\n\nStated plainly because the previous wording ("may only NARROW it") was false of every\nimplementation: `MemoryPairingStore.approve` does `grant(..., scopes ?? requestedScopes)` and\nnever compares the two. Widening is the intended behaviour and not an oversight — a device\nthat sends no `x-nexa-scopes` header is recorded as requesting `read`, which is every client\nthat has not been told otherwise, so a narrow-only rule would make it impossible to pair your\nown laptop as an admin without first re-pairing it with a hand-set header.\n\nIt is not a privilege escalation BY the device: `devices.approve` requires `admin`, so the\nonly party that can widen a grant is one that already holds everything it is granting.',
                    items: {
                        $ref: '#/definitions/Scope',
                    },
                    type: 'array',
                },
            },
            required: ['requestId'],
            type: 'object',
        },
        DeviceApproveResult: {
            description: 'What `devices.approve` hands back. The token is plaintext exactly once.',
            properties: {
                device: {
                    $ref: '#/definitions/DeviceInfo',
                },
                token: {
                    type: 'string',
                },
            },
            required: ['device', 'token'],
            type: 'object',
        },
        DeviceInfo: {
            description: 'A paired device, without the credential.',
            properties: {
                approvedAt: {
                    type: 'number',
                },
                deviceId: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
                principalId: {
                    type: 'string',
                },
                scopes: {
                    items: {
                        $ref: '#/definitions/Scope',
                    },
                    type: 'array',
                },
            },
            required: ['approvedAt', 'deviceId', 'name', 'scopes'],
            type: 'object',
        },
        DeviceListResult: {
            description:
                'The device roster: what is paired and what is asking to be.\n\nOne method for both halves because they are one screen and one decision — an operator looking at\na pending request needs to see whether that device is already paired under another name, and two\nround trips to find out is two chances for the two lists to be read from different moments.',
            properties: {
                approved: {
                    items: {
                        $ref: '#/definitions/DeviceInfo',
                    },
                    type: 'array',
                },
                pending: {
                    items: {
                        $ref: '#/definitions/DeviceRequestInfo',
                    },
                    type: 'array',
                },
            },
            required: ['approved', 'pending'],
            type: 'object',
        },
        DeviceRefParams: {
            description: 'Names a device.',
            properties: {
                deviceId: {
                    type: 'string',
                },
            },
            required: ['deviceId'],
            type: 'object',
        },
        DeviceRequestInfo: {
            description: 'A device waiting for an operator, as it appears on the wire.',
            properties: {
                createdAt: {
                    type: 'number',
                },
                deviceId: {
                    type: 'string',
                },
                expiresAt: {
                    type: 'number',
                },
                name: {
                    type: 'string',
                },
                remoteAddress: {
                    type: 'string',
                },
                requestId: {
                    type: 'string',
                },
                requestedScopes: {
                    items: {
                        $ref: '#/definitions/Scope',
                    },
                    type: 'array',
                },
            },
            required: [
                'createdAt',
                'deviceId',
                'expiresAt',
                'name',
                'remoteAddress',
                'requestId',
                'requestedScopes',
            ],
            type: 'object',
        },
        ErrorCode: {
            description: 'A stable, machine-readable failure classification.',
            enum: [
                'aborted',
                'auth',
                'budget-exhausted',
                'config',
                'context-overflow',
                'delivery-unconfirmed',
                'denied',
                'forbidden',
                'internal',
                'invalid-request',
                'network',
                'not-found',
                'protocol',
                'rate-limit',
                'timeout',
                'tool-execution',
                'tool-input',
                'upstream',
            ],
            type: 'string',
        },
        Exclude: {
            enum: ['reasoning', 'text'],
            type: 'string',
        },
        Exclude_1: {
            enum: [
                'audio',
                'boolean',
                'datetime',
                'file',
                'flow',
                'image',
                'integer',
                'json',
                'message',
                'number',
                'table',
                'text',
                'timestamp',
                'video',
            ],
            type: 'string',
        },
        FinishReason: {
            description: 'Why a turn stopped.',
            enum: [
                'aborted',
                'error',
                'length',
                'refusal',
                'stop',
                'stop-sequence',
                'tool-use',
                'unknown',
            ],
            type: 'string',
        },
        'Flatten<{readonlytitle:string|null;readonlyid:string;readonlyagentId:string;readonlycreatedAt:number;readonlyupdatedAt:number;readonlyconversationId:string|null;readonlyparticipants:readonlystring[];readonlymessageCount:number;readonlyusage:TokenUsage;}&{readonlytitleEdited?:boolean|undefined;readonlyretrySourceId?:string|undefined;readonlyretryRequestId?:string|undefined;readonlyretryState?:string|undefined;readonlyretryFingerprint?:string|undefined;readonlyactiveToolFamilies?:readonlystring[]|undefined;readonlyprojectId?:string|undefined;readonlyuserId?:string|undefined;readonlyworkspaceId?:string|undefined;readonlyturnOpen?:boolean|undefined;}>':
            {
                description:
                    'Collapses the required/optional intersection into one object type.\n\nHomomorphic (`in keyof T` over a naked type parameter), so `readonly` and `?` are carried through\nrather than flattened away — without it every derived type would lose its modifiers and a caller\ncould assign to a field the store treats as immutable.',
                properties: {
                    activeToolFamilies: {
                        items: {
                            type: 'string',
                        },
                        type: 'array',
                    },
                    agentId: {
                        type: 'string',
                    },
                    conversationId: {
                        type: ['null', 'string'],
                    },
                    createdAt: {
                        type: 'number',
                    },
                    id: {
                        type: 'string',
                    },
                    messageCount: {
                        type: 'number',
                    },
                    participants: {
                        items: {
                            type: 'string',
                        },
                        type: 'array',
                    },
                    projectId: {
                        type: 'string',
                    },
                    retryFingerprint: {
                        type: 'string',
                    },
                    retryRequestId: {
                        type: 'string',
                    },
                    retrySourceId: {
                        type: 'string',
                    },
                    retryState: {
                        type: 'string',
                    },
                    title: {
                        type: ['null', 'string'],
                    },
                    titleEdited: {
                        type: 'boolean',
                    },
                    turnOpen: {
                        type: 'boolean',
                    },
                    updatedAt: {
                        type: 'number',
                    },
                    usage: {
                        $ref: '#/definitions/TokenUsage',
                    },
                    userId: {
                        type: 'string',
                    },
                    workspaceId: {
                        type: 'string',
                    },
                },
                required: [
                    'agentId',
                    'conversationId',
                    'createdAt',
                    'id',
                    'messageCount',
                    'participants',
                    'title',
                    'updatedAt',
                    'usage',
                ],
                type: 'object',
            },
        FunnelCohort: {
            description:
                'Exact cohort dimensions; games are already separated by owner/project in storage.',
            properties: {
                configRevision: {
                    type: 'string',
                },
                device: {
                    type: 'string',
                },
                experimentId: {
                    type: 'string',
                },
                observedConfig: {
                    type: 'string',
                },
                observedPerformance: {
                    type: 'string',
                },
                placeId: {
                    type: 'string',
                },
                placeVersion: {
                    type: 'string',
                },
                variant: {
                    type: 'string',
                },
            },
            required: [
                'configRevision',
                'device',
                'experimentId',
                'placeId',
                'placeVersion',
                'variant',
            ],
            type: 'object',
        },
        FunnelGroup: {
            description:
                'Bounded attempt counts, not unique users; each stage count is cumulative from the first step.',
            properties: {
                attempts: {
                    type: 'number',
                },
                cohort: {
                    $ref: '#/definitions/FunnelCohort',
                },
                conversion: {
                    type: 'number',
                },
                reached: {
                    items: {
                        type: 'number',
                    },
                    type: 'array',
                },
                sessions: {
                    type: 'number',
                },
            },
            required: ['attempts', 'cohort', 'conversion', 'reached', 'sessions'],
            type: 'object',
        },
        FunnelQuery: {
            description:
                'First-step cohort window and maximum allowed time to complete a funnel. Decimal milliseconds.',
            properties: {
                appliedConfigKey: {
                    type: 'string',
                },
                completionWindowMs: {
                    type: 'string',
                },
                configLookbackMs: {
                    type: 'string',
                },
                fromMs: {
                    type: 'string',
                },
                performanceFpsThreshold: {
                    type: 'number',
                },
                performanceLookbackMs: {
                    type: 'string',
                },
                steps: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                toMs: {
                    type: 'string',
                },
            },
            required: ['completionWindowMs', 'fromMs', 'steps', 'toMs'],
            type: 'object',
        },
        FunnelReport: {
            description:
                'Evidence returned to the model; raw player/session identifiers are not included.',
            properties: {
                caveats: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                collection: {
                    $ref: '#/definitions/TelemetryHealth',
                    description:
                        'Owner-visible collection evidence, not a guarantee that the game emitted every required event.',
                },
                duplicateEvents: {
                    type: 'number',
                },
                generatedAtMs: {
                    type: 'string',
                },
                groups: {
                    items: {
                        $ref: '#/definitions/FunnelGroup',
                    },
                    type: 'array',
                },
                ignoredClientEvents: {
                    type: 'number',
                },
                latestMatchingEventMs: {
                    type: ['null', 'string'],
                },
                missingAttemptEvents: {
                    type: 'number',
                },
                missingStartAttempts: {
                    type: 'number',
                },
                mixedCohortAttempts: {
                    type: 'number',
                },
                observedUntilMs: {
                    type: 'string',
                },
                pendingAttempts: {
                    type: 'number',
                },
                query: {
                    $ref: '#/definitions/FunnelQuery',
                },
                repeatedStartEvents: {
                    type: 'number',
                },
                unattributedConfigAttempts: {
                    type: 'number',
                },
                unmeasuredPerformanceAttempts: {
                    type: 'number',
                },
            },
            required: [
                'caveats',
                'duplicateEvents',
                'generatedAtMs',
                'groups',
                'ignoredClientEvents',
                'latestMatchingEventMs',
                'missingAttemptEvents',
                'missingStartAttempts',
                'mixedCohortAttempts',
                'observedUntilMs',
                'pendingAttempts',
                'query',
                'repeatedStartEvents',
            ],
            type: 'object',
        },
        GatewayFeatures: {
            description: 'Methods, events, and additive capabilities supported by this gateway.',
            properties: {
                attachments: {
                    const: true,
                    description: 'User media attachments are validated and forwarded to the agent.',
                    type: 'boolean',
                },
                binaryMedia: {
                    const: true,
                    description:
                        'NXMD frames carry outbound file bytes; JSON results contain matching metadata.',
                    type: 'boolean',
                },
                events: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                methodScopes: {
                    $ref: '#/definitions/Record%3Cstring%2CScope%3E',
                    description:
                        "The scope each method requires.\n\nSent because the alternative is every client shipping its own copy of the server's\nauthorization table, which then drifts: a UI that greys out the wrong button is a support\nticket, and one that offers a button the server refuses is worse.",
                },
                methods: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                officeAppearance: {
                    const: true,
                    description: 'Stable employee cosmetics in NGOP v7.',
                    type: 'boolean',
                },
                officeCompany: {
                    const: true,
                    description: 'NCO2 persistent company staffing and project briefs.',
                    type: 'boolean',
                },
                officeCompanyLimits: {
                    const: true,
                    description:
                        'Private company-wide funding and capacity over the existing connection.',
                    type: 'boolean',
                },
                officeCompanyUpdates: {
                    const: true,
                    description: 'Ordered private company subscriptions over the existing socket.',
                    type: 'boolean',
                },
                officeConstruction: {
                    const: true,
                    description: 'NCMP v4 owner construction and NGOP v5 public floor plans.',
                    type: 'boolean',
                },
                officeDepartmentKnowledge: {
                    const: true,
                    description: 'Private owner-reviewed department knowledge.',
                    type: 'boolean',
                },
                officeDepartmentTools: {
                    const: true,
                    description:
                        'NCO2 version two carries owner-approved department tool ceilings.',
                    type: 'boolean',
                },
                officeDeskAssignments: {
                    const: true,
                    description: 'Accepts NGOP v4 with saved visual desk assignments.',
                    type: 'boolean',
                },
                officeDeskPositions: {
                    const: true,
                    description: 'Saved physical workstation positions in NGOP v8 and NCMP v8.',
                    type: 'boolean',
                },
                officeEmployeeCosts: {
                    const: true,
                    description:
                        'Private employee results include exact original-attempt ledger costs.',
                    type: 'boolean',
                },
                officeEmployeeDevelopment: {
                    const: true,
                    description:
                        'NCE1 version 4 supplies evidence-based accepted delivery history on the private owner channel.',
                    type: 'boolean',
                },
                officeEmployeeResults: {
                    const: true,
                    description:
                        'Read-only employee evidence on the existing private office connection.',
                    type: 'boolean',
                },
                officeExecution: {
                    const: true,
                    description: 'Scheduler workload summaries in NGOP v6.',
                    type: 'boolean',
                },
                officeExecutionHosts: {
                    const: true,
                    description:
                        'Passive owner-scoped workspace resources in the private NCH1 binary channel.',
                    type: 'boolean',
                },
                officeGame: {
                    const: true,
                    description:
                        'NGOP office state and player input share the authenticated gateway socket.',
                    type: 'boolean',
                },
                officeGameVersion: {
                    const: 3,
                    description: 'NGOP version supporting server-issued acceptance celebrations.',
                    type: 'number',
                },
                officeLayout: {
                    const: true,
                    description: 'Owner-only OLAY geometry commands.',
                    type: 'boolean',
                },
                officeLayoutDesks: {
                    const: true,
                    description:
                        'OLAY v2 atomically saves construction and permanent workstation coordinates.',
                    type: 'boolean',
                },
                officeProjectBaselines: {
                    const: true,
                    description: 'NCP2 version 2 with accepted-product baselines for new projects.',
                    type: 'boolean',
                },
                officeProjectPermissions: {
                    const: true,
                    description:
                        'Owner-only NCP2 v6 exact-call tool permissions tied to a live execution attempt.',
                    type: 'boolean',
                },
                officeProjectRecovery: {
                    const: true,
                    description:
                        'Owner-only NCP2 v5 interruption reviews, with independently enforced financial recovery.',
                    type: 'boolean',
                },
                officeProjects: {
                    const: true,
                    description:
                        'NCP2 private project decisions, subscriptions, and delivery chunks.',
                    type: 'boolean',
                },
                officeShowroom: {
                    const: true,
                    description:
                        'Owner-published accepted product labels in NGOP v9 and private NCP2 v4.',
                    type: 'boolean',
                },
                officeVerification: {
                    const: true,
                    description:
                        'Versioned host verification evidence on private project and employee channels.',
                    type: 'boolean',
                },
                sessionHistory: {
                    const: true,
                    description: 'Durable complete presentation history and binary restoration.',
                    type: 'boolean',
                },
                sessionHistoryUpdates: {
                    const: true,
                    description:
                        'Session subscriptions notify exact journal ranges for live catch-up.',
                    type: 'boolean',
                },
                transcriptBlocks: {
                    const: true,
                    description: 'Compact persisted NDJSON blocks, read in bounded byte pages.',
                    type: 'boolean',
                },
                workflowDraftsVersion: {
                    const: 1,
                    type: 'number',
                },
                workflowGraphVersion: {
                    const: 1,
                    description:
                        'Exact component catalog and structural validation of pinned drafts.',
                    type: 'number',
                },
                workflowGroupsVersion: {
                    const: 1,
                    description:
                        'Saved parent-local groups, published aliases and paginated immutable group records.',
                    type: 'number',
                },
                workflowPlanningVersion: {
                    const: 1,
                    description:
                        'Owner-scoped draft storage with bounded reads and revision-safe direct patches.',
                    type: 'number',
                },
                workflowRunsVersion: {
                    const: 1,
                    description: 'Durable core workflow test runs and bounded output inspection.',
                    type: 'number',
                },
            },
            required: ['events', 'methodScopes', 'methods'],
            type: 'object',
        },
        GatewayLimits: {
            description: 'Configurable bounds on gateway-owned work and memory.',
            properties: {
                handshakeTimeoutMs: {
                    description:
                        'Time after the WebSocket upgrade to complete the application handshake.',
                    type: 'number',
                },
                maxConnections: {
                    description: 'Active sockets plus upgrades awaiting authentication.',
                    type: 'number',
                },
                maxOutboundBytes: {
                    description:
                        'Estimated queued outbound storage and writes awaiting completion callbacks.',
                    type: 'number',
                },
                maxRequestBytes: {
                    description:
                        'Incoming RPC bytes plus estimated input retained by active streams.',
                    type: 'number',
                },
                maxRequests: {
                    description: 'Admitted RPC handlers across the process.',
                    type: 'number',
                },
                maxRequestsPerConnection: {
                    description: 'Admitted RPC handlers on one socket.',
                    type: 'number',
                },
                maxRequestsPerPrincipal: {
                    description:
                        "Admitted RPC handlers across an authenticated principal's sockets.",
                    type: 'number',
                },
                maxStreams: {
                    description: 'Streaming runs that have not finished cleanup.',
                    type: 'number',
                },
                maxStreamsPerConnection: {
                    description: 'Streaming runs owned by one socket.',
                    type: 'number',
                },
                maxStreamsPerPrincipal: {
                    description: 'Streaming runs owned by one authenticated principal.',
                    type: 'number',
                },
                maxSubscriptionsPerConnection: {
                    description: 'Distinct session subscriptions on one socket.',
                    type: 'number',
                },
            },
            required: [
                'handshakeTimeoutMs',
                'maxConnections',
                'maxOutboundBytes',
                'maxRequestBytes',
                'maxRequests',
                'maxRequestsPerConnection',
                'maxRequestsPerPrincipal',
                'maxStreams',
                'maxStreamsPerConnection',
                'maxStreamsPerPrincipal',
                'maxSubscriptionsPerConnection',
            ],
            type: 'object',
        },
        GatewayMethods: {
            properties: {
                'accounts.create': {
                    properties: {
                        params: {
                            $ref: '#/definitions/AccountCreateParams',
                        },
                        result: {
                            $ref: '#/definitions/AccountSummary',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'accounts.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/AccountSummary',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'accounts.remove': {
                    properties: {
                        params: {
                            $ref: '#/definitions/AccountRemoveParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'accounts.usage': {
                    properties: {
                        params: {
                            $ref: '#/definitions/AccountsUsageParams',
                        },
                        result: {
                            $ref: '#/definitions/AccountsUsageResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'agent.ask': {
                    properties: {
                        params: {
                            $ref: '#/definitions/AskParams',
                        },
                        result: {
                            $ref: '#/definitions/AskResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'agent.steer': {
                    properties: {
                        params: {
                            $ref: '#/definitions/SteerParams',
                        },
                        result: {
                            properties: {
                                accepted: {
                                    type: 'boolean',
                                },
                            },
                            required: ['accepted'],
                            type: 'object',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'agent.stream': {
                    properties: {
                        params: {
                            $ref: '#/definitions/StreamParams',
                        },
                        result: {
                            $ref: '#/definitions/StreamAccepted',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'agents.define': {
                    properties: {
                        params: {
                            $ref: '#/definitions/AgentDefineParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'agents.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/AgentDefinition',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'agents.personal.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/PersonalAgent',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'agents.personal.remove': {
                    properties: {
                        params: {
                            $ref: '#/definitions/IdParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'agents.personal.save': {
                    properties: {
                        params: {
                            $ref: '#/definitions/PersonalAgentInput',
                        },
                        result: {
                            $ref: '#/definitions/PersonalAgent',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'approvals.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/PendingApproval',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'approvals.resolve': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ApprovalResolveParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'channels.deadLetters.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/DeadLetter',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'channels.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/ChannelInfo',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'channels.status': {
                    properties: {
                        params: {
                            $ref: '#/definitions/IdParams',
                        },
                        result: {
                            $ref: '#/definitions/ChannelStatusResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'config.get': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            $ref: '#/definitions/ConfigResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'config.set': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ConfigWriteParams',
                        },
                        result: {
                            $ref: '#/definitions/ConfigWriteResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'config.unset': {
                    properties: {
                        params: {
                            properties: {
                                key: {
                                    type: 'string',
                                },
                            },
                            required: ['key'],
                            type: 'object',
                        },
                        result: {
                            $ref: '#/definitions/ConfigWriteResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                connect: {
                    properties: {
                        params: {
                            $ref: '#/definitions/ConnectParams',
                        },
                        result: {
                            $ref: '#/definitions/HelloOk',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'credit.budgets': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/Budget',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'credit.removeBudget': {
                    properties: {
                        params: {
                            properties: {
                                id: {
                                    type: 'string',
                                },
                            },
                            required: ['id'],
                            type: 'object',
                        },
                        result: {
                            properties: {
                                ok: {
                                    const: true,
                                    type: 'boolean',
                                },
                            },
                            required: ['ok'],
                            type: 'object',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'credit.resetAllowance': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ResetAllowanceParams',
                        },
                        result: {
                            $ref: '#/definitions/ResetAllowanceResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'credit.resetHistory': {
                    properties: {
                        params: {
                            properties: {
                                before: {
                                    type: 'string',
                                },
                                userId: {
                                    type: 'string',
                                },
                            },
                            type: 'object',
                        },
                        result: {
                            $ref: '#/definitions/ResetHistoryPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'credit.resets': {
                    properties: {
                        params: {
                            properties: {
                                userId: {
                                    type: 'string',
                                },
                            },
                            type: 'object',
                        },
                        result: {
                            anyOf: [
                                {
                                    $ref: '#/definitions/ResetSnapshot',
                                },
                                {
                                    type: 'null',
                                },
                            ],
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'credit.setBudget': {
                    properties: {
                        params: {
                            properties: {
                                enforcement: {
                                    $ref: '#/definitions/BudgetEnforcement',
                                },
                                id: {
                                    type: 'string',
                                },
                                limitMicrocents: {
                                    type: 'number',
                                },
                                period: {
                                    $ref: '#/definitions/BudgetPeriod',
                                },
                                scope: {
                                    $ref: '#/definitions/CreditScope',
                                },
                                scopeId: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'enforcement',
                                'limitMicrocents',
                                'period',
                                'scope',
                                'scopeId',
                            ],
                            type: 'object',
                        },
                        result: {
                            $ref: '#/definitions/Budget',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'credit.summary': {
                    properties: {
                        params: {
                            $ref: '#/definitions/CreditSummaryParams',
                        },
                        result: {
                            $ref: '#/definitions/CreditSummary',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'credit.wallet': {
                    properties: {
                        params: {
                            properties: {
                                userId: {
                                    type: 'string',
                                },
                            },
                            type: 'object',
                        },
                        result: {
                            anyOf: [
                                {
                                    $ref: '#/definitions/WalletSnapshot',
                                },
                                {
                                    type: 'null',
                                },
                            ],
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'credit.walletHistory': {
                    properties: {
                        params: {
                            properties: {
                                before: {
                                    type: 'string',
                                },
                                userId: {
                                    type: 'string',
                                },
                            },
                            type: 'object',
                        },
                        result: {
                            $ref: '#/definitions/WalletHistoryPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'data.upload.cancel': {
                    properties: {
                        params: {
                            $ref: '#/definitions/DataUploadIdParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'data.upload.chunk': {
                    properties: {
                        params: {
                            $ref: '#/definitions/DataUploadChunkParams',
                        },
                        result: {
                            $ref: '#/definitions/DataUploadPosition',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'data.upload.finish': {
                    properties: {
                        params: {
                            $ref: '#/definitions/DataUploadIdParams',
                        },
                        result: {
                            $ref: '#/definitions/DataFile',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'data.upload.start': {
                    properties: {
                        params: {
                            $ref: '#/definitions/DataUploadStartParams',
                        },
                        result: {
                            $ref: '#/definitions/DataUpload',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'design.changes': {
                    description: 'Forward delta RPC contract.',
                    properties: {
                        params: {
                            $ref: '#/definitions/DesignChangesRequest',
                        },
                        result: {
                            $ref: '#/definitions/DesignRecordPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'design.create': {
                    description: 'Create-document RPC contract.',
                    properties: {
                        params: {
                            $ref: '#/definitions/DesignCreateRequest',
                        },
                        result: {
                            $ref: '#/definitions/DesignReceipt',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'design.events': {
                    description: 'Revision-journal RPC contract.',
                    properties: {
                        params: {
                            $ref: '#/definitions/DesignEventsRequest',
                        },
                        result: {
                            $ref: '#/definitions/DesignEventsPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'design.layout': {
                    description: 'Computed-geometry RPC contract.',
                    properties: {
                        params: {
                            $ref: '#/definitions/DesignLayoutRequest',
                        },
                        result: {
                            $ref: '#/definitions/DesignLayoutPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'design.list': {
                    description: 'Owner-scoped library RPC contract.',
                    properties: {
                        params: {
                            $ref: '#/definitions/DesignListRequest',
                        },
                        result: {
                            $ref: '#/definitions/DesignListPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'design.read': {
                    description: 'Bounded snapshot RPC contract.',
                    properties: {
                        params: {
                            $ref: '#/definitions/DesignReadRequest',
                        },
                        result: {
                            $ref: '#/definitions/DesignRecordPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'design.save': {
                    description: 'Atomic editing RPC contract.',
                    properties: {
                        params: {
                            $ref: '#/definitions/DesignSaveRequest',
                        },
                        result: {
                            $ref: '#/definitions/DesignReceipt',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'design.undo': {
                    description: 'Conflict-safe undo RPC contract.',
                    properties: {
                        params: {
                            $ref: '#/definitions/DesignUndoRequest',
                        },
                        result: {
                            $ref: '#/definitions/DesignReceipt',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'devices.approve': {
                    properties: {
                        params: {
                            $ref: '#/definitions/DeviceApproveParams',
                        },
                        result: {
                            $ref: '#/definitions/DeviceApproveResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'devices.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            $ref: '#/definitions/DeviceListResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'devices.reject': {
                    properties: {
                        params: {
                            $ref: '#/definitions/IdParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'devices.revoke': {
                    properties: {
                        params: {
                            $ref: '#/definitions/DeviceRefParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                health: {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            $ref: '#/definitions/HealthResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'jobs.add': {
                    properties: {
                        params: {
                            $ref: '#/definitions/JobAddParams',
                        },
                        result: {
                            $ref: '#/definitions/IdParams',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'jobs.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/Job',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'jobs.remove': {
                    properties: {
                        params: {
                            $ref: '#/definitions/IdParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'logs.tail': {
                    properties: {
                        params: {
                            $ref: '#/definitions/LogTailParams',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/LogRecord',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'media.acknowledge': {
                    properties: {
                        params: {
                            $ref: '#/definitions/MediaAcknowledgeParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'office.ownerProof': {
                    description:
                        "Bind an invitation to the authenticated socket's office, using a short-lived signed proof.",
                    properties: {
                        params: {
                            properties: {
                                accountId: {
                                    type: 'string',
                                },
                            },
                            required: ['accountId'],
                            type: 'object',
                        },
                        result: {
                            properties: {
                                proof: {
                                    type: 'string',
                                },
                            },
                            required: ['proof'],
                            type: 'object',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'processes.input': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ProcessInput',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'processes.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/SessionRef',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/BackgroundProcess',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'processes.log': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ProcessLogRef',
                        },
                        result: {
                            $ref: '#/definitions/BackgroundProcessLog',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'processes.resize': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ProcessResize',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'processes.stop': {
                    properties: {
                        params: {
                            $ref: '#/definitions/BackgroundProcessRef',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'reverse.browser': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ReverseBrowserQuery',
                        },
                        result: {
                            $ref: '#/definitions/ReverseBrowserPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'reverse.browser.modules': {
                    properties: {
                        params: {
                            $ref: '#/definitions/BrowserModuleQuery',
                        },
                        result: {
                            $ref: '#/definitions/BrowserModulePage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'reverse.browser.screenshot': {
                    properties: {
                        params: {
                            $ref: '#/definitions/BrowserScreenshotQuery',
                        },
                        result: {
                            $ref: '#/definitions/BrowserScreenshotPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'reverse.browser.sources': {
                    properties: {
                        params: {
                            $ref: '#/definitions/BrowserSourcesQuery',
                        },
                        result: {
                            $ref: '#/definitions/BrowserSourcesPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'reverse.browser.storage': {
                    properties: {
                        params: {
                            $ref: '#/definitions/BrowserStorageQuery',
                        },
                        result: {
                            $ref: '#/definitions/BrowserStoragePage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'reverse.browser.storage.comparison': {
                    properties: {
                        params: {
                            $ref: '#/definitions/BrowserStorageComparisonQuery',
                        },
                        result: {
                            $ref: '#/definitions/BrowserStorageComparisonPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'reverse.browser.structure': {
                    properties: {
                        params: {
                            $ref: '#/definitions/BrowserStructureQuery',
                        },
                        result: {
                            $ref: '#/definitions/BrowserStructurePage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'reverse.browser.webmcp': {
                    properties: {
                        params: {
                            $ref: '#/definitions/BrowserWebMcpQuery',
                        },
                        result: {
                            $ref: '#/definitions/BrowserWebMcpPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'reverse.catalog': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ReverseCatalogQuery',
                        },
                        result: {
                            $ref: '#/definitions/ReverseCatalogPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'reverse.evidence': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ReverseEvidenceQuery',
                        },
                        result: {
                            $ref: '#/definitions/ReverseEvidencePage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'reverse.functions': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ReverseFunctionsQuery',
                        },
                        result: {
                            $ref: '#/definitions/ReverseFunctionsPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'reverse.graph': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ReverseGraphQuery',
                        },
                        result: {
                            $ref: '#/definitions/ReverseGraphPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'reverse.inspect': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ReverseInspectQuery',
                        },
                        result: {
                            $ref: '#/definitions/ReverseInspectResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'reverse.network': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ReverseNetworkDirectoryQuery',
                        },
                        result: {
                            $ref: '#/definitions/ReverseNetworkDirectoryPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'reverse.network.detail': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ReverseNetworkDetailQuery',
                        },
                        result: {
                            $ref: '#/definitions/ReverseNetworkDetailPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'roblox.credentials.remove': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            $ref: '#/definitions/RobloxCredentialStatus',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'roblox.credentials.set': {
                    properties: {
                        params: {
                            $ref: '#/definitions/RobloxCredentialSetParams',
                        },
                        result: {
                            $ref: '#/definitions/RobloxCredentialStatus',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'roblox.credentials.status': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            $ref: '#/definitions/RobloxCredentialStatus',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'roblox.telemetry.funnel': {
                    properties: {
                        params: {
                            $ref: '#/definitions/TelemetryFunnelParams',
                        },
                        result: {
                            $ref: '#/definitions/FunnelReport',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'roblox.telemetry.performance': {
                    properties: {
                        params: {
                            $ref: '#/definitions/TelemetryPerformanceParams',
                        },
                        result: {
                            $ref: '#/definitions/PerformanceReport',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'roblox.telemetry.projects': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/TelemetryProject',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'sessions.delete': {
                    properties: {
                        params: {
                            $ref: '#/definitions/IdParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'sessions.download': {
                    properties: {
                        params: {
                            $ref: '#/definitions/SessionFileParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'sessions.files': {
                    properties: {
                        params: {
                            $ref: '#/definitions/IdParams',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/DeliveredAttachment',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'sessions.get': {
                    properties: {
                        params: {
                            $ref: '#/definitions/IdParams',
                        },
                        result: {
                            anyOf: [
                                {
                                    $ref: '#/definitions/Flatten%3C%7Breadonlytitle%3Astring%7Cnull%3Breadonlyid%3Astring%3BreadonlyagentId%3Astring%3BreadonlycreatedAt%3Anumber%3BreadonlyupdatedAt%3Anumber%3BreadonlyconversationId%3Astring%7Cnull%3Breadonlyparticipants%3Areadonlystring%5B%5D%3BreadonlymessageCount%3Anumber%3Breadonlyusage%3ATokenUsage%3B%7D%26%7BreadonlytitleEdited%3F%3Aboolean%7Cundefined%3BreadonlyretrySourceId%3F%3Astring%7Cundefined%3BreadonlyretryRequestId%3F%3Astring%7Cundefined%3BreadonlyretryState%3F%3Astring%7Cundefined%3BreadonlyretryFingerprint%3F%3Astring%7Cundefined%3BreadonlyactiveToolFamilies%3F%3Areadonlystring%5B%5D%7Cundefined%3BreadonlyprojectId%3F%3Astring%7Cundefined%3BreadonlyuserId%3F%3Astring%7Cundefined%3BreadonlyworkspaceId%3F%3Astring%7Cundefined%3BreadonlyturnOpen%3F%3Aboolean%7Cundefined%3B%7D%3E',
                                    description:
                                        'Collapses the required/optional intersection into one object type.\n\nHomomorphic (`in keyof T` over a naked type parameter), so `readonly` and `?` are carried through\nrather than flattened away — without it every derived type would lose its modifiers and a caller\ncould assign to a field the store treats as immutable.',
                                },
                                {
                                    type: 'null',
                                },
                            ],
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'sessions.input': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ConversationPinParams',
                        },
                        result: {
                            $ref: '#/definitions/ConversationInput',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'sessions.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/SessionListParams',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/Flatten%3C%7Breadonlytitle%3Astring%7Cnull%3Breadonlyid%3Astring%3BreadonlyagentId%3Astring%3BreadonlycreatedAt%3Anumber%3BreadonlyupdatedAt%3Anumber%3BreadonlyconversationId%3Astring%7Cnull%3Breadonlyparticipants%3Areadonlystring%5B%5D%3BreadonlymessageCount%3Anumber%3Breadonlyusage%3ATokenUsage%3B%7D%26%7BreadonlytitleEdited%3F%3Aboolean%7Cundefined%3BreadonlyretrySourceId%3F%3Astring%7Cundefined%3BreadonlyretryRequestId%3F%3Astring%7Cundefined%3BreadonlyretryState%3F%3Astring%7Cundefined%3BreadonlyretryFingerprint%3F%3Astring%7Cundefined%3BreadonlyactiveToolFamilies%3F%3Areadonlystring%5B%5D%7Cundefined%3BreadonlyprojectId%3F%3Astring%7Cundefined%3BreadonlyuserId%3F%3Astring%7Cundefined%3BreadonlyworkspaceId%3F%3Astring%7Cundefined%3BreadonlyturnOpen%3F%3Aboolean%7Cundefined%3B%7D%3E',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'sessions.messages': {
                    properties: {
                        params: {
                            $ref: '#/definitions/IdParams',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/ModelMessage',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'sessions.pin': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ConversationPinParams',
                        },
                        result: {
                            $ref: '#/definitions/ConversationPin',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'sessions.pins': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ConversationPinsParams',
                        },
                        result: {
                            $ref: '#/definitions/ConversationPinsPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'sessions.rename': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ConversationRenameParams',
                        },
                        result: {
                            $ref: '#/definitions/Flatten%3C%7Breadonlytitle%3Astring%7Cnull%3Breadonlyid%3Astring%3BreadonlyagentId%3Astring%3BreadonlycreatedAt%3Anumber%3BreadonlyupdatedAt%3Anumber%3BreadonlyconversationId%3Astring%7Cnull%3Breadonlyparticipants%3Areadonlystring%5B%5D%3BreadonlymessageCount%3Anumber%3Breadonlyusage%3ATokenUsage%3B%7D%26%7BreadonlytitleEdited%3F%3Aboolean%7Cundefined%3BreadonlyretrySourceId%3F%3Astring%7Cundefined%3BreadonlyretryRequestId%3F%3Astring%7Cundefined%3BreadonlyretryState%3F%3Astring%7Cundefined%3BreadonlyretryFingerprint%3F%3Astring%7Cundefined%3BreadonlyactiveToolFamilies%3F%3Areadonlystring%5B%5D%7Cundefined%3BreadonlyprojectId%3F%3Astring%7Cundefined%3BreadonlyuserId%3F%3Astring%7Cundefined%3BreadonlyworkspaceId%3F%3Astring%7Cundefined%3BreadonlyturnOpen%3F%3Aboolean%7Cundefined%3B%7D%3E',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'sessions.retry': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ConversationRetryParams',
                        },
                        result: {
                            $ref: '#/definitions/ConversationRetryResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'sessions.subscribe': {
                    properties: {
                        params: {
                            $ref: '#/definitions/SessionRef',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'sessions.transcript': {
                    description: 'Compact transcript blocks with original journal byte cursors.',
                    properties: {
                        params: {
                            $ref: '#/definitions/SessionHistoryParams',
                        },
                        result: {
                            $ref: '#/definitions/SessionHistoryPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'sessions.unpin': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ConversationUnpinParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'sessions.unsubscribe': {
                    properties: {
                        params: {
                            $ref: '#/definitions/SessionRef',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'shares.create': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ShareCreateParams',
                        },
                        result: {
                            $ref: '#/definitions/ShareSummary',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'shares.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/ShareSummary',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'shares.remove': {
                    properties: {
                        params: {
                            $ref: '#/definitions/IdParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'shares.setMember': {
                    properties: {
                        params: {
                            $ref: '#/definitions/ShareMemberParams',
                        },
                        result: {
                            $ref: '#/definitions/ShareSummary',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'tasks.cancel': {
                    properties: {
                        params: {
                            $ref: '#/definitions/IdParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'tasks.get': {
                    properties: {
                        params: {
                            $ref: '#/definitions/IdParams',
                        },
                        result: {
                            anyOf: [
                                {
                                    $ref: '#/definitions/TaskRecord',
                                },
                                {
                                    type: 'null',
                                },
                            ],
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'tasks.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/TaskRecord',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'teams.create': {
                    properties: {
                        params: {
                            $ref: '#/definitions/TeamCreateParams',
                        },
                        result: {
                            $ref: '#/definitions/TeamSummary',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'teams.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/TeamSummary',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'teams.remove': {
                    properties: {
                        params: {
                            $ref: '#/definitions/IdParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'teams.setMember': {
                    properties: {
                        params: {
                            $ref: '#/definitions/TeamMemberParams',
                        },
                        result: {
                            $ref: '#/definitions/TeamSummary',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'voice.audio': {
                    properties: {
                        params: {
                            $ref: '#/definitions/VoiceAudioParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'voice.start': {
                    properties: {
                        params: {
                            $ref: '#/definitions/VoiceStartParams',
                        },
                        result: {
                            $ref: '#/definitions/VoiceStarted',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'voice.stop': {
                    properties: {
                        params: {
                            $ref: '#/definitions/VoiceStopParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.attention.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowAttentionQuery',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowAttentionPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.catalog': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowCatalog',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.create': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowCreateRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowReceipt',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.delete': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowDeleteRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowDeleteReceipt',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowListRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowListPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.models': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowModelsRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowModelsPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.models.image.quote': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowImageQuoteRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowImageQuote',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.models.image.resolve': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowImageResolutionRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowImageResolution',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.models.refresh': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowModelsRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowModelsPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.models.resolve': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowModelResolutionRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowModelResolution',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.planning.cancel': {
                    properties: {
                        params: {
                            $ref: '#/definitions/PlanningTurnRef',
                        },
                        result: {
                            $ref: '#/definitions/PlanningTurn',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.planning.history': {
                    properties: {
                        params: {
                            $ref: '#/definitions/PlanningHistoryRequest',
                        },
                        result: {
                            $ref: '#/definitions/PlanningHistory',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.planning.read': {
                    properties: {
                        params: {
                            $ref: '#/definitions/PlanningTurnRef',
                        },
                        result: {
                            $ref: '#/definitions/PlanningTurn',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.planning.send': {
                    properties: {
                        params: {
                            $ref: '#/definitions/PlanningRequest',
                        },
                        result: {
                            $ref: '#/definitions/PlanningTurn',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.planning.sources': {
                    properties: {
                        params: {
                            $ref: '#/definitions/PlanningSourcesRequest',
                        },
                        result: {
                            $ref: '#/definitions/PlanningSourcesPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.publications.check': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowPublicationCheckRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowPublicationCheck',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.publications.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowPublicationListRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowPublicationPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.publications.publish': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowPublishRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowPublishResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.publications.read': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowPublicationReadRequest',
                        },
                        result: {
                            anyOf: [
                                {
                                    $ref: '#/definitions/WorkflowPublication',
                                },
                                {
                                    type: 'null',
                                },
                            ],
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.publications.run': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowPublishedRunRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowRunSummary',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.read': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowReadRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowManifestPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.record': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowRecordRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowRecordPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.records': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowRecordsRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowRecordsPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.agent.control': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowAgentControlRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowAgentSession',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.agent.input': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowAgentInputRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowAgentSession',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.agent.read': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowAgentSessionRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowAgentSession',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.applications.check': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowApplicationRequest',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/WorkflowApplicationStatus',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.applications.setup': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowApplicationSetupRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowTerminalSnapshot',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.approval.decide': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowApprovalDecision',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowHumanRequest',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.artifact': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowRunArtifactRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowRunArtifactPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.artifacts': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowArtifactListRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowArtifactListPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.attempts': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowRunAttemptsRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowRunAttemptsPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.cancel': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowRunRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowRunSummary',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.events': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowRunEventsRequest',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/WorkflowRunEvent',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.inputs': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowRunOutputRequest',
                        },
                        result: {
                            anyOf: [
                                {
                                    $ref: '#/definitions/WorkflowRunOutputPage',
                                },
                                {
                                    type: 'null',
                                },
                            ],
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowRunListRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowRunListPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.loopPricing': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowLoopSpendingRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowLoopSpendingView',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.loopSpending': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowLoopSpendingRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowLoopSpendingView',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.output': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowRunOutputRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowRunOutputPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.question.answer': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowHumanAnswer',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowHumanRequest',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.question.read': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowHumanIdentity',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowHumanRequest',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.questions': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowRunRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowHumanPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.read': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowRunRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowRunSummary',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.start': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowRunStartRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowRunSummary',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.steps': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowRunStepsRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowRunStepsPage',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.terminal.command': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowTerminalCommand',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowTerminalSnapshot',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.terminal.read': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowTerminalRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowTerminalSnapshot',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.usage': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowRunUsageRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowRunUsageView',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.runs.usageBreakdown': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowRunBreakdownRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowRunBreakdownView',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.save': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowSaveRequest',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowReceipt',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.schedules.disable': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowScheduleCommand',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowScheduleView',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.schedules.enable': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowScheduleEnable',
                        },
                        result: {
                            $ref: '#/definitions/WorkflowScheduleView',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.schedules.preview': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowSchedulePreview',
                        },
                        result: {
                            items: {
                                type: 'string',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.schedules.read': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowScheduleRead',
                        },
                        result: {
                            anyOf: [
                                {
                                    $ref: '#/definitions/WorkflowScheduleView',
                                },
                                {
                                    type: 'null',
                                },
                            ],
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workflows.validate': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkflowValidateRequest',
                        },
                        result: {
                            $ref: '#/definitions/GraphValidation',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workspaces.create': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkspaceCreateParams',
                        },
                        result: {
                            $ref: '#/definitions/Workspace',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workspaces.describe': {
                    properties: {
                        params: {
                            $ref: '#/definitions/IdParams',
                        },
                        result: {
                            $ref: '#/definitions/WorkspaceDescription',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workspaces.destroy': {
                    properties: {
                        params: {
                            $ref: '#/definitions/WorkspaceDestroyParams',
                        },
                        result: {
                            $ref: '#/definitions/OkResult',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
                'workspaces.list': {
                    properties: {
                        params: {
                            $ref: '#/definitions/Record%3Cstring%2Cnever%3E',
                        },
                        result: {
                            items: {
                                $ref: '#/definitions/Workspace',
                            },
                            type: 'array',
                        },
                    },
                    required: ['params', 'result'],
                    type: 'object',
                },
            },
            required: [
                'accounts.create',
                'accounts.list',
                'accounts.remove',
                'accounts.usage',
                'agent.ask',
                'agent.steer',
                'agent.stream',
                'agents.define',
                'agents.list',
                'agents.personal.list',
                'agents.personal.remove',
                'agents.personal.save',
                'approvals.list',
                'approvals.resolve',
                'channels.deadLetters.list',
                'channels.list',
                'channels.status',
                'config.get',
                'config.set',
                'config.unset',
                'connect',
                'credit.budgets',
                'credit.removeBudget',
                'credit.resetAllowance',
                'credit.resetHistory',
                'credit.resets',
                'credit.setBudget',
                'credit.summary',
                'credit.wallet',
                'credit.walletHistory',
                'data.upload.cancel',
                'data.upload.chunk',
                'data.upload.finish',
                'data.upload.start',
                'design.changes',
                'design.create',
                'design.events',
                'design.layout',
                'design.list',
                'design.read',
                'design.save',
                'design.undo',
                'devices.approve',
                'devices.list',
                'devices.reject',
                'devices.revoke',
                'health',
                'jobs.add',
                'jobs.list',
                'jobs.remove',
                'logs.tail',
                'media.acknowledge',
                'office.ownerProof',
                'processes.input',
                'processes.list',
                'processes.log',
                'processes.resize',
                'processes.stop',
                'reverse.browser',
                'reverse.browser.modules',
                'reverse.browser.screenshot',
                'reverse.browser.sources',
                'reverse.browser.storage',
                'reverse.browser.storage.comparison',
                'reverse.browser.structure',
                'reverse.browser.webmcp',
                'reverse.catalog',
                'reverse.evidence',
                'reverse.functions',
                'reverse.graph',
                'reverse.inspect',
                'reverse.network',
                'reverse.network.detail',
                'roblox.credentials.remove',
                'roblox.credentials.set',
                'roblox.credentials.status',
                'roblox.telemetry.funnel',
                'roblox.telemetry.performance',
                'roblox.telemetry.projects',
                'sessions.delete',
                'sessions.download',
                'sessions.files',
                'sessions.get',
                'sessions.input',
                'sessions.list',
                'sessions.messages',
                'sessions.pin',
                'sessions.pins',
                'sessions.rename',
                'sessions.retry',
                'sessions.subscribe',
                'sessions.transcript',
                'sessions.unpin',
                'sessions.unsubscribe',
                'shares.create',
                'shares.list',
                'shares.remove',
                'shares.setMember',
                'tasks.cancel',
                'tasks.get',
                'tasks.list',
                'teams.create',
                'teams.list',
                'teams.remove',
                'teams.setMember',
                'voice.audio',
                'voice.start',
                'voice.stop',
                'workflows.attention.list',
                'workflows.catalog',
                'workflows.create',
                'workflows.delete',
                'workflows.list',
                'workflows.models',
                'workflows.models.image.quote',
                'workflows.models.image.resolve',
                'workflows.models.refresh',
                'workflows.models.resolve',
                'workflows.planning.cancel',
                'workflows.planning.history',
                'workflows.planning.read',
                'workflows.planning.send',
                'workflows.planning.sources',
                'workflows.publications.check',
                'workflows.publications.list',
                'workflows.publications.publish',
                'workflows.publications.read',
                'workflows.publications.run',
                'workflows.read',
                'workflows.record',
                'workflows.records',
                'workflows.runs.agent.control',
                'workflows.runs.agent.input',
                'workflows.runs.agent.read',
                'workflows.runs.applications.check',
                'workflows.runs.applications.setup',
                'workflows.runs.approval.decide',
                'workflows.runs.artifact',
                'workflows.runs.artifacts',
                'workflows.runs.attempts',
                'workflows.runs.cancel',
                'workflows.runs.events',
                'workflows.runs.inputs',
                'workflows.runs.list',
                'workflows.runs.loopPricing',
                'workflows.runs.loopSpending',
                'workflows.runs.output',
                'workflows.runs.question.answer',
                'workflows.runs.question.read',
                'workflows.runs.questions',
                'workflows.runs.read',
                'workflows.runs.start',
                'workflows.runs.steps',
                'workflows.runs.terminal.command',
                'workflows.runs.terminal.read',
                'workflows.runs.usage',
                'workflows.runs.usageBreakdown',
                'workflows.save',
                'workflows.schedules.disable',
                'workflows.schedules.enable',
                'workflows.schedules.preview',
                'workflows.schedules.read',
                'workflows.validate',
                'workspaces.create',
                'workspaces.describe',
                'workspaces.destroy',
                'workspaces.list',
            ],
            type: 'object',
        },
        GeometryFormat: {
            description:
                'Supported serialized 3D asset formats; radiance fields remain unspecified.',
            enum: ['gaussian_ply', 'glb'],
            type: 'string',
        },
        GraphIssue: {
            description:
                'Stable identities let all surfaces focus the same problem without parsing its message.',
            properties: {
                code: {
                    $ref: '#/definitions/GraphIssueCode',
                },
                edgeId: {
                    type: ['null', 'string'],
                },
                message: {
                    type: 'string',
                },
                nodeId: {
                    type: ['null', 'string'],
                },
                path: {
                    type: ['null', 'string'],
                },
                severity: {
                    $ref: '#/definitions/GraphSeverity',
                },
            },
            required: ['code', 'edgeId', 'message', 'nodeId', 'path', 'severity'],
            type: 'object',
        },
        GraphIssueCode: {
            enum: [
                'ambiguous',
                'cardinality',
                'component',
                'configuration',
                'connection',
                'cycle',
                'duplicate',
                'endpoint',
                'required',
                'resource',
                'runtime',
                'setup',
                'trigger',
                'unreachable',
            ],
            type: 'string',
        },
        GraphSeverity: {
            enum: ['error', 'warning'],
            type: 'string',
        },
        GraphValidation: {
            description:
                'A structural result is never an execution grant or a connection authorization snapshot.',
            properties: {
                issues: {
                    items: {
                        $ref: '#/definitions/GraphIssue',
                    },
                    type: 'array',
                },
                order: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                requiredCapabilities: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                resourceRequirements: {
                    type: 'number',
                },
                revision: {
                    type: 'string',
                },
                totalIssues: {
                    type: 'number',
                },
                truncated: {
                    type: 'boolean',
                },
                unavailableHandlers: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                valid: {
                    type: 'boolean',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: [
                'issues',
                'order',
                'requiredCapabilities',
                'resourceRequirements',
                'revision',
                'totalIssues',
                'truncated',
                'unavailableHandlers',
                'valid',
                'workflowId',
            ],
            type: 'object',
        },
        HealthResult: {
            description: 'Liveness and identity.',
            properties: {
                connections: {
                    type: 'number',
                },
                ok: {
                    const: true,
                    type: 'boolean',
                },
                protocol: {
                    type: 'number',
                },
                uptimeMs: {
                    type: 'number',
                },
                version: {
                    type: 'string',
                },
            },
            required: ['connections', 'ok', 'protocol', 'uptimeMs', 'version'],
            type: 'object',
        },
        HelloOk: {
            properties: {
                auth: {
                    properties: {
                        method: {
                            enum: ['device', 'none', 'token'],
                            type: 'string',
                        },
                        principalId: {
                            type: 'string',
                        },
                        scopes: {
                            items: {
                                $ref: '#/definitions/Scope',
                            },
                            type: 'array',
                        },
                        token: {
                            description:
                                'Newly issued device credential, delivered to browser clients unable to read upgrade headers.',
                            type: 'string',
                        },
                    },
                    required: ['method', 'principalId', 'scopes'],
                    type: 'object',
                },
                features: {
                    $ref: '#/definitions/GatewayFeatures',
                },
                minProtocol: {
                    type: 'number',
                },
                policy: {
                    properties: {
                        heartbeatMs: {
                            description:
                                'How often the server pings. 0 means the heartbeat is off.',
                            type: 'number',
                        },
                        limits: {
                            $ref: '#/definitions/GatewayLimits',
                            description:
                                'Resource budgets advertised by gateways supporting bounded admission.',
                        },
                        maxBufferedBytes: {
                            type: 'number',
                        },
                        maxPayloadBytes: {
                            type: 'number',
                        },
                        preHandshakeMaxBytes: {
                            type: 'number',
                        },
                    },
                    required: [
                        'heartbeatMs',
                        'maxBufferedBytes',
                        'maxPayloadBytes',
                        'preHandshakeMaxBytes',
                    ],
                    type: 'object',
                },
                protocol: {
                    type: 'number',
                },
                server: {
                    properties: {
                        connId: {
                            type: 'string',
                        },
                        version: {
                            type: 'string',
                        },
                    },
                    required: ['connId', 'version'],
                    type: 'object',
                },
                snapshot: {
                    description:
                        'State the first screen needs, so a client renders something before its first RPC.\n\nOnly what the server already holds in memory at handshake time. Anything that would need a\nstore read belongs in an RPC, because a handshake that waits on disk is a handshake that hangs.',
                    properties: {
                        agents: {
                            items: {
                                $ref: '#/definitions/AgentDefinition',
                            },
                            type: 'array',
                        },
                        uptimeMs: {
                            type: 'number',
                        },
                    },
                    required: ['agents', 'uptimeMs'],
                    type: 'object',
                },
                type: {
                    const: 'hello-ok',
                    type: 'string',
                },
            },
            required: [
                'auth',
                'features',
                'minProtocol',
                'policy',
                'protocol',
                'server',
                'snapshot',
                'type',
            ],
            type: 'object',
        },
        HistoryApprovalRequested: {
            description: 'Approval controls retain their original request identity.',
            properties: {
                at: {
                    type: 'number',
                },
                data: {
                    $ref: '#/definitions/ApprovalRequestedData',
                },
                id: {
                    type: 'string',
                },
                kind: {
                    const: 'approval-requested',
                    type: 'string',
                },
                runId: {
                    type: ['null', 'string'],
                },
                streamId: {
                    description:
                        'Owning stream, retained when multiple turns share a conversation.',
                    type: 'string',
                },
            },
            required: ['at', 'data', 'id', 'kind', 'runId'],
            type: 'object',
        },
        HistoryApprovalResolved: {
            description: 'Settled approvals must not become actionable again when restored.',
            properties: {
                at: {
                    type: 'number',
                },
                data: {
                    $ref: '#/definitions/ApprovalResolvedData',
                },
                id: {
                    type: 'string',
                },
                kind: {
                    const: 'approval-resolved',
                    type: 'string',
                },
            },
            required: ['at', 'data', 'id', 'kind'],
            type: 'object',
        },
        HistoryEnd: {
            description: 'Terminal outcome, session identity, and final usage.',
            properties: {
                at: {
                    type: 'number',
                },
                data: {
                    $ref: '#/definitions/TurnEndData',
                },
                id: {
                    type: 'string',
                },
                kind: {
                    const: 'end',
                    type: 'string',
                },
            },
            required: ['at', 'data', 'id', 'kind'],
            type: 'object',
        },
        HistoryEvent: {
            description: 'Complete wire event, including native worker and media events.',
            properties: {
                at: {
                    type: 'number',
                },
                data: {
                    $ref: '#/definitions/TurnEventData',
                },
                id: {
                    type: 'string',
                },
                kind: {
                    const: 'event',
                    type: 'string',
                },
            },
            required: ['at', 'data', 'id', 'kind'],
            type: 'object',
        },
        HistoryInput: {
            description: 'Original user input, including attachments and steering messages.',
            properties: {
                at: {
                    type: 'number',
                },
                data: {
                    $ref: '#/definitions/SessionMessageData',
                },
                id: {
                    type: 'string',
                },
                kind: {
                    const: 'input',
                    type: 'string',
                },
            },
            required: ['at', 'data', 'id', 'kind'],
            type: 'object',
        },
        HistorySites: {
            description: 'Site decorations arrive separately from the tool result.',
            properties: {
                at: {
                    type: 'number',
                },
                data: {
                    $ref: '#/definitions/ToolSitesData',
                },
                id: {
                    type: 'string',
                },
                kind: {
                    const: 'sites',
                    type: 'string',
                },
            },
            required: ['at', 'data', 'id', 'kind'],
            type: 'object',
        },
        IdParams: {
            description: 'Names one record.',
            properties: {
                id: {
                    type: 'string',
                },
            },
            required: ['id'],
            type: 'object',
        },
        InboundAttachment: {
            anyOf: [
                {
                    properties: {
                        text: {
                            type: 'string',
                        },
                        type: {
                            const: 'text',
                            type: 'string',
                        },
                    },
                    required: ['text', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        source: {
                            $ref: '#/definitions/BinarySource',
                        },
                        title: {
                            type: 'string',
                        },
                        type: {
                            const: 'image',
                            type: 'string',
                        },
                    },
                    required: ['source', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        source: {
                            $ref: '#/definitions/BinarySource',
                        },
                        title: {
                            type: 'string',
                        },
                        type: {
                            const: 'video',
                            description:
                                'An encoded video or animation container decoded natively by a multimodal model.',
                            type: 'string',
                        },
                    },
                    required: ['source', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        source: {
                            $ref: '#/definitions/BinarySource',
                        },
                        title: {
                            type: 'string',
                        },
                        type: {
                            const: 'video-frame',
                            description:
                                'One ordered frame of a video or animation. Consecutive frames form one clip.',
                            type: 'string',
                        },
                    },
                    required: ['source', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        source: {
                            $ref: '#/definitions/BinarySource',
                        },
                        title: {
                            type: 'string',
                        },
                        type: {
                            const: 'document',
                            type: 'string',
                        },
                    },
                    required: ['source', 'type'],
                    type: 'object',
                },
            ],
            description:
                'A user attachment cannot inject tool results or provider reasoning into history.',
        },
        IncomingPolicy: {
            description:
                'Multiple inputs require an explicit collector or join. Last-writer-wins is not an option.',
            enum: ['collect', 'join', 'reject'],
            type: 'string',
        },
        Job: {
            description: 'A scheduled job as it is stored.',
            properties: {
                action: {
                    $ref: '#/definitions/JobAction',
                },
                allowConcurrent: {
                    description:
                        'Whether a new run may start while a previous one is still going.\n\nDefault false. An every-minute job whose run takes 90 seconds will otherwise pile up runs\nuntil the process dies — the classic naive-scheduler failure.',
                    type: 'boolean',
                },
                createdAt: {
                    type: 'number',
                },
                enabled: {
                    description: 'Disabled jobs stay stored and stop firing.',
                    type: 'boolean',
                },
                graceMs: {
                    description:
                        'For {@link MisfirePolicy.RunIfRecent}: how stale a missed occurrence may be.',
                    type: 'number',
                },
                id: {
                    type: 'string',
                },
                maxRetries: {
                    description:
                        'How many times a failed run is retried before the occurrence is abandoned.',
                    type: 'number',
                },
                misfirePolicy: {
                    $ref: '#/definitions/MisfirePolicy',
                },
                name: {
                    type: 'string',
                },
                owner: {
                    $ref: '#/definitions/JobOwner',
                    description: 'Who owns this job, for permissions and for credit attribution.',
                },
                tags: {
                    description: 'Free-form labels for querying.',
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                timeoutMs: {
                    description:
                        'A hard ceiling on one run, after which it is aborted and recorded as timed out.',
                    type: 'number',
                },
                trigger: {
                    $ref: '#/definitions/JobTrigger',
                },
                updatedAt: {
                    type: 'number',
                },
            },
            required: [
                'action',
                'createdAt',
                'enabled',
                'id',
                'misfirePolicy',
                'name',
                'trigger',
                'updatedAt',
            ],
            type: 'object',
        },
        JobAction: {
            anyOf: [
                {
                    $ref: '#/definitions/TelemetryMonitorAction',
                },
                {
                    properties: {
                        kind: {
                            const: 'company-dispatch',
                            type: 'string',
                        },
                    },
                    required: ['kind'],
                    type: 'object',
                },
                {
                    $ref: '#/definitions/ReminderAction',
                },
                {
                    properties: {
                        agentId: {
                            type: 'string',
                        },
                        deliverTo: {
                            description:
                                'Where the reply goes: a channel id, or absent to leave it in the session.',
                            type: 'string',
                        },
                        kind: {
                            const: 'agent-turn',
                            description: 'Run an agent turn with this prompt. The ordinary case.',
                            type: 'string',
                        },
                        prompt: {
                            type: 'string',
                        },
                        silentWhenEmpty: {
                            description:
                                'Suppress delivery when the turn produced nothing worth sending.',
                            type: 'boolean',
                        },
                    },
                    required: ['agentId', 'kind', 'prompt'],
                    type: 'object',
                },
                {
                    properties: {
                        allowSelfLifecycle: {
                            description:
                                'Allow a command that stops or restarts Nexa itself.\n\nRefused by default because scheduling one from inside the scheduler is a loop rather\nthan a task — see `assertNotLifecycleCommand`. A nightly restart is a legitimate thing\nto want, and this is how to say so.',
                            type: 'boolean',
                        },
                        command: {
                            type: 'string',
                        },
                        cwd: {
                            type: 'string',
                        },
                        elevation: {
                            description:
                                "Run this command outside the sandbox, if the policy allows it.\n\nThe operator's own decision about their own machine, which is why it lives on a job\nthey wrote and not on an argument a model fills in. Authorized against the policy at\nthe moment of the spawn: `sandbox.required` refuses it outright, and anything stronger\nthan `sandbox.elevation` is refused as exceeding it.\n\nA backup script that has to read outside the workspace roots is the case this exists\nfor — before it, the elevation axis was declared, defaulted to `off`, and unreachable.",
                            enum: ['ask', 'full', 'off', 'on'],
                            type: 'string',
                        },
                        kind: {
                            const: 'shell',
                            description:
                                "Run a shell command. Its stdout becomes the run's output.",
                            type: 'string',
                        },
                        timeoutMs: {
                            type: 'number',
                        },
                    },
                    required: ['command', 'kind'],
                    type: 'object',
                },
                {
                    properties: {
                        input: {
                            $ref: '#/definitions/JsonValue',
                        },
                        kind: {
                            const: 'tool',
                            description:
                                'Call a registered tool directly, with no model in the loop.',
                            type: 'string',
                        },
                        tool: {
                            type: 'string',
                        },
                    },
                    required: ['input', 'kind', 'tool'],
                    type: 'object',
                },
                {
                    properties: {
                        event: {
                            type: 'string',
                        },
                        kind: {
                            const: 'event',
                            description: 'Emit an event other subsystems subscribe to.',
                            type: 'string',
                        },
                        payload: {
                            $ref: '#/definitions/JsonValue',
                        },
                    },
                    required: ['event', 'kind'],
                    type: 'object',
                },
                {
                    properties: {
                        kind: {
                            const: 'maintenance',
                            description:
                                'Housekeeping: expired media, expired workspaces, memories past their TTL.\n\nA kind rather than a `shell` job because the work is in-process — it needs the media\nstore, the workspace manager and the memory store this deployment constructed, not a\ncommand line — and because a deployment should not have to write a cron entry to stop\naccumulating every screenshot anybody ever sent it.',
                            type: 'string',
                        },
                    },
                    required: ['kind'],
                    type: 'object',
                },
            ],
            description: 'What a job does when it fires.',
        },
        JobAddParams: {
            description:
                "A scheduled job, in the two shapes an operator actually creates.\n\nNarrower than the scheduler's own `JobTrigger`/`JobAction` unions on purpose: the wire is a\npublic surface and every shape on it has to be validated, versioned and documented forever. A\nscheduled prompt and a scheduled command are what a TUI or an IDE asks for; the full union stays\ninternal and reachable through the scheduler API.",
            properties: {
                agentId: {
                    type: 'string',
                },
                at: {
                    type: 'number',
                },
                command: {
                    description: 'A shell command to run.',
                    type: 'string',
                },
                cron: {
                    description:
                        'A cron expression. Exactly one of `cron`, `intervalMs` and `at` must be given.',
                    type: 'string',
                },
                deliverTo: {
                    description:
                        'Where the answer goes, as `channel:conversation` — `telegram:12345`.\n\nAbsent leaves the answer in the run record, which is what a job that exists to do something\nrather than to say something wants. A reminder wants the opposite.',
                    type: 'string',
                },
                enabled: {
                    type: 'boolean',
                },
                intervalMs: {
                    type: 'number',
                },
                name: {
                    type: 'string',
                },
                prompt: {
                    description:
                        'An agent turn to run. Exactly one of `prompt` and `command` must be given.',
                    type: 'string',
                },
                silentWhenEmpty: {
                    description:
                        'Say nothing when the turn produced nothing. A quiet night should be quiet.',
                    type: 'boolean',
                },
                timezone: {
                    type: 'string',
                },
            },
            required: ['name'],
            type: 'object',
        },
        JobOwner: {
            description: 'Who a job belongs to — the four scopes credit is tracked against.',
            properties: {
                agentId: {
                    type: 'string',
                },
                conversationId: {
                    type: 'string',
                },
                projectId: {
                    type: 'string',
                },
                userId: {
                    type: 'string',
                },
            },
            type: 'object',
        },
        JobTrigger: {
            anyOf: [
                {
                    properties: {
                        expression: {
                            description:
                                'A five- or six-field cron expression, or an `@daily`-style alias.',
                            type: 'string',
                        },
                        kind: {
                            const: 'cron',
                            type: 'string',
                        },
                        timezone: {
                            description:
                                'An IANA timezone; occurrences are local wall-clock times in it.',
                            type: 'string',
                        },
                    },
                    required: ['expression', 'kind'],
                    type: 'object',
                },
                {
                    properties: {
                        intervalMs: {
                            type: 'number',
                        },
                        kind: {
                            const: 'interval',
                            description: 'Every `intervalMs`, measured from the last completion.',
                            type: 'string',
                        },
                    },
                    required: ['intervalMs', 'kind'],
                    type: 'object',
                },
                {
                    properties: {
                        at: {
                            type: 'number',
                        },
                        kind: {
                            const: 'once',
                            description: 'Exactly once, at `at`.',
                            type: 'string',
                        },
                    },
                    required: ['at', 'kind'],
                    type: 'object',
                },
            ],
            description: 'When a job fires.',
        },
        JsonValue: {
            anyOf: [
                {
                    type: 'null',
                },
                {
                    type: 'boolean',
                },
                {
                    type: 'string',
                },
                {
                    type: 'number',
                },
                {
                    type: 'array',
                    items: {
                        $ref: '#/definitions/JsonValue',
                    },
                },
                {
                    type: 'object',
                    additionalProperties: {
                        $ref: '#/definitions/JsonValue',
                    },
                },
            ],
        },
        ListSchema: {
            description: 'A list is a finalized collection; it is not a stream.',
            properties: {
                item: {
                    $ref: '#/definitions/ValueSchema',
                },
                kind: {
                    const: 'list',
                    type: 'string',
                },
                maxItems: {
                    type: 'number',
                },
                minItems: {
                    type: 'number',
                },
                nullable: {
                    type: 'boolean',
                },
            },
            required: ['item', 'kind', 'maxItems', 'minItems', 'nullable'],
            type: 'object',
        },
        LogLevel: {
            description: 'Log severity, least → most severe.',
            enum: ['debug', 'error', 'info', 'warn'],
            type: 'string',
        },
        LogRecord: {
            description: 'One log line.',
            properties: {
                at: {
                    type: 'number',
                },
                fields: {
                    $ref: '#/definitions/Record%3Cstring%2Cstring%7Cnumber%7Cboolean%3E',
                },
                level: {
                    $ref: '#/definitions/LogLevel',
                },
                message: {
                    type: 'string',
                },
                scope: {
                    type: 'string',
                },
            },
            required: ['at', 'fields', 'level', 'message', 'scope'],
            type: 'object',
        },
        LogTailParams: {
            description: 'A window over the recent log.',
            properties: {
                level: {
                    description: 'Only lines at or above this level.',
                    enum: ['debug', 'error', 'info', 'warn'],
                    type: 'string',
                },
                limit: {
                    description:
                        'How many lines back to read. Absent reads everything the buffer still holds.',
                    type: 'number',
                },
                scope: {
                    description: 'Only lines from this subsystem, e.g. `gateway`.',
                    type: 'string',
                },
                since: {
                    description:
                        'Only lines newer than this timestamp, so a poller does not re-read what it has.',
                    type: 'number',
                },
            },
            type: 'object',
        },
        MediaAcknowledgeParams: {
            description:
                'Client attachment handler outcome; receipt does not assert that a human viewed it.',
            properties: {
                id: {
                    type: 'string',
                },
                received: {
                    type: 'boolean',
                },
            },
            required: ['id', 'received'],
            type: 'object',
        },
        MessageRole: {
            description: 'Who authored a message.',
            enum: ['assistant', 'system', 'tool', 'user'],
            type: 'string',
        },
        MisfirePolicy: {
            description:
                'What to do about occurrences that elapsed while the process was down.\n\nThere is no safe default here, which is exactly why it is a per-job field. A daily digest that\nmissed three days should send ONE digest (`run-once`); a billing rollup that missed three days\nmust process all three (`run-all`); a "remind me at 9am" whose 9am passed six hours ago should\nprobably stay quiet (`skip`). Choosing one globally is wrong for the other two.',
            enum: ['run-all', 'run-if-recent', 'run-once', 'skip'],
            type: 'string',
        },
        MockBehavior: {
            enum: ['deterministic', 'fixture', 'none'],
            type: 'string',
        },
        ModelMessage: {
            properties: {
                content: {
                    anyOf: [
                        {
                            items: {
                                $ref: '#/definitions/ContentBlock',
                            },
                            type: 'array',
                        },
                        {
                            type: 'string',
                        },
                    ],
                },
                identity: {
                    $ref: '#/definitions/ModelMessageIdentity',
                    description:
                        'Durable host metadata; provider adapters send only the role and content to models.',
                },
                role: {
                    $ref: '#/definitions/MessageRole',
                },
            },
            required: ['content', 'role'],
            type: 'object',
        },
        ModelMessageIdentity: {
            description:
                'Durable host metadata; provider adapters send only the role and content to models.',
            properties: {
                id: {
                    type: 'string',
                },
                inputId: {
                    type: 'string',
                },
                streamId: {
                    type: 'string',
                },
                timestamp: {
                    type: 'number',
                },
            },
            required: ['id', 'streamId', 'timestamp'],
            type: 'object',
        },
        NcapAgentDelta: {
            description: "One agent's own record from a live fan-out, for the roster.",
            properties: {
                activity: {
                    type: 'string',
                },
                expert: {
                    description:
                        'The expert it is running as, which the planner assigned per item.',
                    type: 'string',
                },
                findings: {
                    type: 'number',
                },
                item: {
                    description: 'The item this agent is working.',
                    type: 'number',
                },
                role: {
                    description:
                        'Its role on the team, when the engine names one. Empty otherwise.',
                    type: 'string',
                },
                state: {
                    description:
                        '`working` | `done` | `failed` | `retired`. Retired means it stood down and a fresh agent\ntakes the item on, which is not the same as the item failing.',
                    type: 'string',
                },
                tokens: {
                    description:
                        'Completion tokens this agent has spent, as the engine measured them.',
                    type: 'number',
                },
                turn: {
                    description:
                        "Which turn this agent is on. There is NO `turnsAllowed` beside it: nothing bounds an agent's\nturns, so the engine's denominator was structurally zero and the frame no longer carries one.",
                    type: 'number',
                },
            },
            required: ['activity', 'expert', 'findings', 'item', 'role', 'state', 'tokens', 'turn'],
            type: 'object',
        },
        NcapAgentToolDelta: {
            description:
                'A sub-agent asking for a tool to be run on its behalf, answered on the data-response channel.',
            properties: {
                arguments: {
                    description: 'Raw JSON arguments, exactly as the agent wrote them.',
                    type: 'string',
                },
                item: {
                    description:
                        'The backlog item whose agent is asking, for attribution in the UI.',
                    type: 'number',
                },
                requestRef: {
                    type: 'number',
                },
                tool: {
                    type: 'string',
                },
            },
            required: ['arguments', 'item', 'requestRef', 'tool'],
            type: 'object',
        },
        NcapArtifactDelta: {
            description:
                "One item's DELIVERABLE, as it closes — the counterpart to a finding for work that MAKES rather\nthan checks.",
            properties: {
                artifact: {
                    type: 'string',
                },
                item: {
                    type: 'number',
                },
                title: {
                    description:
                        "The item's own title. An artifact carries no location and no severity to anchor it.",
                    type: 'string',
                },
            },
            required: ['artifact', 'item', 'title'],
            type: 'object',
        },
        NcapAsrTranscript: {
            description: 'Native ASR result over exact mono 16 kHz input.',
            properties: {
                audioSamples: {
                    type: 'number',
                },
                language: {
                    type: 'string',
                },
                text: {
                    type: 'string',
                },
            },
            required: ['audioSamples', 'language', 'text'],
            type: 'object',
        },
        NcapBlockDelta: {
            description:
                'A rich block the server decoded from the model stream, streamed in three phases.',
            properties: {
                blockId: {
                    description:
                        "Server-assigned numeric id, stable across the block's begin/delta/end.",
                    type: 'number',
                },
                blockKind: {
                    description:
                        "The block kind on `begin`: `code`, `bash`, `file_write`, `read`, `search`, `list`, `diff`,\nor `ask`. The server classifies the model's fenced action vocabulary into these.",
                    type: 'string',
                },
                language: {
                    description: 'The language on a `begin` for a code block.',
                    type: 'string',
                },
                path: {
                    description:
                        'The target path on a `begin` for a `file_write` / `read` / `list` block.',
                    type: 'string',
                },
                phase: {
                    description: '`begin` opens the block, `delta` appends to it, `end` closes it.',
                    enum: ['begin', 'delta', 'end'],
                    type: 'string',
                },
                query: {
                    description: 'The query on a `begin` for a `search` block.',
                    type: 'string',
                },
                text: {
                    description: 'The appended text on a `delta`.',
                    type: 'string',
                },
            },
            required: ['blockId', 'phase'],
            type: 'object',
        },
        NcapDelta: {
            description:
                'A single streamed delta from the engine.\n\nUnder NCAP the server DECODES the model stream into typed packets, so a delta carries exactly one\nof: answer `content`, `reasoning`, an engine `status`, a `block` phase, a `tool` call, or one of\nthe out-of-band reports (graph, backlog, roster, findings, learning, research, skills).',
            properties: {
                agent: {
                    $ref: '#/definitions/NcapAgentDelta',
                    description: "One agent's own record from the live fan-out, for the roster.",
                },
                agentId: {
                    description:
                        "The response's numeric `agent_id`. `0` for a plain turn; in a batch it is the sub-request's\n`subId`, so the caller routes each delta to the right sub-stream.",
                    type: 'number',
                },
                agentTool: {
                    $ref: '#/definitions/NcapAgentToolDelta',
                    description: 'A sub-agent asking for a tool to be run on its behalf.',
                },
                artifact: {
                    $ref: '#/definitions/NcapArtifactDelta',
                    description: "One item's DELIVERABLE, as that item closes.",
                },
                asr: {
                    $ref: '#/definitions/NcapAsrTranscript',
                    description: 'Native transcription, separate from assistant content.',
                },
                backlog: {
                    anyOf: [
                        {
                            properties: {
                                goal: {
                                    type: 'string',
                                },
                                itemCount: {
                                    type: 'number',
                                },
                                phase: {
                                    const: 'begin',
                                    type: 'string',
                                },
                            },
                            required: ['goal', 'itemCount', 'phase'],
                            type: 'object',
                        },
                        {
                            properties: {
                                acceptance: {
                                    description:
                                        "The criteria this item is judged against, in the planner's own words.",
                                    items: {
                                        type: 'string',
                                    },
                                    type: 'array',
                                },
                                dependsOn: {
                                    items: {
                                        type: 'number',
                                    },
                                    type: 'array',
                                },
                                id: {
                                    type: 'number',
                                },
                                kind: {
                                    type: 'string',
                                },
                                parent: {
                                    type: ['null', 'number'],
                                },
                                phase: {
                                    const: 'item',
                                    type: 'string',
                                },
                                points: {
                                    description:
                                        "The planner's estimate. Drives a client's Definition-of-Ready model.",
                                    type: 'number',
                                },
                                status: {
                                    type: 'string',
                                },
                                title: {
                                    type: 'string',
                                },
                            },
                            required: [
                                'acceptance',
                                'dependsOn',
                                'id',
                                'kind',
                                'parent',
                                'phase',
                                'points',
                                'status',
                                'title',
                            ],
                            type: 'object',
                        },
                        {
                            properties: {
                                activity: {
                                    description:
                                        'What the agent said it is doing this turn, in its own words. Empty until it says.',
                                    type: 'string',
                                },
                                findings: {
                                    type: 'number',
                                },
                                id: {
                                    type: 'number',
                                },
                                phase: {
                                    const: 'update',
                                    type: 'string',
                                },
                                status: {
                                    type: 'string',
                                },
                                turn: {
                                    description:
                                        "Which turn this item's agent is on. `0` before it has taken one. There is no ceiling to\ndivide it by: nothing bounds an agent's turns.",
                                    type: 'number',
                                },
                            },
                            required: ['activity', 'findings', 'id', 'phase', 'status', 'turn'],
                            type: 'object',
                        },
                        {
                            properties: {
                                done: {
                                    type: 'number',
                                },
                                failed: {
                                    type: 'number',
                                },
                                phase: {
                                    const: 'end',
                                    type: 'string',
                                },
                                skipped: {
                                    type: 'number',
                                },
                                stoppedBy: {
                                    description:
                                        'Why the run stopped, in words, so a PARTIAL run can say that it is partial.',
                                    type: 'string',
                                },
                            },
                            required: ['done', 'failed', 'phase', 'skipped', 'stoppedBy'],
                            type: 'object',
                        },
                    ],
                    description:
                        'A live backlog the ENGINE built for this turn: the goal decomposed and fanned out.',
                },
                block: {
                    $ref: '#/definitions/NcapBlockDelta',
                    description: 'A live rich-block phase (begin/delta/end) decoded server-side.',
                },
                content: {
                    description: 'Answer content for this chunk (empty on a non-content chunk).',
                    type: 'string',
                },
                conversationId: {
                    description:
                        'The server-owned conversation id for this turn, surfaced early (from `AgentBegin`).',
                    type: 'string',
                },
                expert: {
                    description:
                        "The EXPERT the server's pre-flight reflection chose to handle this turn.",
                    properties: {
                        id: {
                            type: 'string',
                        },
                        index: {
                            type: 'number',
                        },
                        pass: {
                            type: 'number',
                        },
                        why: {
                            type: 'string',
                        },
                    },
                    required: ['id', 'index', 'pass', 'why'],
                    type: 'object',
                },
                finding: {
                    $ref: '#/definitions/NcapFindingDelta',
                    description: 'One DEDUPED finding from a closed fan-out, with its words.',
                },
                geometry: {
                    anyOf: [
                        {
                            properties: {
                                model: {
                                    type: 'string',
                                },
                                phase: {
                                    const: 'accepted',
                                    type: 'string',
                                },
                                seed: {
                                    type: 'number',
                                },
                            },
                            required: ['model', 'phase', 'seed'],
                            type: 'object',
                        },
                        {
                            properties: {
                                completed: {
                                    type: 'number',
                                },
                                phase: {
                                    const: 'progress',
                                    type: 'string',
                                },
                                stage: {
                                    type: 'number',
                                },
                                total: {
                                    type: 'number',
                                },
                            },
                            required: ['completed', 'phase', 'stage', 'total'],
                            type: 'object',
                        },
                        {
                            properties: {
                                assetId: {
                                    type: 'number',
                                },
                                data: {
                                    items: {
                                        type: 'number',
                                    },
                                    type: 'array',
                                },
                                format: {
                                    $ref: '#/definitions/GeometryFormat',
                                },
                                offset: {
                                    type: 'number',
                                },
                                phase: {
                                    enum: ['chunk', 'preview'],
                                    type: 'string',
                                },
                                revision: {
                                    type: 'number',
                                },
                                totalBytes: {
                                    type: 'number',
                                },
                            },
                            required: [
                                'assetId',
                                'data',
                                'format',
                                'offset',
                                'phase',
                                'revision',
                                'totalBytes',
                            ],
                            type: 'object',
                        },
                        {
                            properties: {
                                assetId: {
                                    type: 'number',
                                },
                                phase: {
                                    const: 'end',
                                    type: 'string',
                                },
                                totalBytes: {
                                    type: 'number',
                                },
                            },
                            required: ['assetId', 'phase', 'totalBytes'],
                            type: 'object',
                        },
                    ],
                    description:
                        'Native 3D generation event; binary asset data stays outside model text.',
                },
                graph: {
                    $ref: '#/definitions/NcapGraphDelta',
                    description: 'A live project-graph event for the knowledge-graph view.',
                },
                image: {
                    anyOf: [
                        {
                            properties: {
                                data: {
                                    items: {
                                        type: 'number',
                                    },
                                    type: 'array',
                                },
                                index: {
                                    type: 'number',
                                },
                                offset: {
                                    type: 'number',
                                },
                                phase: {
                                    const: 'chunk',
                                    type: 'string',
                                },
                            },
                            required: ['data', 'index', 'offset', 'phase'],
                            type: 'object',
                        },
                        {
                            properties: {
                                height: {
                                    type: 'number',
                                },
                                index: {
                                    type: 'number',
                                },
                                phase: {
                                    const: 'end',
                                    type: 'string',
                                },
                                totalBytes: {
                                    type: 'number',
                                },
                                transparent: {
                                    type: 'boolean',
                                },
                                width: {
                                    type: 'number',
                                },
                            },
                            required: [
                                'height',
                                'index',
                                'phase',
                                'totalBytes',
                                'transparent',
                                'width',
                            ],
                            type: 'object',
                        },
                    ],
                },
                preflight: {
                    description:
                        'The full pre-flight reflection for the panel shown before the answer streams.',
                    properties: {
                        expertId: {
                            type: 'string',
                        },
                        items: {
                            items: {
                                properties: {
                                    label: {
                                        type: 'string',
                                    },
                                    value: {
                                        type: 'string',
                                    },
                                },
                                required: ['label', 'value'],
                                type: 'object',
                            },
                            type: 'array',
                        },
                        subQuestions: {
                            items: {
                                type: 'string',
                            },
                            type: 'array',
                        },
                    },
                    required: ['expertId', 'items', 'subQuestions'],
                    type: 'object',
                },
                reasoning: {
                    description:
                        'Reasoning / thinking-trace text for this chunk (empty on a non-reasoning chunk).',
                    type: 'string',
                },
                reflection: {
                    description:
                        "The reflection stage's reasoning. Display-only: it never becomes part of the persisted\nassistant turn.",
                    properties: {
                        stages: {
                            items: {
                                properties: {
                                    label: {
                                        type: 'string',
                                    },
                                    text: {
                                        type: 'string',
                                    },
                                },
                                required: ['label', 'text'],
                                type: 'object',
                            },
                            type: 'array',
                        },
                    },
                    required: ['stages'],
                    type: 'object',
                },
                research: {
                    $ref: '#/definitions/NcapResearchDelta',
                    description: 'One step of working an UNSOLVED problem.',
                },
                segmentation: {
                    $ref: '#/definitions/SegmentationFrame',
                },
                skill: {
                    $ref: '#/definitions/NcapSkillDelta',
                    description: 'One skill the engine ingested.',
                },
                status: {
                    description:
                        'An out-of-band engine lifecycle status carried by a chunk with no text.',
                    type: 'string',
                },
                steer: {
                    $ref: '#/definitions/NcapSteerDelta',
                    description: 'One SUPERVISION ROUND of a decomposed run.',
                },
                tool: {
                    $ref: '#/definitions/NcapToolCall',
                    description: 'A tool call the client must execute.',
                },
                usage: {
                    $ref: '#/definitions/NcapUsage',
                    description: 'A live, non-terminal token-usage / progress update.',
                },
                video: {
                    anyOf: [
                        {
                            properties: {
                                fps: {
                                    type: 'number',
                                },
                                frames: {
                                    type: 'number',
                                },
                                height: {
                                    type: 'number',
                                },
                                model: {
                                    type: 'string',
                                },
                                phase: {
                                    const: 'accepted',
                                    type: 'string',
                                },
                                videoId: {
                                    type: 'string',
                                },
                                width: {
                                    type: 'number',
                                },
                            },
                            required: [
                                'fps',
                                'frames',
                                'height',
                                'model',
                                'phase',
                                'videoId',
                                'width',
                            ],
                            type: 'object',
                        },
                        {
                            properties: {
                                completed: {
                                    type: 'number',
                                },
                                phase: {
                                    const: 'progress',
                                    type: 'string',
                                },
                                stage: {
                                    type: 'number',
                                },
                                total: {
                                    type: 'number',
                                },
                                videoId: {
                                    type: 'string',
                                },
                            },
                            required: ['completed', 'phase', 'stage', 'total', 'videoId'],
                            type: 'object',
                        },
                        {
                            properties: {
                                data: {
                                    items: {
                                        type: 'number',
                                    },
                                    type: 'array',
                                },
                                offset: {
                                    type: 'number',
                                },
                                phase: {
                                    const: 'chunk',
                                    type: 'string',
                                },
                                videoId: {
                                    type: 'string',
                                },
                            },
                            required: ['data', 'offset', 'phase', 'videoId'],
                            type: 'object',
                        },
                        {
                            properties: {
                                phase: {
                                    const: 'end',
                                    type: 'string',
                                },
                                totalBytes: {
                                    type: 'number',
                                },
                                videoId: {
                                    type: 'string',
                                },
                            },
                            required: ['phase', 'totalBytes', 'videoId'],
                            type: 'object',
                        },
                    ],
                    description:
                        'One accepted/progress/content/end event from native video generation.',
                },
                voice: {
                    description: '80 ms of the model speaking, 24 kHz mono PCM16.',
                    items: {
                        type: 'number',
                    },
                    type: 'array',
                },
            },
            required: ['content', 'reasoning'],
            type: 'object',
        },
        NcapFindingDelta: {
            description: 'One deduped finding a decomposed run produced, as the engine holds it.',
            properties: {
                claim: {
                    type: 'string',
                },
                evidence: {
                    description: "The worker's own supporting quote. Empty when it gave none.",
                    type: 'string',
                },
                location: {
                    description:
                        '`path:line`, or whatever locator the worker gave. One string: the engine does not guarantee\nthe `path:line` shape, so splitting it would invent a line number.',
                    type: 'string',
                },
                reporters: {
                    description:
                        'EVERY item that reported it, not just the copy that survived the dedup.',
                    items: {
                        type: 'number',
                    },
                    type: 'array',
                },
                seen: {
                    description: 'How many workers reported this same defect.',
                    type: 'number',
                },
                severity: {
                    description: '`info` | `low` | `medium` | `high` | `critical`, worst last.',
                    type: 'string',
                },
            },
            required: ['claim', 'evidence', 'location', 'reporters', 'seen', 'severity'],
            type: 'object',
        },
        NcapGraphDelta: {
            description:
                'A live project-graph event decoded from a `Graph*` frame. The server streams the codebase graph as\nit builds it: `begin` opens a graph session (the client resets its store for it), `node`/`edge`\nappend entities/relations, `grounding` updates the active subgraph highlight, and `end` marks the\nbatch complete.',
            properties: {
                edge: {
                    $ref: '#/definitions/NcapGraphEdge',
                    description: '`edge`: the appended relation.',
                },
                grounding: {
                    $ref: '#/definitions/NcapGrounding',
                    description: '`grounding`: the active-subgraph overlay.',
                },
                node: {
                    $ref: '#/definitions/NcapGraphNode',
                    description: '`node`: the appended entity.',
                },
                phase: {
                    enum: ['begin', 'edge', 'end', 'grounding', 'node'],
                    type: 'string',
                },
                session: {
                    description: '`begin`: the graph session id.',
                    type: 'string',
                },
            },
            required: ['phase'],
            type: 'object',
        },
        NcapGraphEdge: {
            description: 'One relation decoded from a `GraphEdge` frame.',
            properties: {
                confidence: {
                    type: 'number',
                },
                kind: {
                    description:
                        'An edge-kind string; exact kinds carry confidence 1, probabilistic ones below 1.',
                    type: 'string',
                },
                source: {
                    type: 'string',
                },
                span: {
                    anyOf: [
                        {
                            $ref: '#/definitions/NcapGraphSpan',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                target: {
                    type: 'string',
                },
            },
            required: ['confidence', 'kind', 'source', 'span', 'target'],
            type: 'object',
        },
        NcapGraphNode: {
            description: 'One code entity decoded from a `GraphNode` frame.',
            properties: {
                generated: {
                    type: 'boolean',
                },
                id: {
                    type: 'string',
                },
                kind: {
                    description:
                        'A node-kind string (e.g. `file`, `function`); the store validates it.',
                    type: 'string',
                },
                label: {
                    type: 'string',
                },
                language: {
                    type: 'string',
                },
                overlayDirty: {
                    type: 'boolean',
                },
                owner: {
                    type: ['null', 'string'],
                },
                parent: {
                    type: ['null', 'string'],
                },
                recentChange: {
                    type: ['null', 'string'],
                },
                resolution: {
                    description: 'A node-resolution string (`package` / `module` / `symbol`).',
                    type: 'string',
                },
                span: {
                    anyOf: [
                        {
                            $ref: '#/definitions/NcapGraphSpan',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                summary: {
                    type: ['null', 'string'],
                },
            },
            required: [
                'generated',
                'id',
                'kind',
                'label',
                'language',
                'overlayDirty',
                'owner',
                'parent',
                'recentChange',
                'resolution',
                'span',
                'summary',
            ],
            type: 'object',
        },
        NcapGraphSpan: {
            description:
                'A source location decoded from a graph frame: where an entity or relation is evidenced.',
            properties: {
                line: {
                    type: 'number',
                },
                path: {
                    type: 'string',
                },
            },
            required: ['line', 'path'],
            type: 'object',
        },
        NcapGrounding: {
            description:
                'The grounding overlay decoded from a `GroundingUpdate` frame (the active/highlighted subgraph).',
            properties: {
                activeReferences: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                anchors: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                mode: {
                    description: '`off` | `local` | `auto` | `deep` | `audit`.',
                    type: 'string',
                },
                overlayChanges: {
                    type: 'number',
                },
                snapshot: {
                    type: 'string',
                },
                verification: {
                    description: '`none` | `pending` | `passed` | `failed`.',
                    type: 'string',
                },
            },
            required: [
                'activeReferences',
                'anchors',
                'mode',
                'overlayChanges',
                'snapshot',
                'verification',
            ],
            type: 'object',
        },
        NcapResearchDelta: {
            description: 'One step of a research run on an unsolved problem.',
            properties: {
                claim: {
                    description: 'The claim in one line, when the frame carries one.',
                    type: 'string',
                },
                detail: {
                    description: "The engine's own line for this frame.",
                    type: 'string',
                },
                disputed: {
                    description:
                        'True when ANOTHER line settled this same claim the OTHER way. Orthogonal to `status`.',
                    type: 'boolean',
                },
                line: {
                    description:
                        'The line of attack this frame is about, or empty when it is about the run itself.',
                    type: 'string',
                },
                lines: {
                    description: 'How many lines of attack are open.',
                    type: 'number',
                },
                phase: {
                    description:
                        '`opened` | `working` | `reported` | `again` | `settled` | `bare`, or `unknown` from a newer\nengine. `bare` means the run established nothing, which is an HONEST outcome of research and\nmust never be rendered as an error.',
                    type: 'string',
                },
                problem: {
                    description: 'The problem being worked, as the user stated it. Never empty.',
                    type: 'string',
                },
                round: {
                    description: 'The round within this run.',
                    type: 'number',
                },
                roundsTotal: {
                    description: 'Rounds across EVERY run this machine has done on this problem.',
                    type: 'number',
                },
                status: {
                    description:
                        '`failed` | `inconclusive` | `cases` | `reduced` | `refuted` | `proved`, or null before a line\nhas reported. Never collapse these: `reduced` is not a proof and `cases` is not a theorem.',
                    type: ['null', 'string'],
                },
                tokens: {
                    description: 'What the run has cost so far, as the engine estimates it.',
                    type: 'number',
                },
            },
            required: [
                'claim',
                'detail',
                'disputed',
                'line',
                'lines',
                'phase',
                'problem',
                'round',
                'roundsTotal',
                'status',
                'tokens',
            ],
            type: 'object',
        },
        NcapSkillDelta: {
            description: 'One skill the engine ingested, and what it has done this run.',
            properties: {
                always: {
                    description: 'Whether it bypasses matching and applies to every item.',
                    type: 'boolean',
                },
                applied: {
                    description:
                        'How many it was actually injected into. Lower than `matched` means the budget bit.',
                    type: 'number',
                },
                checkable: {
                    description:
                        'Whether it carries a `requires:`/`forbids:` clause the engine can CHECK rather than only\ninject — the difference between a directive that is enforced and one merely offered.',
                    type: 'boolean',
                },
                description: {
                    type: 'string',
                },
                detail: {
                    type: 'string',
                },
                file: {
                    type: 'string',
                },
                matched: {
                    description: 'How many items it matched this run.',
                    type: 'number',
                },
                name: {
                    type: 'string',
                },
                source: {
                    description:
                        '`project` | `claude` | `user` — where it was found, which is also its precedence.',
                    type: 'string',
                },
                state: {
                    description:
                        '`ingested` | `applied` | `squeezed` | `enforced` | `refused` | `unknown`.',
                    type: 'string',
                },
            },
            required: [
                'always',
                'applied',
                'checkable',
                'description',
                'detail',
                'file',
                'matched',
                'name',
                'source',
                'state',
            ],
            type: 'object',
        },
        NcapSteerDelta: {
            description:
                'One supervision round of a decomposed run: what the supervisor concluded and every directive.',
            properties: {
                directives: {
                    items: {
                        properties: {
                            item: {
                                description:
                                    'The item it names, or null for a directive that names none. Item id 0 is a REAL id.',
                                type: ['null', 'number'],
                            },
                            kind: {
                                description:
                                    '`plan` | `depend` | `accept` | `reject` | `done`, or `unknown` from a newer server.',
                                type: 'string',
                            },
                            text: {
                                type: 'string',
                            },
                        },
                        required: ['item', 'kind', 'text'],
                        type: 'object',
                    },
                    type: 'array',
                },
                round: {
                    type: 'number',
                },
                summary: {
                    description:
                        "The supervisor's own statement of what was achieved, when it signed the goal off.",
                    type: 'string',
                },
            },
            required: ['directives', 'round', 'summary'],
            type: 'object',
        },
        NcapToolCall: {
            description:
                'A tool the server asked the client to execute, decoded from the model stream.',
            properties: {
                arguments: {
                    description:
                        'JSON-encoded arguments (may be partial JSON while `partial` is true).',
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
                partial: {
                    description:
                        'A live preview of a call the model is still typing: render the forming action but do NOT\nexecute it. The authoritative call (no `partial`) arrives at completion and is what runs.',
                    type: 'boolean',
                },
                toolCallId: {
                    type: 'number',
                },
            },
            required: ['arguments', 'name', 'toolCallId'],
            type: 'object',
        },
        NcapUsage: {
            description: 'Live, non-terminal token usage for the whole turn.',
            properties: {
                cachedTokens: {
                    description: 'The subset of `promptTokens` served from the prefix cache.',
                    type: 'number',
                },
                completionTokens: {
                    type: 'number',
                },
                maxTokens: {
                    description: 'The max-token ceiling; `0` means uncapped.',
                    type: 'number',
                },
                promptTokens: {
                    type: 'number',
                },
            },
            required: ['cachedTokens', 'completionTokens', 'maxTokens', 'promptTokens'],
            type: 'object',
        },
        NetworkBody: {
            description:
                'Metadata for an observed payload, independently of whether its text is available.',
            properties: {
                binary: {
                    type: 'boolean',
                },
                bytes: {
                    type: ['null', 'string'],
                },
                captured: {
                    type: 'boolean',
                },
                characters: {
                    type: 'number',
                },
                mimeType: {
                    type: 'string',
                },
                redacted: {
                    type: 'boolean',
                },
                sha256: {
                    type: ['null', 'string'],
                },
            },
            required: [
                'binary',
                'bytes',
                'captured',
                'characters',
                'mimeType',
                'redacted',
                'sha256',
            ],
            type: 'object',
        },
        NetworkDetailView: {
            description:
                'Request detail views share stable source pointers and independently paged text.\nOne saved request representation.',
            enum: [
                'query',
                'reported',
                'request-body',
                'request-headers',
                'response-body',
                'response-headers',
                'timings',
            ],
            type: 'string',
        },
        NetworkFormat: {
            description:
                'Source formats decoded without replaying captured traffic.\nSupported capture formats.',
            enum: ['har', 'mitmproxy'],
            type: 'string',
        },
        NetworkIssue: {
            description: 'Explicit missing or rejected capture coverage.',
            properties: {
                location: {
                    type: 'string',
                },
                message: {
                    type: 'string',
                },
            },
            required: ['location', 'message'],
            type: 'object',
        },
        NetworkNativeSource: {
            description:
                'Native coordinates are exact decimal byte offsets in the immutable input.',
            properties: {
                end: {
                    type: 'string',
                },
                flowId: {
                    type: ['null', 'string'],
                },
                flowType: {
                    type: ['null', 'string'],
                },
                ordinal: {
                    type: 'string',
                },
                start: {
                    type: 'string',
                },
                stateVersion: {
                    type: ['null', 'string'],
                },
            },
            required: ['end', 'flowId', 'flowType', 'ordinal', 'start', 'stateVersion'],
            type: 'object',
        },
        NetworkRequest: {
            description: 'Compact request directory row with an immutable HAR JSON pointer.',
            properties: {
                durationMs: {
                    type: ['null', 'number'],
                },
                id: {
                    type: 'string',
                },
                location: {
                    type: 'string',
                },
                method: {
                    type: ['null', 'string'],
                },
                mimeType: {
                    type: 'string',
                },
                native: {
                    $ref: '#/definitions/NetworkNativeSource',
                    description:
                        'Native coordinates are exact decimal byte offsets in the immutable input.',
                },
                requestBody: {
                    $ref: '#/definitions/NetworkBody',
                },
                responseBody: {
                    $ref: '#/definitions/NetworkBody',
                },
                startedDateTime: {
                    type: ['null', 'string'],
                },
                status: {
                    type: ['null', 'number'],
                },
                url: {
                    type: ['null', 'string'],
                },
                urlTruncated: {
                    type: 'boolean',
                },
            },
            required: [
                'durationMs',
                'id',
                'location',
                'method',
                'mimeType',
                'requestBody',
                'responseBody',
                'startedDateTime',
                'status',
                'url',
                'urlTruncated',
            ],
            type: 'object',
        },
        ObjectSchema: {
            description:
                'Closed objects reject accidental fields, while open objects retain extension data.',
            properties: {
                additional: {
                    type: 'boolean',
                },
                fields: {
                    items: {
                        $ref: '#/definitions/SchemaField',
                    },
                    type: 'array',
                },
                kind: {
                    const: 'object',
                    type: 'string',
                },
                nullable: {
                    type: 'boolean',
                },
            },
            required: ['additional', 'fields', 'kind', 'nullable'],
            type: 'object',
        },
        OkResult: {
            description: 'The answer to a method that only reports success.',
            properties: {
                ok: {
                    const: true,
                    type: 'boolean',
                },
            },
            required: ['ok'],
            type: 'object',
        },
        'Omit<BrowserScriptSource,"text">': {
            properties: {
                bytes: {
                    type: ['null', 'string'],
                },
                sha256: {
                    type: ['null', 'string'],
                },
                state: {
                    $ref: '#/definitions/BrowserScriptSourceState',
                },
            },
            required: ['bytes', 'sha256', 'state'],
            type: 'object',
        },
        PendingApproval: {
            description: 'One approval waiting for a human.',
            properties: {
                approvalId: {
                    type: 'string',
                },
                detail: {
                    description:
                        'The exact command or path, so an operator approves what will actually run.\n\nCarried because an approval prompt without it is a rubber stamp: "run a shell command" is not\na decision anybody can make. It is the tool\'s own rendering, never the model\'s prose.',
                    type: 'string',
                },
                expiresAt: {
                    type: 'number',
                },
                principalId: {
                    type: 'string',
                },
                requestedAt: {
                    type: 'number',
                },
                risk: {
                    $ref: '#/definitions/RiskLevel',
                },
                runId: {
                    type: ['null', 'string'],
                },
                sessionId: {
                    type: ['null', 'string'],
                },
                summary: {
                    type: 'string',
                },
                tool: {
                    type: 'string',
                },
            },
            required: [
                'approvalId',
                'expiresAt',
                'principalId',
                'requestedAt',
                'risk',
                'runId',
                'sessionId',
                'summary',
                'tool',
            ],
            type: 'object',
        },
        PerformanceCohort: {
            description:
                'Input capability reports are not hardware or operating-system identification.',
            properties: {
                gamepadEnabled: {
                    type: 'boolean',
                },
                keyboardEnabled: {
                    type: 'boolean',
                },
                placeId: {
                    type: 'string',
                },
                placeVersion: {
                    type: 'string',
                },
                touchEnabled: {
                    type: 'boolean',
                },
            },
            required: [
                'gamepadEnabled',
                'keyboardEnabled',
                'placeId',
                'placeVersion',
                'touchEnabled',
            ],
            type: 'object',
        },
        PerformanceGroup: {
            description:
                'Aggregate metrics expose no player/session identifiers. Counts are decimal strings.',
            properties: {
                cohort: {
                    $ref: '#/definitions/PerformanceCohort',
                },
                frames: {
                    type: 'string',
                },
                maximumFrameMs: {
                    type: 'number',
                },
                meanSessionFps: {
                    type: 'number',
                },
                sampledDurationMs: {
                    type: 'number',
                },
                samples: {
                    type: 'number',
                },
                sessions: {
                    type: 'number',
                },
                slowFrameFraction: {
                    type: 'number',
                },
                slowFrames: {
                    type: 'string',
                },
                timeWeightedFps: {
                    type: 'number',
                },
            },
            required: [
                'cohort',
                'frames',
                'maximumFrameMs',
                'meanSessionFps',
                'sampledDurationMs',
                'samples',
                'sessions',
                'slowFrameFraction',
                'slowFrames',
                'timeWeightedFps',
            ],
            type: 'object',
        },
        PerformanceQuery: {
            description:
                'End-exclusive server-observed report timestamps; sample windows can begin before fromMs.',
            properties: {
                fromMs: {
                    type: 'string',
                },
                toMs: {
                    type: 'string',
                },
            },
            required: ['fromMs', 'toMs'],
            type: 'object',
        },
        PerformanceReport: {
            description:
                'Complete bounded selection with quality counts and collection diagnostics.',
            properties: {
                caveats: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                collection: {
                    $ref: '#/definitions/TelemetryHealth',
                    description:
                        'Owner-visible collection evidence, not a guarantee that the game emitted every required event.',
                },
                duplicateSamples: {
                    type: 'number',
                },
                generatedAtMs: {
                    type: 'string',
                },
                groups: {
                    items: {
                        $ref: '#/definitions/PerformanceGroup',
                    },
                    type: 'array',
                },
                ignoredSourceSamples: {
                    type: 'number',
                },
                invalidSamples: {
                    type: 'number',
                },
                latestSampleMs: {
                    type: ['null', 'string'],
                },
                query: {
                    $ref: '#/definitions/PerformanceQuery',
                },
            },
            required: [
                'caveats',
                'duplicateSamples',
                'generatedAtMs',
                'groups',
                'ignoredSourceSamples',
                'invalidSamples',
                'latestSampleMs',
                'query',
            ],
            type: 'object',
        },
        PersonalAgent: {
            description:
                "A user's own agent instructions; execution permissions always come from the deployment default.",
            properties: {
                id: {
                    type: 'string',
                },
                instructions: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
            },
            required: ['id', 'instructions', 'name'],
            type: 'object',
        },
        PersonalAgentInput: {
            description: 'Create with an empty id, or update an existing owned agent.',
            properties: {
                id: {
                    type: 'string',
                },
                instructions: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
            },
            required: ['id', 'instructions', 'name'],
            type: 'object',
        },
        PlanningAlignmentAnchor: {
            description: 'Server-created semantic anchors for the request and the proposed graph.',
            properties: {
                beforeHash: {
                    type: 'string',
                },
                graphHash: {
                    type: 'string',
                },
                requirements: {
                    items: {
                        $ref: '#/definitions/PlanningRequirementFingerprint',
                    },
                    type: 'array',
                },
                version: {
                    const: 1,
                    type: 'number',
                },
            },
            required: ['beforeHash', 'graphHash', 'requirements', 'version'],
            type: 'object',
        },
        PlanningBrief: {
            description: 'A bounded product brief; unanswered operational choices remain explicit.',
            properties: {
                assumptions: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                boundaries: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                budget: {
                    type: ['null', 'string'],
                },
                goal: {
                    type: 'string',
                },
                outputs: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                questions: {
                    items: {
                        $ref: '#/definitions/PlanningQuestion',
                    },
                    type: 'array',
                },
                requirements: {
                    items: {
                        $ref: '#/definitions/PlanningRequirement',
                    },
                    type: 'array',
                },
                schedule: {
                    type: ['null', 'string'],
                },
                sources: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
            },
            required: [
                'assumptions',
                'boundaries',
                'budget',
                'goal',
                'outputs',
                'questions',
                'requirements',
                'schedule',
                'sources',
            ],
            type: 'object',
        },
        PlanningDocument: {
            description:
                'Unsaved editor state is planning context, never an execution plan or permission grant.',
            properties: {
                details: {
                    $ref: '#/definitions/WorkflowDetails',
                },
                edges: {
                    items: {
                        $ref: '#/definitions/WorkflowEdge',
                    },
                    type: 'array',
                },
                nodes: {
                    items: {
                        $ref: '#/definitions/WorkflowNode',
                    },
                    type: 'array',
                },
                positions: {
                    items: {
                        $ref: '#/definitions/WorkflowPosition',
                    },
                    type: 'array',
                },
            },
            required: ['details', 'edges', 'nodes', 'positions'],
            type: 'object',
        },
        PlanningHistory: {
            properties: {
                nextRequestId: {
                    type: ['null', 'string'],
                },
                turns: {
                    items: {
                        $ref: '#/definitions/PlanningTurn',
                    },
                    type: 'array',
                },
            },
            required: ['nextRequestId', 'turns'],
            type: 'object',
        },
        PlanningHistoryRequest: {
            properties: {
                beforeRequestId: {
                    type: ['null', 'string'],
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['beforeRequestId', 'workflowId'],
            type: 'object',
        },
        PlanningQuestion: {
            properties: {
                choices: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                id: {
                    type: 'string',
                },
                text: {
                    type: 'string',
                },
            },
            required: ['choices', 'id', 'text'],
            type: 'object',
        },
        PlanningReply: {
            description:
                'Fingerprint pins the proposal to unsaved state as well as the persisted base revision.',
            properties: {
                alignment: {
                    $ref: '#/definitions/PlanningAlignmentAnchor',
                    description: 'Omitted on older stored replies; never supplied by the model.',
                },
                baseRevision: {
                    type: 'string',
                },
                brief: {
                    $ref: '#/definitions/PlanningBrief',
                },
                draftHash: {
                    type: 'string',
                },
                message: {
                    type: 'string',
                },
                patch: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowPatch',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                validation: {
                    $ref: '#/definitions/GraphValidation',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: [
                'baseRevision',
                'brief',
                'draftHash',
                'message',
                'patch',
                'validation',
                'workflowId',
            ],
            type: 'object',
        },
        PlanningRequest: {
            properties: {
                baseRevision: {
                    type: 'string',
                },
                document: {
                    $ref: '#/definitions/PlanningDocument',
                },
                message: {
                    type: 'string',
                },
                previousRequestId: {
                    type: ['null', 'string'],
                },
                requestId: {
                    type: 'string',
                },
                sourceIds: {
                    description:
                        'Explicit metadata selections; never resource grants. Omitted by older clients.',
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: [
                'baseRevision',
                'document',
                'message',
                'previousRequestId',
                'requestId',
                'workflowId',
            ],
            type: 'object',
        },
        PlanningRequirement: {
            description:
                "Links the user's intent to stable component identities without claiming execution readiness.",
            properties: {
                id: {
                    type: 'string',
                },
                nodeIds: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                state: {
                    $ref: '#/definitions/RequirementState',
                },
                text: {
                    type: 'string',
                },
            },
            required: ['id', 'nodeIds', 'state', 'text'],
            type: 'object',
        },
        PlanningRequirementFingerprint: {
            description:
                'A fingerprint detects graph drift; it never proves a requirement is fulfilled or runnable.',
            properties: {
                hash: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
            },
            required: ['hash', 'id'],
            type: 'object',
        },
        PlanningSource: {
            description:
                'Metadata only. No filesystem paths, credentials, file contents, or host telemetry.',
            properties: {
                id: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
                reason: {
                    type: 'string',
                },
                state: {
                    $ref: '#/definitions/PlanningSourceState',
                },
            },
            required: ['id', 'name', 'reason', 'state'],
            type: 'object',
        },
        PlanningSourcesPage: {
            properties: {
                available: {
                    type: 'boolean',
                },
                items: {
                    items: {
                        $ref: '#/definitions/PlanningSource',
                    },
                    type: 'array',
                },
                next: {
                    type: ['null', 'string'],
                },
            },
            required: ['available', 'items', 'next'],
            type: 'object',
        },
        PlanningSourcesRequest: {
            description:
                'Owner-scoped catalog pagination; a cursor is an opaque source identity, not a path.',
            properties: {
                after: {
                    type: ['null', 'string'],
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['after', 'workflowId'],
            type: 'object',
        },
        PlanningSourceState: {
            description:
                'Discovery of a registered source is not a grant or an executable resource binding.',
            enum: ['needs-adapter', 'unavailable'],
            type: 'string',
        },
        PlanningStatus: {
            enum: ['canceled', 'complete', 'failed', 'working'],
            type: 'string',
        },
        PlanningTurn: {
            description: 'A turn is a separate bounded record, not an ever-growing workflow field.',
            properties: {
                createdAtMs: {
                    type: 'string',
                },
                error: {
                    type: ['null', 'string'],
                },
                message: {
                    type: 'string',
                },
                previousRequestId: {
                    type: ['null', 'string'],
                },
                reply: {
                    anyOf: [
                        {
                            $ref: '#/definitions/PlanningReply',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                requestId: {
                    type: 'string',
                },
                sourceIds: {
                    description:
                        'Explicit metadata selections retained with this conversation turn.',
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                status: {
                    $ref: '#/definitions/PlanningStatus',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: [
                'createdAtMs',
                'error',
                'message',
                'previousRequestId',
                'reply',
                'requestId',
                'status',
                'workflowId',
            ],
            type: 'object',
        },
        PlanningTurnRef: {
            properties: {
                requestId: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['requestId', 'workflowId'],
            type: 'object',
        },
        PortCardinality: {
            enum: ['item', 'list', 'stream'],
            type: 'string',
        },
        PortDirection: {
            enum: ['input', 'output'],
            type: 'string',
        },
        PricingCalculation: {
            description:
                'Versions describe existing calculations, including their rounding behavior.\nStable calculation identity, independent of a mutable model name or configuration.',
            enum: ['report-tokens-v1', 'report-units-v1', 'wallet-tokens-v1'],
            type: 'string',
        },
        PricingTariff: {
            description:
                "Original decimal USD rates; absence retains the calculation's existing fallback semantics.",
            properties: {
                cacheWritePerMillion: {
                    type: 'string',
                },
                cachedInputPerMillion: {
                    type: 'string',
                },
                calculation: {
                    $ref: '#/definitions/PricingCalculation',
                },
                inputPerMillion: {
                    type: 'string',
                },
                outputPerMillion: {
                    type: 'string',
                },
                perCall: {
                    type: 'string',
                },
                perThousandUnits: {
                    type: 'string',
                },
            },
            required: ['calculation'],
            type: 'object',
        },
        ProcessInput: {
            description: 'Keystrokes are bounded and addressed through the owning session.',
            properties: {
                data: {
                    type: 'string',
                },
                processId: {
                    type: 'string',
                },
                sessionId: {
                    type: 'string',
                },
            },
            required: ['data', 'processId', 'sessionId'],
            type: 'object',
        },
        ProcessLogRef: {
            description:
                'Incremental reads share the same bounded log endpoint as background job tails.',
            properties: {
                offset: {
                    type: 'string',
                },
                processId: {
                    type: 'string',
                },
                sessionId: {
                    type: 'string',
                },
            },
            required: ['processId', 'sessionId'],
            type: 'object',
        },
        ProcessResize: {
            description: 'Terminal dimensions are small positive integers.',
            properties: {
                cols: {
                    type: 'number',
                },
                processId: {
                    type: 'string',
                },
                rows: {
                    type: 'number',
                },
                sessionId: {
                    type: 'string',
                },
            },
            required: ['cols', 'processId', 'rows', 'sessionId'],
            type: 'object',
        },
        ReasoningOptions: {
            description: 'Reasoning configuration for a request.',
            properties: {
                effort: {
                    description:
                        'How hard the model should think before answering.\n\nSix tiers rather than four because the ends of the range are real and providers price them apart.\n`Minimal` is a distinct setting on current OpenAI models — nearly no reasoning, but not none —\nand `XHigh` is the recommended tier for agentic coding on several of them. A five-tier ladder\nmakes both unreachable, which means a caller cannot request the setting the provider itself\nrecommends. A provider without a given tier ladders DOWN to its nearest supported one.',
                    enum: ['high', 'low', 'max', 'medium', 'minimal', 'off', 'xhigh'],
                    type: 'string',
                },
                include: {
                    description: 'Whether the reasoning trace should be streamed back at all.',
                    type: 'boolean',
                },
                maxTokens: {
                    description:
                        'A hard token budget for the reasoning trace, where the provider accepts one.',
                    type: 'number',
                },
            },
            type: 'object',
        },
        'Record<BrowserStorageGroup,BrowserStorageCoverage>': {
            properties: {
                'cache-storage': {
                    $ref: '#/definitions/BrowserStorageCoverage',
                },
                cookies: {
                    $ref: '#/definitions/BrowserStorageCoverage',
                },
                'indexed-db': {
                    $ref: '#/definitions/BrowserStorageCoverage',
                },
                'local-storage': {
                    $ref: '#/definitions/BrowserStorageCoverage',
                },
                'session-storage': {
                    $ref: '#/definitions/BrowserStorageCoverage',
                },
            },
            required: [
                'cache-storage',
                'cookies',
                'indexed-db',
                'local-storage',
                'session-storage',
            ],
            type: 'object',
        },
        'Record<BrowserStorageGroup,BrowserStorageGroupComparison>': {
            properties: {
                'cache-storage': {
                    $ref: '#/definitions/BrowserStorageGroupComparison',
                },
                cookies: {
                    $ref: '#/definitions/BrowserStorageGroupComparison',
                },
                'indexed-db': {
                    $ref: '#/definitions/BrowserStorageGroupComparison',
                },
                'local-storage': {
                    $ref: '#/definitions/BrowserStorageGroupComparison',
                },
                'session-storage': {
                    $ref: '#/definitions/BrowserStorageGroupComparison',
                },
            },
            required: [
                'cache-storage',
                'cookies',
                'indexed-db',
                'local-storage',
                'session-storage',
            ],
            type: 'object',
        },
        'Record<string,never>': {
            type: 'object',
            additionalProperties: false,
        },
        'Record<string,number>': {
            type: 'object',
            additionalProperties: {
                type: 'number',
            },
        },
        'Record<string,Scope>': {
            type: 'object',
            additionalProperties: {
                $ref: '#/definitions/Scope',
            },
        },
        'Record<string,string>': {
            type: 'object',
            additionalProperties: {
                type: 'string',
            },
        },
        'Record<string,string|number|boolean>': {
            type: 'object',
            additionalProperties: {
                anyOf: [
                    {
                        type: 'string',
                    },
                    {
                        type: 'number',
                    },
                    {
                        type: 'boolean',
                    },
                ],
            },
        },
        'Record<string,unknown>': {
            type: 'object',
            additionalProperties: {
                $ref: '#/definitions/JsonValue',
            },
        },
        ReminderAction: {
            description:
                'A durable message to the conversation that requested it; no model execution.',
            properties: {
                channelId: {
                    type: 'string',
                },
                conversationId: {
                    type: 'string',
                },
                kind: {
                    const: 'reminder',
                    type: 'string',
                },
                text: {
                    type: 'string',
                },
                threadId: {
                    type: 'string',
                },
            },
            required: ['channelId', 'conversationId', 'kind', 'text'],
            type: 'object',
        },
        RequirementState: {
            enum: ['drafted', 'missing', 'question'],
            type: 'string',
        },
        ResetAllowanceParams: {
            description:
                'A confirmed reset always applies to the exact displayed allowance generation.',
            properties: {
                cycle: {
                    type: 'string',
                },
                requestId: {
                    type: 'string',
                },
                week: {
                    type: 'string',
                },
            },
            required: ['cycle', 'requestId', 'week'],
            type: 'object',
        },
        ResetAllowanceResult: {
            description:
                'A successful mutation carries its immutable receipt, including on retries.',
            properties: {
                receipt: {
                    $ref: '#/definitions/ResetHistoryEntry',
                },
                requestId: {
                    type: 'string',
                },
                userId: {
                    type: 'string',
                },
            },
            required: ['receipt', 'requestId', 'userId'],
            type: 'object',
        },
        ResetHistoryEntry: {
            description: 'Owner-scoped reset evidence without operator grant/payment identifiers.',
            properties: {
                allowance: {
                    type: 'string',
                },
                previousHeld: {
                    type: 'string',
                },
                previousUsed: {
                    type: 'string',
                },
                recordedAt: {
                    type: 'number',
                },
                sequence: {
                    type: 'string',
                },
                week: {
                    type: 'string',
                },
            },
            required: [
                'allowance',
                'previousHeld',
                'previousUsed',
                'recordedAt',
                'sequence',
                'week',
            ],
            type: 'object',
        },
        ResetHistoryPage: {
            description: 'Stable descending pagination.',
            properties: {
                entries: {
                    items: {
                        $ref: '#/definitions/ResetHistoryEntry',
                    },
                    type: 'array',
                },
                next: {
                    type: ['null', 'string'],
                },
                userId: {
                    type: 'string',
                },
            },
            required: ['entries', 'next', 'userId'],
            type: 'object',
        },
        ResetSnapshot: {
            description:
                'JSON-safe reset state; generation tokens prevent stale tabs consuming another entitlement.',
            properties: {
                asOf: {
                    type: 'number',
                },
                available: {
                    type: 'string',
                },
                cycle: {
                    type: 'string',
                },
                userId: {
                    type: 'string',
                },
                week: {
                    type: 'string',
                },
            },
            required: ['asOf', 'available', 'cycle', 'userId', 'week'],
            type: 'object',
        },
        ResourceBinding: {
            description:
                'Saved requirement, including incomplete drafts. Never stores credentials or telemetry.',
            properties: {
                alias: {
                    type: 'string',
                },
                consumerId: {
                    description:
                        'Stable node/group identity controls which agent or step receives access.',
                    type: 'string',
                },
                family: {
                    $ref: '#/definitions/ResourceFamily',
                },
                id: {
                    type: 'string',
                },
                limits: {
                    $ref: '#/definitions/ResourceLimits',
                },
                maxAgeMs: {
                    description:
                        'Null allows unknown freshness. Otherwise runtime requires a fresh observed source time.',
                    type: ['null', 'string'],
                },
                operations: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                selection: {
                    anyOf: [
                        {
                            $ref: '#/definitions/ResourceSelection',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                use: {
                    $ref: '#/definitions/ResourceUse',
                },
                version: {
                    const: 1,
                    type: 'number',
                },
            },
            required: [
                'alias',
                'consumerId',
                'family',
                'id',
                'limits',
                'maxAgeMs',
                'operations',
                'selection',
                'use',
                'version',
            ],
            type: 'object',
        },
        ResourceFamily: {
            description:
                'External resource identity; these families never confer access themselves.\nSupported external resource families, distinct from account tenancy.',
            enum: ['application', 'compute', 'computer', 'database', 'feed', 'files', 'workspace'],
            type: 'string',
        },
        ResourceLimits: {
            description: 'Bounded read or job outputs, not a grant to ingest a whole source.',
            properties: {
                maxBytes: {
                    description: 'Unsigned canonical decimal, lossless on the JSON wire.',
                    type: 'string',
                },
                maxItems: {
                    type: 'number',
                },
            },
            required: ['maxBytes', 'maxItems'],
            type: 'object',
        },
        ResourceSchema: {
            description: 'Resource roles are nominal identities, not implicit runtime permissions.',
            properties: {
                kind: {
                    const: 'resource',
                    type: 'string',
                },
                nullable: {
                    type: 'boolean',
                },
                role: {
                    type: 'string',
                },
            },
            required: ['kind', 'nullable', 'role'],
            type: 'object',
        },
        ResourceSelection: {
            description:
                'An exact dataset/endpoint selection; paths never act as implicit permission prefixes.',
            properties: {
                connectionId: {
                    type: 'string',
                },
                connectorId: {
                    type: 'string',
                },
                connectorVersion: {
                    type: 'string',
                },
                resourceId: {
                    type: 'string',
                },
                targetId: {
                    type: 'string',
                },
            },
            required: ['connectionId', 'connectorId', 'connectorVersion', 'resourceId', 'targetId'],
            type: 'object',
        },
        ResourceUse: {
            description:
                'Attaching access, reading data, and placing computation are different operations.\nMeaning of a resource binding in the graph.',
            enum: ['attach', 'compute', 'read'],
            type: 'string',
        },
        ReverseApplicationSnapshot: {
            description:
                'Bounded projection for live Chat events; complete indexes are paged by the native query tool.',
            properties: {
                boundaries: {
                    items: {
                        $ref: '#/definitions/ApplicationBoundary',
                    },
                    type: 'array',
                },
                functionCount: {
                    type: 'number',
                },
                importCount: {
                    type: 'number',
                },
                ipcCount: {
                    type: 'number',
                },
                issueCount: {
                    type: 'number',
                },
                issues: {
                    items: {
                        $ref: '#/definitions/ApplicationIssue',
                    },
                    type: 'array',
                },
                languages: {
                    items: {
                        $ref: '#/definitions/SourceLanguage',
                    },
                    type: 'array',
                },
                moduleCount: {
                    type: 'number',
                },
                modules: {
                    items: {
                        $ref: '#/definitions/ApplicationModule',
                    },
                    type: 'array',
                },
                nativeAddonCount: {
                    type: 'number',
                },
                referenceCount: {
                    type: 'number',
                },
                routeCount: {
                    type: 'number',
                },
                sourceMapCount: {
                    type: 'number',
                },
                symbolCount: {
                    type: 'number',
                },
            },
            required: [
                'boundaries',
                'functionCount',
                'importCount',
                'ipcCount',
                'issueCount',
                'issues',
                'moduleCount',
                'modules',
                'nativeAddonCount',
                'routeCount',
                'sourceMapCount',
            ],
            type: 'object',
        },
        ReverseArchiveRef: {
            description: 'A session-owned archive, without query tokens or analyzer handles.',
            properties: {
                sessionId: {
                    type: 'string',
                },
            },
            required: ['sessionId'],
            type: 'object',
        },
        ReverseBrowserMetadata: {
            description: 'Immutable observation metadata, separate from retained event rows.',
            properties: {
                coverage: {
                    $ref: '#/definitions/BrowserActivityCoverage',
                },
                endedAt: {
                    type: 'string',
                },
                observationMs: {
                    type: 'number',
                },
                origin: {
                    type: 'string',
                },
                provider: {
                    const: 'cdp-passive',
                    type: 'string',
                },
                startedAt: {
                    type: 'string',
                },
                targetId: {
                    type: 'string',
                },
                url: {
                    type: 'string',
                },
            },
            required: [
                'coverage',
                'endedAt',
                'observationMs',
                'origin',
                'provider',
                'startedAt',
                'targetId',
                'url',
            ],
            type: 'object',
        },
        ReverseBrowserPage: {
            description: 'One bounded archive page proves both investigation and capture identity.',
            properties: {
                captureSha256: {
                    type: 'string',
                },
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                metadata: {
                    $ref: '#/definitions/ReverseBrowserMetadata',
                },
                nextCursor: {
                    type: ['null', 'string'],
                },
                records: {
                    items: {
                        $ref: '#/definitions/BrowserActivityRecord',
                    },
                    type: 'array',
                },
                runId: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
                total: {
                    type: 'number',
                },
            },
            required: [
                'captureSha256',
                'cursor',
                'evidenceId',
                'metadata',
                'nextCursor',
                'records',
                'runId',
                'sha256',
                'total',
            ],
            type: 'object',
        },
        ReverseBrowserQuery: {
            description: 'Only an archived evidence identity can select saved browser activity.',
            properties: {
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['evidenceId', 'id', 'runId'],
            type: 'object',
        },
        ReverseBrowserReference: {
            description:
                'Saved browser provenance identifies the original conversation, run and evidence content.',
            properties: {
                captureSha256: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                sessionId: {
                    type: 'string',
                },
            },
            required: ['captureSha256', 'evidenceId', 'runId', 'sessionId'],
            type: 'object',
        },
        ReverseBrowserSnapshot: {
            description:
                'A live run carries capture metadata and an event count, never all event rows.',
            properties: {
                coverage: {
                    $ref: '#/definitions/BrowserActivityCoverage',
                },
                endedAt: {
                    type: 'string',
                },
                observationMs: {
                    type: 'number',
                },
                origin: {
                    type: 'string',
                },
                provider: {
                    const: 'cdp-passive',
                    type: 'string',
                },
                recordCount: {
                    type: 'number',
                },
                reference: {
                    $ref: '#/definitions/ReverseBrowserReference',
                },
                startedAt: {
                    type: 'string',
                },
                targetId: {
                    type: 'string',
                },
                url: {
                    type: 'string',
                },
            },
            required: [
                'coverage',
                'endedAt',
                'observationMs',
                'origin',
                'provider',
                'recordCount',
                'reference',
                'startedAt',
                'targetId',
                'url',
            ],
            type: 'object',
        },
        ReverseCatalogPage: {
            description: 'An append-only catalog page; cursors are exact decimal record offsets.',
            properties: {
                cursor: {
                    type: 'string',
                },
                evidence: {
                    items: {
                        $ref: '#/definitions/ReverseEvidenceRecord',
                    },
                    type: 'array',
                },
                nextCursor: {
                    type: ['null', 'string'],
                },
                runId: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
                total: {
                    type: 'string',
                },
            },
            required: ['cursor', 'evidence', 'nextCursor', 'runId', 'sha256', 'total'],
            type: 'object',
        },
        ReverseCatalogQuery: {
            description:
                "Reads only an authenticated session's indexed investigation, never a workspace path.",
            properties: {
                cursor: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['id', 'runId'],
            type: 'object',
        },
        ReverseControlFlowInstruction: {
            description: 'One actual analyzer instruction, with an exact unsigned native address.',
            properties: {
                address: {
                    type: 'string',
                },
                instruction: {
                    type: 'string',
                },
            },
            required: ['address', 'instruction'],
            type: 'object',
        },
        ReverseDirectoryState: {
            description:
                'Explicit inventory coverage distinguishes absent, partial and complete indexing.\nOne function-directory lifecycle state.',
            enum: ['failed', 'indexing', 'partial', 'ready', 'unavailable'],
            type: 'string',
        },
        ReverseEngine: {
            description:
                'Installed native analyzer supplying a function directory.\nA supported native analyzer identity.',
            enum: ['ghidra', 'ida'],
            type: 'string',
        },
        ReverseEvidencePage: {
            description:
                'Original evidence text paged by UTF-16 offset, independent of model report previews.',
            properties: {
                characters: {
                    type: 'string',
                },
                cursor: {
                    type: 'string',
                },
                evidenceSha256: {
                    type: 'string',
                },
                nextCursor: {
                    type: ['null', 'string'],
                },
                originalEvidenceSha256: {
                    description:
                        'Present for a derived code page and always identifies the unmodified captured original.',
                    type: 'string',
                },
                record: {
                    $ref: '#/definitions/ReverseEvidenceRecord',
                },
                representation: {
                    enum: ['code', 'original'],
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
                text: {
                    type: 'string',
                },
            },
            required: [
                'characters',
                'cursor',
                'evidenceSha256',
                'nextCursor',
                'record',
                'runId',
                'sha256',
                'text',
            ],
            type: 'object',
        },
        ReverseEvidenceQuery: {
            description:
                'Evidence ids come from the saved catalog and cannot authorize arbitrary files.',
            properties: {
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                representation: {
                    description: 'Code is extracted at capture time; original remains the default.',
                    enum: ['code', 'original'],
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['evidenceId', 'id', 'runId'],
            type: 'object',
        },
        ReverseEvidenceRecord: {
            description:
                'Provenance for one immutable evidence file, shared by specialists in the same run.',
            properties: {
                characters: {
                    type: 'string',
                },
                createdAtMs: {
                    type: 'string',
                },
                excerpt: {
                    type: 'string',
                },
                expert: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                operation: {
                    type: 'string',
                },
                path: {
                    type: 'string',
                },
                selector: {
                    type: ['null', 'string'],
                },
                stepId: {
                    type: 'string',
                },
            },
            required: [
                'characters',
                'createdAtMs',
                'excerpt',
                'expert',
                'id',
                'operation',
                'path',
                'selector',
            ],
            type: 'object',
        },
        ReverseFunction: {
            description:
                'Durable metadata, with exact addresses and byte sizes represented as strings.',
            properties: {
                address: {
                    type: 'string',
                },
                bytes: {
                    type: ['null', 'string'],
                },
                name: {
                    type: 'string',
                },
            },
            required: ['address', 'bytes', 'name'],
            type: 'object',
        },
        ReverseFunctionsPage: {
            description:
                'At most fifty address-ordered function rows from a single owner-scoped inventory.',
            properties: {
                cursor: {
                    type: 'string',
                },
                engine: {
                    $ref: '#/definitions/ReverseEngine',
                },
                error: {
                    type: ['null', 'string'],
                },
                functions: {
                    items: {
                        $ref: '#/definitions/ReverseFunction',
                    },
                    type: 'array',
                },
                nextCursor: {
                    type: ['null', 'string'],
                },
                runId: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
                state: {
                    $ref: '#/definitions/ReverseDirectoryState',
                },
                total: {
                    type: 'string',
                },
            },
            required: [
                'cursor',
                'engine',
                'error',
                'functions',
                'nextCursor',
                'runId',
                'sha256',
                'state',
                'total',
            ],
            type: 'object',
        },
        ReverseFunctionsQuery: {
            description:
                'An authenticated directory read never accepts analyzer handles or filesystem paths.',
            properties: {
                cursor: {
                    type: 'string',
                },
                engine: {
                    $ref: '#/definitions/ReverseEngine',
                },
                filter: {
                    description:
                        'Literal case-insensitive name or address prefix, never a regular expression.',
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['engine', 'id', 'runId'],
            type: 'object',
        },
        ReverseGraphBlock: {
            description: 'Original coverage and presentation paging remain separate.',
            properties: {
                end: {
                    type: 'string',
                },
                endInclusive: {
                    description:
                        'Ghidra uses an inclusive last address; IDA uses an exclusive end address.',
                    type: 'boolean',
                },
                id: {
                    type: 'string',
                },
                instructionCount: {
                    type: 'number',
                },
                instructionOffset: {
                    type: 'number',
                },
                instructions: {
                    items: {
                        $ref: '#/definitions/ReverseControlFlowInstruction',
                    },
                    type: 'array',
                },
                instructionsTruncated: {
                    type: 'boolean',
                },
                nextInstructionOffset: {
                    type: ['null', 'number'],
                },
                start: {
                    type: 'string',
                },
                successors: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
            },
            required: [
                'end',
                'id',
                'instructionCount',
                'instructionOffset',
                'instructions',
                'instructionsTruncated',
                'nextInstructionOffset',
                'start',
                'successors',
            ],
            type: 'object',
        },
        ReverseGraphPage: {
            description:
                'Immutable graph provenance, with bounded block and instruction navigation.',
            properties: {
                blockId: {
                    type: ['null', 'string'],
                },
                capturedBlocks: {
                    type: 'number',
                },
                capturedOffset: {
                    type: 'number',
                },
                cursor: {
                    type: 'string',
                },
                evidenceSha256: {
                    type: 'string',
                },
                graph: {
                    $ref: '#/definitions/ReverseGraphProjection',
                },
                nextCursor: {
                    type: ['null', 'string'],
                },
                record: {
                    $ref: '#/definitions/ReverseEvidenceRecord',
                },
                runId: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
                uncapturedOffset: {
                    description:
                        'The next analyzer offset is absent from this capture; another inspection is required.',
                    type: ['null', 'number'],
                },
            },
            required: [
                'blockId',
                'capturedBlocks',
                'capturedOffset',
                'cursor',
                'evidenceSha256',
                'graph',
                'nextCursor',
                'record',
                'runId',
                'sha256',
                'uncapturedOffset',
            ],
            type: 'object',
        },
        ReverseGraphProjection: {
            description: 'At most four captured blocks and 12000 serialized block characters.',
            properties: {
                address: {
                    type: 'string',
                },
                blocks: {
                    items: {
                        $ref: '#/definitions/ReverseGraphBlock',
                    },
                    type: 'array',
                },
                function: {
                    type: 'string',
                },
                nextOffset: {
                    type: ['null', 'number'],
                },
                offset: {
                    type: 'number',
                },
                totalBlocks: {
                    type: 'number',
                },
            },
            required: ['address', 'blocks', 'function', 'nextOffset', 'offset', 'totalBlocks'],
            type: 'object',
        },
        ReverseGraphQuery: {
            description: 'Reads captured blocks, or an instruction page from one captured block.',
            properties: {
                blockId: {
                    description:
                        'When present, cursor addresses instructions in this block rather than captured blocks.',
                    type: 'string',
                },
                cursor: {
                    type: 'string',
                },
                evidenceId: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['evidenceId', 'id', 'runId'],
            type: 'object',
        },
        ReverseInspection: {
            description:
                'Read-only browser operations supported by an existing native analyzer lease.\nOne bounded native inspection operation.',
            enum: ['decompile', 'disassemble', 'graph', 'xrefs'],
            type: 'string',
        },
        ReverseInspectQuery: {
            description:
                'Operates only on a still-live, owner-scoped analyzer. No database id or query token crosses the wire.',
            properties: {
                cursor: {
                    type: 'string',
                },
                engine: {
                    $ref: '#/definitions/ReverseEngine',
                },
                filter: {
                    description:
                        'Literal case-insensitive name or address prefix, never a regular expression.',
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                offset: {
                    type: 'number',
                },
                operation: {
                    $ref: '#/definitions/ReverseInspection',
                },
                runId: {
                    type: 'string',
                },
                selector: {
                    type: 'string',
                },
            },
            required: ['engine', 'id', 'operation', 'runId', 'selector'],
            type: 'object',
        },
        ReverseInspectResult: {
            description:
                'Inspection captures immutable evidence; its text is read separately through the existing paged API.',
            properties: {
                record: {
                    $ref: '#/definitions/ReverseEvidenceRecord',
                },
                runId: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
            },
            required: ['record', 'runId', 'sha256'],
            type: 'object',
        },
        ReverseNetworkDetailPage: {
            description:
                'A complete saved projection digest, independent of the original body and source HAR digests.',
            properties: {
                body: {
                    anyOf: [
                        {
                            $ref: '#/definitions/NetworkBody',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                captureSha256: {
                    type: 'string',
                },
                characters: {
                    type: 'string',
                },
                cursor: {
                    type: 'string',
                },
                location: {
                    type: 'string',
                },
                nextCursor: {
                    type: ['null', 'string'],
                },
                runId: {
                    type: 'string',
                },
                selector: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
                text: {
                    type: 'string',
                },
                unavailable: {
                    type: ['null', 'string'],
                },
                view: {
                    $ref: '#/definitions/NetworkDetailView',
                },
            },
            required: [
                'body',
                'captureSha256',
                'characters',
                'cursor',
                'location',
                'nextCursor',
                'runId',
                'selector',
                'sha256',
                'text',
                'unavailable',
                'view',
            ],
            type: 'object',
        },
        ReverseNetworkDetailQuery: {
            description:
                'Selects only archive-owned entries; no path, capability or executable request crosses RPC.',
            properties: {
                cursor: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                selector: {
                    type: 'string',
                },
                view: {
                    $ref: '#/definitions/NetworkDetailView',
                },
            },
            required: ['id', 'runId', 'selector', 'view'],
            type: 'object',
        },
        ReverseNetworkDirectoryPage: {
            description:
                'Source-ordered metadata pages hold at most twenty rows and 12,000 serialized characters.',
            properties: {
                cursor: {
                    type: 'string',
                },
                error: {
                    type: ['null', 'string'],
                },
                nextCursor: {
                    type: ['null', 'string'],
                },
                requests: {
                    items: {
                        $ref: '#/definitions/ReverseNetworkDirectoryRow',
                    },
                    type: 'array',
                },
                runId: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
                sourceEntries: {
                    type: 'string',
                },
                state: {
                    $ref: '#/definitions/ReverseDirectoryState',
                },
                total: {
                    type: 'string',
                },
            },
            required: [
                'cursor',
                'error',
                'nextCursor',
                'requests',
                'runId',
                'sha256',
                'sourceEntries',
                'state',
                'total',
            ],
            type: 'object',
        },
        ReverseNetworkDirectoryQuery: {
            description: 'Metadata navigation never accepts a file path or analyzer capability.',
            properties: {
                cursor: {
                    type: 'string',
                },
                filter: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                method: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                status: {
                    type: 'number',
                },
            },
            required: ['id', 'runId'],
            type: 'object',
        },
        ReverseNetworkDirectoryRow: {
            description:
                'A request retains metadata even when no agent has captured either payload.',
            properties: {
                durationMs: {
                    type: ['null', 'number'],
                },
                id: {
                    type: 'string',
                },
                location: {
                    type: 'string',
                },
                method: {
                    type: ['null', 'string'],
                },
                mimeType: {
                    type: 'string',
                },
                native: {
                    $ref: '#/definitions/NetworkNativeSource',
                    description:
                        'Native coordinates are exact decimal byte offsets in the immutable input.',
                },
                requestBody: {
                    $ref: '#/definitions/NetworkBody',
                },
                requestEvidenceId: {
                    type: ['null', 'string'],
                },
                responseBody: {
                    $ref: '#/definitions/NetworkBody',
                },
                responseEvidenceId: {
                    type: ['null', 'string'],
                },
                startedDateTime: {
                    type: ['null', 'string'],
                },
                status: {
                    type: ['null', 'number'],
                },
                url: {
                    type: ['null', 'string'],
                },
                urlTruncated: {
                    type: 'boolean',
                },
            },
            required: [
                'durationMs',
                'id',
                'location',
                'method',
                'mimeType',
                'requestBody',
                'requestEvidenceId',
                'responseBody',
                'responseEvidenceId',
                'startedDateTime',
                'status',
                'url',
                'urlTruncated',
            ],
            type: 'object',
        },
        ReverseNetworkSnapshot: {
            description:
                'Bounded capability-free projection; full entries and payloads require paged evidence queries.',
            properties: {
                entryCount: {
                    type: 'number',
                },
                format: {
                    $ref: '#/definitions/NetworkFormat',
                },
                issueCount: {
                    type: 'number',
                },
                issues: {
                    items: {
                        $ref: '#/definitions/NetworkIssue',
                    },
                    type: 'array',
                },
                missingBodies: {
                    type: 'number',
                },
                redactedBodies: {
                    type: 'number',
                },
                requests: {
                    items: {
                        $ref: '#/definitions/NetworkRequest',
                    },
                    type: 'array',
                },
                version: {
                    type: 'string',
                },
            },
            required: [
                'entryCount',
                'format',
                'issueCount',
                'issues',
                'missingBodies',
                'redactedBodies',
                'requests',
                'version',
            ],
            type: 'object',
        },
        ReversePlanStep: {
            description:
                'An evidence-linked follow-up requested by a specialist and executed by the runtime.',
            properties: {
                attempts: {
                    type: 'number',
                },
                dependsOn: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                error: {
                    type: ['null', 'string'],
                },
                evidenceIds: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                expert: {
                    type: 'string',
                },
                finishedAtMs: {
                    type: ['null', 'string'],
                },
                id: {
                    type: 'string',
                },
                objective: {
                    type: 'string',
                },
                report: {
                    type: ['null', 'string'],
                },
                requestedBy: {
                    type: 'string',
                },
                scope: {
                    type: 'string',
                },
                startedAtMs: {
                    type: ['null', 'string'],
                },
                state: {
                    $ref: '#/definitions/ReverseState',
                },
            },
            required: [
                'attempts',
                'dependsOn',
                'error',
                'evidenceIds',
                'expert',
                'finishedAtMs',
                'id',
                'objective',
                'report',
                'requestedBy',
                'scope',
                'startedAtMs',
                'state',
            ],
            type: 'object',
        },
        ReverseRunSnapshot: {
            description:
                'Bounded, capability-free projection carried by live tool events and the final receipt.',
            properties: {
                application: {
                    $ref: '#/definitions/ReverseApplicationSnapshot',
                    description:
                        'Bounded projection for live Chat events; complete indexes are paged by the native query tool.',
                },
                archive: {
                    $ref: '#/definitions/ReverseArchiveRef',
                    description:
                        'A session-owned archive, without query tokens or analyzer handles.',
                },
                browser: {
                    $ref: '#/definitions/ReverseBrowserSnapshot',
                    description:
                        'A live run carries capture metadata and an event count, never all event rows.',
                },
                browserComparison: {
                    $ref: '#/definitions/BrowserScreenshotComparisonSnapshot',
                    description:
                        'Body-free progress also identifies the archived comparison report.',
                },
                browserInput: {
                    $ref: '#/definitions/BrowserAnalysisInput',
                    description:
                        'Body-free provenance links a derived shared analysis to the exact original browser capture.',
                },
                browserScreenshot: {
                    $ref: '#/definitions/BrowserScreenshotSnapshot',
                    description:
                        'Progress retains an owner-bound archive identity without any image data.',
                },
                browserSources: {
                    $ref: '#/definitions/BrowserSourcesSnapshot',
                    description:
                        'A native source capture references one immutable owner-scoped archive.',
                },
                browserStorage: {
                    $ref: '#/definitions/BrowserStorageSnapshot',
                    description:
                        'Progress identifies a saved redacted capture without embedding its rows.',
                },
                browserStorageComparison: {
                    $ref: '#/definitions/BrowserStorageComparisonSnapshot',
                    description:
                        'Archived progress binds the report itself independently of its two source captures.',
                },
                browserStructure: {
                    $ref: '#/definitions/BrowserStructureSnapshot',
                    description:
                        'A progress receipt references structure without carrying complete trees.',
                },
                browserWebMcp: {
                    $ref: '#/definitions/BrowserWebMcpSnapshot',
                    description:
                        'Progress binds metadata to the original report without tool/schema arrays.',
                },
                cleanupErrors: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                evidence: {
                    items: {
                        $ref: '#/definitions/ReverseEvidenceRecord',
                    },
                    type: 'array',
                },
                evidenceCount: {
                    type: 'number',
                },
                execution: {
                    description:
                        'Explicit resumed execution epoch; absent means the original execution.',
                    type: 'number',
                },
                id: {
                    type: 'string',
                },
                inputName: {
                    type: 'string',
                },
                kind: {
                    description:
                        'The runtime selects a target adapter; callers may make the choice explicit for ambiguous files.',
                    enum: ['browser', 'javascript', 'native', 'network', 'source'],
                    type: 'string',
                },
                network: {
                    $ref: '#/definitions/ReverseNetworkSnapshot',
                    description:
                        'Bounded capability-free projection; full entries and payloads require paged evidence queries.',
                },
                plan: {
                    items: {
                        $ref: '#/definitions/ReversePlanStep',
                    },
                    type: 'array',
                },
                question: {
                    type: 'string',
                },
                revision: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
                state: {
                    $ref: '#/definitions/ReverseState',
                },
                tasks: {
                    items: {
                        $ref: '#/definitions/ReverseTaskSnapshot',
                    },
                    type: 'array',
                },
                version: {
                    const: 1,
                    type: 'number',
                },
            },
            required: [
                'cleanupErrors',
                'evidence',
                'evidenceCount',
                'id',
                'inputName',
                'question',
                'revision',
                'sha256',
                'state',
                'tasks',
                'version',
            ],
            type: 'object',
        },
        ReverseState: {
            description:
                'Runtime task lifecycle, distinct from the truth of model-authored findings.\nPossible task and workflow states.',
            enum: ['cancelled', 'done', 'failed', 'partial', 'pending', 'running'],
            type: 'string',
        },
        ReverseTaskSnapshot: {
            description:
                'A runtime-owned step in the shared investigation plan. Reports remain unverified findings.',
            properties: {
                attempts: {
                    type: 'number',
                },
                dependsOn: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                error: {
                    type: ['null', 'string'],
                },
                expert: {
                    type: 'string',
                },
                finishedAtMs: {
                    type: ['null', 'string'],
                },
                report: {
                    type: ['null', 'string'],
                },
                startedAtMs: {
                    type: ['null', 'string'],
                },
                state: {
                    $ref: '#/definitions/ReverseState',
                },
            },
            required: [
                'attempts',
                'dependsOn',
                'error',
                'expert',
                'finishedAtMs',
                'report',
                'startedAtMs',
                'state',
            ],
            type: 'object',
        },
        RiskLevel: {
            description: 'How dangerous an action is.',
            enum: ['destructive', 'execute', 'read', 'write'],
            type: 'string',
        },
        RobloxCredentialSetParams: {
            properties: {
                apiKey: {
                    type: 'string',
                },
            },
            required: ['apiKey'],
            type: 'object',
        },
        RobloxCredentialStatus: {
            description:
                'Presence only: neither saved key material nor claims about Roblox permissions.',
            properties: {
                connected: {
                    type: 'boolean',
                },
                validated: {
                    const: false,
                    type: 'boolean',
                },
            },
            required: ['connected', 'validated'],
            type: 'object',
        },
        ScalarSchema: {
            description:
                'Primitive or named envelope type. Number values must be finite and safely represented.',
            properties: {
                choices: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                kind: {
                    $ref: '#/definitions/Exclude_1',
                },
                maxLength: {
                    type: 'number',
                },
                maximum: {
                    type: 'number',
                },
                minLength: {
                    type: 'number',
                },
                minimum: {
                    type: 'number',
                },
                nullable: {
                    type: 'boolean',
                },
                whole: {
                    type: 'boolean',
                },
            },
            required: ['kind', 'nullable'],
            type: 'object',
        },
        SchemaField: {
            description:
                'Named nested field contracts keep missing, null and empty values distinct.',
            properties: {
                name: {
                    type: 'string',
                },
                required: {
                    type: 'boolean',
                },
                schema: {
                    $ref: '#/definitions/ValueSchema',
                },
            },
            required: ['name', 'required', 'schema'],
            type: 'object',
        },
        Scope: {
            description: 'What a caller may do.',
            enum: ['admin', 'read', 'write'],
            type: 'string',
        },
        SegmentationFrame: {
            properties: {
                payload: {
                    items: {
                        type: 'number',
                    },
                    type: 'array',
                },
                type: {
                    type: 'number',
                },
            },
            required: ['payload', 'type'],
            type: 'object',
        },
        SessionFileParams: {
            description: 'Identifies a saved file within an owned session.',
            properties: {
                attachmentId: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
            },
            required: ['attachmentId', 'id'],
            type: 'object',
        },
        SessionHistoryData: {
            description:
                'A small live notification; large records remain in bounded authenticated pages.',
            properties: {
                cursor: {
                    type: 'string',
                },
                endCursor: {
                    type: 'string',
                },
                sessionId: {
                    type: 'string',
                },
            },
            required: ['cursor', 'endCursor', 'sessionId'],
            type: 'object',
        },
        SessionHistoryPage: {
            description:
                'Bounded binary pages can split even a very large individual native event.',
            properties: {
                chunk: {
                    type: 'string',
                },
                endCursor: {
                    type: 'string',
                },
                format: {
                    const: 1,
                    type: 'number',
                },
                nextCursor: {
                    type: 'string',
                },
            },
            required: ['chunk', 'endCursor', 'format'],
            type: 'object',
        },
        SessionHistoryParams: {
            description: 'Byte cursors are decimal strings so large journals retain exact offsets.',
            properties: {
                cursor: {
                    type: 'string',
                },
                endCursor: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                pageBytes: {
                    description: 'Optional bounded read window, up to 1 MiB.',
                    type: 'number',
                },
            },
            required: ['id'],
            type: 'object',
        },
        SessionHistoryRecord: {
            anyOf: [
                {
                    $ref: '#/definitions/HistoryInput',
                },
                {
                    $ref: '#/definitions/HistoryEvent',
                },
                {
                    $ref: '#/definitions/HistorySites',
                },
                {
                    $ref: '#/definitions/HistoryEnd',
                },
                {
                    $ref: '#/definitions/HistoryApprovalRequested',
                },
                {
                    $ref: '#/definitions/HistoryApprovalResolved',
                },
            ],
            description:
                'Append-only presentation history, independent of model-context compaction.',
        },
        SessionListParams: {
            description: 'A filter over sessions.',
            properties: {
                agentId: {
                    type: 'string',
                },
                limit: {
                    type: 'number',
                },
                userId: {
                    type: 'string',
                },
            },
            type: 'object',
        },
        SessionMessageData: {
            description: 'The payload of a {@link GATEWAY_EVENTS.SessionMessage} event.',
            properties: {
                at: {
                    type: 'number',
                },
                attachments: {
                    description:
                        'Attachments sent with this message, preserved for session viewers.',
                    items: {
                        $ref: '#/definitions/InboundAttachment',
                    },
                    type: 'array',
                },
                principalId: {
                    description:
                        'Who sent it, so a shared-agent transcript can attribute the turn to a person.',
                    type: 'string',
                },
                role: {
                    enum: ['assistant', 'user'],
                    type: 'string',
                },
                sessionId: {
                    type: 'string',
                },
                streamId: {
                    description:
                        'The run this message started, so a viewer can join the stream already in flight.',
                    type: 'string',
                },
                text: {
                    type: 'string',
                },
            },
            required: ['at', 'principalId', 'role', 'sessionId', 'text'],
            type: 'object',
        },
        SessionRef: {
            description: 'Names one session, for the subscription methods.',
            properties: {
                sessionId: {
                    type: 'string',
                },
            },
            required: ['sessionId'],
            type: 'object',
        },
        ShareCreateParams: {
            properties: {
                description: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
                path: {
                    type: 'string',
                },
            },
            required: ['name'],
            type: 'object',
        },
        ShareMemberParams: {
            description: 'Adds, re-modes or removes one subject. A `mode` of null removes.',
            properties: {
                id: {
                    type: 'string',
                },
                mode: {
                    type: ['null', 'string'],
                },
                shareId: {
                    type: 'string',
                },
                subject: {
                    type: 'string',
                },
            },
            required: ['id', 'mode', 'shareId', 'subject'],
            type: 'object',
        },
        ShareSummary: {
            description: 'A shared folder, as the UI lists it.',
            properties: {
                createdAt: {
                    type: 'number',
                },
                description: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                members: {
                    items: {
                        properties: {
                            id: {
                                type: 'string',
                            },
                            mode: {
                                type: 'string',
                            },
                            subject: {
                                type: 'string',
                            },
                        },
                        required: ['id', 'mode', 'subject'],
                        type: 'object',
                    },
                    type: 'array',
                },
                name: {
                    type: 'string',
                },
                path: {
                    type: 'string',
                },
            },
            required: ['createdAt', 'id', 'members', 'name', 'path'],
            type: 'object',
        },
        SitePreview: {
            description:
                'Only server-fetched raster bytes cross the gateway; clients never fetch the visited host.',
            properties: {
                favicon: {
                    type: 'string',
                },
                origin: {
                    type: 'string',
                },
            },
            required: ['favicon', 'origin'],
            type: 'object',
        },
        SourceLanguage: {
            description:
                'Source grammars are explicit; bytecode formats use separate version-aware adapters.',
            enum: ['c', 'cpp', 'javascript', 'lua', 'luau'],
            type: 'string',
        },
        SteerParams: {
            description: 'A correction for the server-minted active run, not a follow-up turn.',
            properties: {
                message: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['message', 'runId'],
            type: 'object',
        },
        StreamAccepted: {
            description: 'The acknowledgement of a streaming run.',
            properties: {
                inputId: {
                    description:
                        'Original saved input identity, assigned by the authorized gateway.',
                    type: 'string',
                },
                runId: {
                    description:
                        "The SERVER's name for the run, which is the one `tasks.*` uses.\n\nDistinct from `streamId` because the stream id is chosen by the client — deliberately, so the\naccept response cannot race the first events — and two clients therefore pick the same one\nroutinely. A `tasks.cancel` keyed on the client's id would abort somebody else's run by\ncoincidence; keyed on this one it cannot.",
                    type: 'string',
                },
                sessionKey: {
                    description:
                        'Resolved durable conversation identity, including a newly allocated chat.',
                    type: 'string',
                },
                streamId: {
                    type: 'string',
                },
            },
            required: ['runId', 'streamId'],
            type: 'object',
        },
        StreamParams: {
            description: 'What one turn is asked for, when the client wants its events streamed.',
            properties: {
                agentId: {
                    type: 'string',
                },
                attachments: {
                    description:
                        'User-authored image, video, document, and text blocks, in display order.',
                    items: {
                        $ref: '#/definitions/InboundAttachment',
                    },
                    type: 'array',
                },
                conversationId: {
                    description: 'Continues an existing conversation.',
                    type: 'string',
                },
                cwd: {
                    description: 'Where tools operate.',
                    type: 'string',
                },
                message: {
                    description:
                        'User text; may be blank when at least one attachment contains content.',
                    type: 'string',
                },
                reasoningEffort: {
                    description:
                        'Per-turn reasoning preference; never changes the saved agent configuration.',
                    enum: ['high', 'low', 'max', 'medium', 'minimal', 'off', 'xhigh'],
                    type: 'string',
                },
                streamId: {
                    description:
                        "The stream's id, chosen by the CLIENT.\n\nDeliberate: the accept response and the first events can arrive in the same TCP segment, so a\nclient that waited for a server-assigned id would already have dropped events by the time it\nhad somewhere to put them. Letting the client name the stream removes the race entirely.",
                    type: 'string',
                },
                targetTimeSeconds: {
                    description: 'Soft task time target in seconds; never a cancellation deadline.',
                    maximum: 172800,
                    minimum: 1,
                    type: 'integer',
                },
                userId: {
                    description: 'The principal the turn is billed and authorized as.',
                    type: 'string',
                },
            },
            required: ['message'],
            type: 'object',
        },
        TaskRecord: {
            description:
                'One streaming run, as an operator or a second client sees it.\n\nReported from the gateway\'s own registry rather than from the agent, because the gateway is the\nonly place that knows which CONNECTION owns a run — and "cancel the run my phone started from my\nlaptop" is the reason this family exists at all.',
            properties: {
                agentId: {
                    type: ['null', 'string'],
                },
                cancelling: {
                    type: 'boolean',
                },
                connectionId: {
                    description:
                        'The connection that started it. Two clients of one principal are distinguishable.',
                    type: 'string',
                },
                principalId: {
                    type: 'string',
                },
                runId: {
                    description:
                        "The id `tasks.cancel` takes, and the reason this is not `streamId`.\n\nA listing whose entries could not be acted on would be a screen with a Cancel button that has\nnothing to send: the stream id is the CLIENT's name for the run, two clients pick the same one\nroutinely, and a cancel keyed on it would abort somebody else's turn by coincidence.",
                    type: 'string',
                },
                sessionId: {
                    type: ['null', 'string'],
                },
                startedAt: {
                    type: 'number',
                },
                streamId: {
                    type: 'string',
                },
            },
            required: [
                'agentId',
                'cancelling',
                'connectionId',
                'principalId',
                'runId',
                'sessionId',
                'startedAt',
                'streamId',
            ],
            type: 'object',
        },
        TeamCreateParams: {
            properties: {
                description: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
            },
            required: ['name'],
            type: 'object',
        },
        TeamMemberParams: {
            description: 'Adds or removes one principal. `member: false` removes.',
            properties: {
                member: {
                    type: 'boolean',
                },
                principalId: {
                    type: 'string',
                },
                teamId: {
                    type: 'string',
                },
            },
            required: ['member', 'principalId', 'teamId'],
            type: 'object',
        },
        TeamSummary: {
            description: 'A team, as the UI lists it.',
            properties: {
                createdAt: {
                    type: 'number',
                },
                description: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                members: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                name: {
                    type: 'string',
                },
            },
            required: ['createdAt', 'id', 'members', 'name'],
            type: 'object',
        },
        TelemetryFunnelParams: {
            description:
                'Wire queries never carry an owner: the authenticated gateway supplies it.',
            properties: {
                appliedConfigKey: {
                    type: 'string',
                },
                completionWindowMs: {
                    type: 'string',
                },
                configLookbackMs: {
                    type: 'string',
                },
                fromMs: {
                    type: 'string',
                },
                performanceFpsThreshold: {
                    type: 'number',
                },
                performanceLookbackMs: {
                    type: 'string',
                },
                projectId: {
                    type: 'string',
                },
                steps: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                toMs: {
                    type: 'string',
                },
            },
            required: ['completionWindowMs', 'fromMs', 'projectId', 'steps', 'toMs'],
            type: 'object',
        },
        TelemetryHealth: {
            description:
                'Owner-visible collection evidence, not a guarantee that the game emitted every required event.',
            properties: {
                caveats: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                ingestionEnabled: {
                    type: 'boolean',
                },
                lastCapacityRejectionMs: {
                    type: ['null', 'string'],
                },
                lastSuccessfulBatchMs: {
                    type: ['null', 'string'],
                },
                latestEventMs: {
                    type: ['null', 'string'],
                },
                maxEvents: {
                    type: 'number',
                },
                maxPayloadBytes: {
                    type: 'string',
                },
                projectId: {
                    type: 'string',
                },
                retainedFromMs: {
                    type: 'string',
                },
                retentionDays: {
                    type: 'number',
                },
                storedEvents: {
                    type: 'number',
                },
                storedPayloadBytes: {
                    type: 'string',
                },
            },
            required: [
                'caveats',
                'ingestionEnabled',
                'lastCapacityRejectionMs',
                'lastSuccessfulBatchMs',
                'latestEventMs',
                'maxEvents',
                'maxPayloadBytes',
                'projectId',
                'retainedFromMs',
                'retentionDays',
                'storedEvents',
                'storedPayloadBytes',
            ],
            type: 'object',
        },
        TelemetryMonitorAction: {
            description:
                'Scheduler stores the rule; identity is only in Job.owner, never supplied by this action.',
            properties: {
                destination: {
                    $ref: '#/definitions/TelemetryNotificationDestination',
                    description:
                        'Host-captured private channel destination; never accepted from model arguments.',
                },
                investigate: {
                    type: 'boolean',
                },
                kind: {
                    const: 'roblox-monitor',
                    type: 'string',
                },
                rule: {
                    $ref: '#/definitions/TelemetryMonitorRule',
                },
            },
            required: ['kind', 'rule'],
            type: 'object',
        },
        TelemetryMonitorRule: {
            description:
                'A deterministic observed-conversion threshold, not an automatic causal experiment decision.',
            properties: {
                appliedConfigKey: {
                    type: 'string',
                },
                completionWindowMs: {
                    type: 'number',
                },
                configLookbackMs: {
                    type: 'string',
                },
                conversionBelow: {
                    type: 'number',
                },
                cooldownMs: {
                    type: 'number',
                },
                lookbackMs: {
                    type: 'number',
                },
                minimumAttempts: {
                    type: 'number',
                },
                minimumSessions: {
                    type: 'number',
                },
                performanceFpsThreshold: {
                    type: 'number',
                },
                performanceLookbackMs: {
                    type: 'string',
                },
                projectId: {
                    type: 'string',
                },
                settleDelayMs: {
                    type: 'number',
                },
                steps: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
            },
            required: [
                'completionWindowMs',
                'conversionBelow',
                'cooldownMs',
                'lookbackMs',
                'minimumAttempts',
                'minimumSessions',
                'projectId',
                'settleDelayMs',
                'steps',
            ],
            type: 'object',
        },
        TelemetryNotificationDestination: {
            description:
                'Host-captured private channel destination; never accepted from model arguments.',
            properties: {
                channelId: {
                    type: 'string',
                },
                conversationId: {
                    type: 'string',
                },
                threadId: {
                    type: 'string',
                },
            },
            required: ['channelId', 'conversationId'],
            type: 'object',
        },
        TelemetryPerformanceParams: {
            description: 'Complete bounded client performance query for one owned project.',
            properties: {
                fromMs: {
                    type: 'string',
                },
                projectId: {
                    type: 'string',
                },
                toMs: {
                    type: 'string',
                },
            },
            required: ['fromMs', 'projectId', 'toMs'],
            type: 'object',
        },
        TelemetryProject: {
            description:
                'Project identity returned to authenticated owners; contains no ingestion secret.',
            properties: {
                id: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
                universeId: {
                    type: 'string',
                },
                userId: {
                    type: 'string',
                },
            },
            required: ['id', 'name', 'universeId', 'userId'],
            type: 'object',
        },
        TerminalAction: {
            enum: ['input', 'resize', 'stop'],
            type: 'string',
        },
        TerminalStatus: {
            enum: ['exited', 'interrupted', 'running', 'starting'],
            type: 'string',
        },
        TokenUsage: {
            description: 'Token accounting for a turn.',
            properties: {
                cacheWriteLongTokens: {
                    description:
                        'Cache writes billed at a longer time-to-live, where the provider prices two tiers.\n\nSeparate from `cacheWriteTokens` because they are billed at different rates; folding them\ntogether would misprice every request that uses the longer tier.',
                    type: 'number',
                },
                cacheWriteTokens: {
                    description:
                        'Input tokens written INTO the cache by this request, where the provider bills them apart.',
                    type: 'number',
                },
                cachedInputTokens: {
                    description:
                        'Input tokens served from a prompt cache (already counted in `inputTokens`).',
                    type: 'number',
                },
                contextTokens: {
                    description:
                        "How much of the model's context window the conversation currently OCCUPIES.\n\nDistinct from `inputTokens`, and the distinction is load-bearing for compaction. `inputTokens`\nis a billing figure that accumulates across a turn's several round-trips; occupancy is the\nsize of the prompt right now. A compaction trigger that watched the billing figure would fire\nearly on every tool-heavy turn — after five round-trips the cumulative input exceeds the\nwindow while the actual prompt is nowhere near it.",
                    type: 'number',
                },
                inputTokens: {
                    type: 'number',
                },
                outputTokens: {
                    type: 'number',
                },
                reasoningTokens: {
                    description:
                        'Reasoning tokens (already counted in `outputTokens` for most providers).',
                    type: 'number',
                },
            },
            required: ['inputTokens', 'outputTokens'],
            type: 'object',
        },
        ToolCall: {
            description: 'A tool call the model asked for.',
            properties: {
                id: {
                    type: 'string',
                },
                input: {
                    $ref: '#/definitions/JsonValue',
                },
                name: {
                    type: 'string',
                },
            },
            required: ['id', 'input', 'name'],
            type: 'object',
        },
        ToolOutcome: {
            description: "One tool call's outcome, paired back to its call.",
            properties: {
                call: {
                    $ref: '#/definitions/ToolCall',
                },
                durationMs: {
                    type: 'number',
                },
                result: {
                    $ref: '#/definitions/ToolResult',
                },
            },
            required: ['call', 'durationMs', 'result'],
            type: 'object',
        },
        ToolProgress: {
            properties: {
                attachment: {
                    $ref: '#/definitions/ToolProgressAttachment',
                    description:
                        'Transient visual progress for the active chat; never persisted in the transcript.',
                },
                fraction: {
                    description: 'Completed fraction in `[0, 1]`, when the tool can know it.',
                    type: 'number',
                },
                reverse: {
                    $ref: '#/definitions/ReverseRunSnapshot',
                    description:
                        'Shared investigation plan and evidence provenance, without live query capabilities.',
                },
                status: {
                    description: 'A one-line status, e.g. `running tests…`.',
                    type: 'string',
                },
                terminal: {
                    $ref: '#/definitions/ToolTerminal',
                    description:
                        'Live pseudoterminal identity for authenticated input and resize controls.',
                },
                text: {
                    description: 'Text appended to the live view.',
                    type: 'string',
                },
            },
            type: 'object',
        },
        ToolProgressAttachment: {
            description: 'A partial update from a running tool.',
            properties: {
                data: {
                    anyOf: [
                        {
                            items: {
                                type: 'number',
                            },
                            type: 'array',
                        },
                        {
                            type: 'object',
                            additionalProperties: {
                                type: 'number',
                            },
                        },
                    ],
                },
                description: {
                    type: 'string',
                },
                filename: {
                    type: 'string',
                },
                mimeType: {
                    type: 'string',
                },
            },
            required: ['data', 'filename', 'mimeType'],
            type: 'object',
        },
        ToolQuestion: {
            description: 'A question that may be rendered interactively by a conversation surface.',
            properties: {
                choices: {
                    items: {
                        $ref: '#/definitions/ToolQuestionChoice',
                    },
                    type: 'array',
                },
                text: {
                    type: 'string',
                },
            },
            required: ['text'],
            type: 'object',
        },
        ToolQuestionChoice: {
            description: 'One finite answer offered by a tool-originated question.',
            properties: {
                description: {
                    description: 'Optional detail used by menu-capable surfaces.',
                    type: 'string',
                },
                label: {
                    type: 'string',
                },
                value: {
                    description: 'The inbound text produced by a press. Defaults to the label.',
                    type: 'string',
                },
            },
            required: ['label'],
            type: 'object',
        },
        ToolResult: {
            description: 'What a tool returns.',
            properties: {
                chatGraph: {
                    $ref: '#/definitions/ChatGraph',
                    description:
                        'Validated graph presentation, independent of bounded model-visible result text.',
                },
                commandExecution: {
                    $ref: '#/definitions/CommandExecutionReceipt',
                    description:
                        'Only the execution adapter supplies this evidence; stdout cannot forge it.',
                },
                content: {
                    anyOf: [
                        {
                            items: {
                                $ref: '#/definitions/ContentBlock',
                            },
                            type: 'array',
                        },
                        {
                            type: 'string',
                        },
                    ],
                    description:
                        'What the model sees. A string for the ordinary case; blocks when the result carries an image\nor a document the model should actually look at.',
                },
                continuation: {
                    description:
                        'The exact call that would show the next page of this result, written by the tool.\n\nSupplied by the TOOL and by nothing else, because only the tool knows its own argument names.\nA shared builder would render `offset` for a tool whose parameter is `start_index`, and a\nmodel handed a follow-up call that does not validate concludes paging is broken and gives up\non the rest of the output entirely. The registry copies it into the truncation marker when it\nhas to cut the result; a tool that pages itself puts it in `content` and leaves this unset.',
                    type: 'string',
                },
                deliveredMedia: {
                    description:
                        'Host receipt: true only after the attachment channel send resolves.',
                    type: 'boolean',
                },
                deliveredText: {
                    description:
                        "Text this tool already delivered to the user outside the agent's eventual reply.",
                    type: 'string',
                },
                deliveryReceipt: {
                    $ref: '#/definitions/DeliveryReceipt',
                    description:
                        'Exact submitted artifact and acknowledged destination, produced by the delivery adapter.',
                },
                deliveryReceipts: {
                    description:
                        'One authoritative receipt per file in a multi-attachment delivery.',
                    items: {
                        $ref: '#/definitions/DeliveryReceipt',
                    },
                    type: 'array',
                },
                display: {
                    anyOf: [
                        {
                            items: {
                                $ref: '#/definitions/JsonValue',
                            },
                            type: 'array',
                        },
                        {
                            additionalProperties: {
                                $ref: '#/definitions/JsonValue',
                            },
                            type: 'object',
                        },
                        {
                            type: ['null', 'string', 'number', 'boolean'],
                        },
                    ],
                    description:
                        'Structured data for a UI that renders this tool specially (a diff view, a file tree).\nNever sent to the model — that is what `content` is for.',
                },
                inspectedMediaSha256: {
                    description: 'Original image digests successfully inspected by a vision route.',
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                label: {
                    description:
                        'A short human label for a UI, e.g. `read 412 lines from src/main.ts`.',
                    type: 'string',
                },
                processMissing: {
                    description:
                        'The native process table confirmed the requested handle is absent for this session.',
                    type: 'boolean',
                },
                protocolPayload: {
                    description:
                        "Preserve the string byte-for-byte instead of applying the registry's display-oriented\ntruncation. This is only for machine-readable protocol payloads whose consumer is the\nprovider itself, such as the paged project-graph manifest. Ordinary human/model output must\nleave this unset and use `continuation` when it is large.",
                    type: 'boolean',
                },
                question: {
                    $ref: '#/definitions/ToolQuestion',
                    description:
                        'A question handed back to the conversation surface for native delivery.\n\nFinite choices become buttons or a menu on capable channels and numbered text elsewhere.\nWith no choices, the question remains an ordinary text reply. The channel router, not the\ntool, owns delivery because only it knows the active address and platform capabilities.',
                },
                reverse: {
                    $ref: '#/definitions/ReverseRunSnapshot',
                    description:
                        'Runtime-authored investigation receipt, retained in presentation history.',
                },
                source: {
                    description: 'Where the content came from, for taint tracking.',
                    enum: ['external-model', 'local', 'model', 'network'],
                    type: 'string',
                },
                status: {
                    $ref: '#/definitions/ToolStatus',
                },
                terminate: {
                    description:
                        'Whether this result should END the turn rather than feed back into the model.\n\nUsed by tools that hand control elsewhere (asking the user a question, yielding to another\nagent). AND-ed across a batch, never OR-ed: one tool wanting to stop must not cancel the\nresults the model still needs from the others in the same batch.',
                    type: 'boolean',
                },
                truncation: {
                    $ref: '#/definitions/TruncationRecord',
                    description:
                        'What the registry\'s backstop removed, when it removed anything.\n\nSet on the way OUT, never by the tool. It exists because the marker in `content` is prose for\nthe model and a UI cannot parse prose: without this, a transcript view has no way to render\n"this result was cut" as anything but a wall of text, and no way to offer the spill file as a\nlink. `undefined` means the result was returned whole.\n\nIt is PLUMBING, not a delivered feature: no UI in this repo reads it. It rides out to\nembedders on `toolOutcomes`, which is a legitimate public API, but the transcript view that\nwould render a cut is not built and neither is the spill link — see `tools/output/Spill.ts`,\nwhose store the composition root does not construct.',
                },
                verifiedCodePaths: {
                    description:
                        'Absolute source paths accepted by a native engineering workflow, never model-supplied.',
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
            },
            required: ['content', 'status'],
            type: 'object',
        },
        ToolSitesData: {
            description:
                'Asynchronous tool decoration; may arrive after turn.end and never blocks it.',
            properties: {
                callId: {
                    type: 'string',
                },
                historyAt: {
                    description: 'Original event time, retained across checkpoint and replay.',
                    type: 'number',
                },
                historyId: {
                    description:
                        'Stable record identity shared by the immediate event and its later durable copy.',
                    type: 'string',
                },
                sessionId: {
                    type: 'string',
                },
                sites: {
                    items: {
                        $ref: '#/definitions/SitePreview',
                    },
                    type: 'array',
                },
                streamId: {
                    type: 'string',
                },
            },
            required: ['callId', 'sites', 'streamId'],
            type: 'object',
        },
        ToolStatus: {
            description: "What a tool did, from the agent's point of view.",
            enum: ['aborted', 'denied', 'error', 'ok'],
            type: 'string',
        },
        ToolTerminal: {
            description: 'A terminal belongs to the session that launched this exact process.',
            properties: {
                cols: {
                    type: 'number',
                },
                processId: {
                    type: 'string',
                },
                rows: {
                    type: 'number',
                },
                sessionId: {
                    type: 'string',
                },
            },
            required: ['cols', 'processId', 'rows', 'sessionId'],
            type: 'object',
        },
        TruncationRecord: {
            description: 'What a truncation did, in numbers the marker quotes and a UI can render.',
            properties: {
                continuation: {
                    description:
                        'The exact call the model should make to see more, pre-rendered by the ORIGINATING tool.\n\nBuilt by the tool because only the tool knows its own argument names; a shared builder would\nguess `offset` for a tool that calls it `start` and hand the model a call that fails.',
                    type: 'string',
                },
                lastLinePartial: {
                    description:
                        'Whether a cut fell mid-line, so one of the shown lines is a fragment.\n\n`read` propagates this so `edit` never anchors a replacement on a fragment — an anchor that\nmatches half a line matches the wrong place in the file. For `tail` the fragment is the first\nshown line rather than the last; it is one flag because one flag is all a consumer acts on.',
                    type: 'boolean',
                },
                shownChars: {
                    description:
                        'Characters of the ORIGINAL text that survive, excluding anything this module synthesized.\nCounted literally rather than script-weighted: a marker whose numbers disagree with what the\nmodel can count for itself teaches it to distrust the whole marker.',
                    type: 'number',
                },
                shownLines: {
                    type: 'number',
                },
                spillPath: {
                    description:
                        'Where the complete content was written, when a spill store wrote it.',
                    type: 'string',
                },
                strategy: {
                    $ref: '#/definitions/TruncationStrategy',
                },
                totalChars: {
                    type: 'number',
                },
                totalLines: {
                    type: 'number',
                },
            },
            required: [
                'lastLinePartial',
                'shownChars',
                'shownLines',
                'strategy',
                'totalChars',
                'totalLines',
            ],
            type: 'object',
        },
        TruncationStrategy: {
            description:
                'How the content is reduced. Declared by the tool, which knows what it produced.',
            enum: ['head', 'head-tail', 'hunk-head', 'summary-head', 'tail'],
            type: 'string',
        },
        TurnEndData: {
            description: 'The payload of a {@link GATEWAY_EVENTS.TurnEnd} event.',
            properties: {
                error: {
                    $ref: '#/definitions/WireError',
                    description:
                        'An error, in the shape a client can act on without parsing prose.',
                },
                historyAt: {
                    description: 'Original event time, retained across checkpoint and replay.',
                    type: 'number',
                },
                historyId: {
                    description:
                        'Stable record identity shared by the immediate event and its later durable copy.',
                    type: 'string',
                },
                ok: {
                    type: 'boolean',
                },
                result: {
                    $ref: '#/definitions/AskResult',
                    description: 'What a finished turn produced.',
                },
                sessionId: {
                    type: 'string',
                },
                streamId: {
                    type: 'string',
                },
            },
            required: ['ok', 'streamId'],
            type: 'object',
        },
        TurnEventData: {
            properties: {
                event: {
                    $ref: '#/definitions/WireTurnEvent',
                },
                historyAt: {
                    description: 'Original event time, retained across checkpoint and replay.',
                    type: 'number',
                },
                historyId: {
                    description:
                        'Stable record identity shared by the immediate event and its later durable copy.',
                    type: 'string',
                },
                sessionId: {
                    type: 'string',
                },
                streamId: {
                    type: 'string',
                },
            },
            required: ['event', 'streamId'],
            type: 'object',
        },
        ValueSchema: {
            anyOf: [
                {
                    $ref: '#/definitions/ScalarSchema',
                },
                {
                    $ref: '#/definitions/ObjectSchema',
                },
                {
                    $ref: '#/definitions/ListSchema',
                },
                {
                    $ref: '#/definitions/ResourceSchema',
                },
            ],
            description:
                'Declarative portable schema subset. No callbacks, JavaScript evaluation, or credentials.',
        },
        VoiceAudioParams: {
            properties: {
                callId: {
                    type: 'string',
                },
                pcm: {
                    description: 'Base64 PCM16, mono, at the rate the call reported.',
                    type: 'string',
                },
            },
            required: ['callId', 'pcm'],
            type: 'object',
        },
        VoiceCallEvent: {
            anyOf: [
                {
                    $ref: '#/definitions/VoiceInterimEvent',
                },
                {
                    properties: {
                        kind: {
                            const: 'heard',
                            type: 'string',
                        },
                        text: {
                            type: 'string',
                        },
                    },
                    required: ['kind', 'text'],
                    type: 'object',
                },
                {
                    properties: {
                        kind: {
                            const: 'said',
                            type: 'string',
                        },
                        text: {
                            type: 'string',
                        },
                    },
                    required: ['kind', 'text'],
                    type: 'object',
                },
                {
                    properties: {
                        kind: {
                            const: 'status',
                            type: 'string',
                        },
                        text: {
                            type: 'string',
                        },
                    },
                    required: ['kind', 'text'],
                    type: 'object',
                },
                {
                    properties: {
                        kind: {
                            const: 'error',
                            type: 'string',
                        },
                        message: {
                            type: 'string',
                        },
                    },
                    required: ['kind', 'message'],
                    type: 'object',
                },
            ],
        },
        VoiceInterimEvent: {
            description: 'Replaceable ASR hypothesis for the current utterance.',
            properties: {
                kind: {
                    const: 'interim',
                    type: 'string',
                },
                text: {
                    type: 'string',
                },
            },
            required: ['kind', 'text'],
            type: 'object',
        },
        VoiceStarted: {
            properties: {
                callId: {
                    type: 'string',
                },
                frameBytes: {
                    description:
                        'One frame, in bytes. A client that sends a different size adds latency for nothing.',
                    type: 'number',
                },
                sampleRate: {
                    description:
                        'The rate to capture at and to play back at. Resampling anywhere else is a defect.',
                    type: 'number',
                },
            },
            required: ['callId', 'frameBytes', 'sampleRate'],
            type: 'object',
        },
        VoiceStartParams: {
            description:
                "Opens a spoken call. The conversation is the agent's, so a call can continue a typed thread.",
            properties: {
                conversationId: {
                    type: 'string',
                },
            },
            type: 'object',
        },
        VoiceStopParams: {
            properties: {
                callId: {
                    type: 'string',
                },
            },
            required: ['callId'],
            type: 'object',
        },
        WalletHistoryEntry: {
            description:
                'A durable payment or settled request, without exposing provider payment identifiers.',
            properties: {
                amount: {
                    type: 'string',
                },
                kind: {
                    enum: ['purchase', 'usage'],
                    type: 'string',
                },
                paid: {
                    type: 'string',
                },
                plan: {
                    type: 'string',
                },
                recordedAt: {
                    type: 'number',
                },
                sequence: {
                    type: 'string',
                },
            },
            required: ['amount', 'kind', 'paid', 'plan', 'recordedAt', 'sequence'],
            type: 'object',
        },
        WalletHistoryPage: {
            description: 'Cursor pagination remains stable when new transactions arrive.',
            properties: {
                entries: {
                    items: {
                        $ref: '#/definitions/WalletHistoryEntry',
                    },
                    type: 'array',
                },
                next: {
                    type: ['null', 'string'],
                },
                userId: {
                    type: 'string',
                },
            },
            required: ['entries', 'next', 'userId'],
            type: 'object',
        },
        WalletSnapshot: {
            description:
                'Exact USD microcent balances encoded as decimal strings for JSON clients.',
            properties: {
                asOf: {
                    type: 'number',
                },
                credits: {
                    type: 'string',
                },
                creditsAvailable: {
                    type: 'string',
                },
                creditsHeld: {
                    type: 'string',
                },
                resetsAt: {
                    type: 'number',
                },
                userId: {
                    type: 'string',
                },
                weeklyAvailable: {
                    type: 'string',
                },
                weeklyHeld: {
                    type: 'string',
                },
                weeklyLimit: {
                    type: 'string',
                },
                weeklyUsed: {
                    type: 'string',
                },
            },
            required: [
                'asOf',
                'credits',
                'creditsAvailable',
                'creditsHeld',
                'resetsAt',
                'userId',
                'weeklyAvailable',
                'weeklyHeld',
                'weeklyLimit',
                'weeklyUsed',
            ],
            type: 'object',
        },
        WireError: {
            description: 'An error, in the shape a client can act on without parsing prose.',
            properties: {
                code: {
                    $ref: '#/definitions/ErrorCode',
                },
                details: {
                    $ref: '#/definitions/Record%3Cstring%2Cunknown%3E',
                },
                message: {
                    type: 'string',
                },
                retryAfterMs: {
                    type: 'number',
                },
                retryable: {
                    description: 'Whether repeating the SAME request could plausibly succeed.',
                    type: 'boolean',
                },
            },
            required: ['code', 'message', 'retryable'],
            type: 'object',
        },
        WireTurnEvent: {
            anyOf: [
                {
                    properties: {
                        type: {
                            const: 'agents-status',
                            type: 'string',
                        },
                        workers: {
                            items: {
                                $ref: '#/definitions/WorkerStatus',
                            },
                            type: 'array',
                        },
                    },
                    required: ['type', 'workers'],
                    type: 'object',
                },
                {
                    properties: {
                        attachment: {
                            $ref: '#/definitions/DeliveredAttachment',
                        },
                        type: {
                            const: 'attachment',
                            type: 'string',
                        },
                    },
                    required: ['attachment', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        turnId: {
                            type: 'string',
                        },
                        type: {
                            const: 'turn-start',
                            type: 'string',
                        },
                    },
                    required: ['turnId', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        iteration: {
                            type: 'number',
                        },
                        type: {
                            const: 'iteration-start',
                            type: 'string',
                        },
                    },
                    required: ['iteration', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        text: {
                            type: 'string',
                        },
                        type: {
                            const: 'text',
                            type: 'string',
                        },
                    },
                    required: ['text', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        text: {
                            type: 'string',
                        },
                        type: {
                            const: 'reasoning',
                            type: 'string',
                        },
                    },
                    required: ['text', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        call: {
                            $ref: '#/definitions/ToolCall',
                        },
                        type: {
                            const: 'tool-start',
                            type: 'string',
                        },
                    },
                    required: ['call', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        call: {
                            $ref: '#/definitions/ToolCall',
                        },
                        type: {
                            const: 'tool-progress',
                            type: 'string',
                        },
                        update: {
                            $ref: '#/definitions/ToolProgress',
                        },
                    },
                    required: ['call', 'type', 'update'],
                    type: 'object',
                },
                {
                    properties: {
                        outcome: {
                            $ref: '#/definitions/ToolOutcome',
                        },
                        type: {
                            const: 'tool-finish',
                            type: 'string',
                        },
                    },
                    required: ['outcome', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        summary: {
                            type: 'string',
                        },
                        tool: {
                            type: 'string',
                        },
                        type: {
                            const: 'approval-required',
                            type: 'string',
                        },
                    },
                    required: ['summary', 'tool', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        droppedMessages: {
                            type: 'number',
                        },
                        summary: {
                            type: 'string',
                        },
                        type: {
                            const: 'compacted',
                            type: 'string',
                        },
                    },
                    required: ['droppedMessages', 'summary', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        type: {
                            const: 'usage',
                            type: 'string',
                        },
                        usage: {
                            $ref: '#/definitions/TokenUsage',
                        },
                    },
                    required: ['type', 'usage'],
                    type: 'object',
                },
                {
                    properties: {
                        data: {
                            $ref: '#/definitions/JsonValue',
                        },
                        source: {
                            type: 'string',
                        },
                        type: {
                            const: 'native',
                            type: 'string',
                        },
                    },
                    required: ['data', 'source', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        detail: {
                            type: 'string',
                        },
                        status: {
                            type: 'string',
                        },
                        type: {
                            const: 'status',
                            type: 'string',
                        },
                    },
                    required: ['status', 'type'],
                    type: 'object',
                },
                {
                    properties: {
                        iterations: {
                            type: 'number',
                        },
                        reason: {
                            $ref: '#/definitions/FinishReason',
                        },
                        turnId: {
                            type: 'string',
                        },
                        type: {
                            const: 'turn-finish',
                            type: 'string',
                        },
                        usage: {
                            $ref: '#/definitions/TokenUsage',
                        },
                    },
                    required: ['iterations', 'reason', 'turnId', 'type', 'usage'],
                    type: 'object',
                },
                {
                    properties: {
                        error: {
                            $ref: '#/definitions/WireError',
                        },
                        retryable: {
                            type: 'boolean',
                        },
                        type: {
                            const: 'error',
                            type: 'string',
                        },
                    },
                    required: ['error', 'retryable', 'type'],
                    type: 'object',
                },
            ],
            description:
                'A turn event as it travels.\n\nIdentical to {@link TurnEvent} except for the error variant: `Error` does not survive\n`JSON.stringify` — it serializes to `{}` — so a failing turn would arrive as an empty object and\na client would report "something went wrong" with nothing else, forever.',
        },
        WorkerState: {
            description: "Lifecycle states for Nexa's delegated workers.",
            enum: ['aborted', 'done', 'failed', 'queued', 'refused', 'stopping', 'working'],
            type: 'string',
        },
        WorkerStatus: {
            description:
                'One worker, identified independently of its shared persona. Times are decimal epoch milliseconds.',
            properties: {
                activity: {
                    type: 'string',
                },
                agentId: {
                    type: 'string',
                },
                depth: {
                    type: 'number',
                },
                goal: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                lastActivityAt: {
                    type: 'string',
                },
                parentId: {
                    type: 'string',
                },
                rootId: {
                    type: 'string',
                },
                startedAt: {
                    type: 'string',
                },
                state: {
                    $ref: '#/definitions/WorkerState',
                },
            },
            required: [
                'activity',
                'agentId',
                'depth',
                'goal',
                'id',
                'lastActivityAt',
                'parentId',
                'rootId',
                'startedAt',
                'state',
            ],
            type: 'object',
        },
        WorkflowAgentControlRequest: {
            description:
                'Compare-and-set controls prevent a stale retry from undoing a newer decision.',
            properties: {
                controlId: {
                    type: 'string',
                },
                expectedRevision: {
                    type: 'string',
                },
                invocationId: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
                paused: {
                    type: 'boolean',
                },
                runId: {
                    type: 'string',
                },
            },
            required: [
                'controlId',
                'expectedRevision',
                'invocationId',
                'nodeId',
                'paused',
                'runId',
            ],
            type: 'object',
        },
        WorkflowAgentInput: {
            properties: {
                inputId: {
                    type: 'string',
                },
                status: {
                    $ref: '#/definitions/WorkflowAgentInputStatus',
                },
                text: {
                    type: 'string',
                },
            },
            required: ['inputId', 'status', 'text'],
            type: 'object',
        },
        WorkflowAgentInputRequest: {
            properties: {
                inputId: {
                    type: 'string',
                },
                invocationId: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                text: {
                    type: 'string',
                },
            },
            required: ['inputId', 'invocationId', 'nodeId', 'runId', 'text'],
            type: 'object',
        },
        WorkflowAgentInputStatus: {
            enum: ['accepted', 'queued', 'rejected'],
            type: 'string',
        },
        WorkflowAgentSession: {
            description:
                'Bounded live text is a preview; completed graph outputs remain authoritative.',
            properties: {
                activity: {
                    type: 'string',
                },
                controlId: {
                    type: 'string',
                },
                controlRevision: {
                    type: 'string',
                },
                inputs: {
                    items: {
                        $ref: '#/definitions/WorkflowAgentInput',
                    },
                    type: 'array',
                },
                invocationId: {
                    type: 'string',
                },
                model: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
                pauseRequested: {
                    type: 'boolean',
                },
                paused: {
                    type: 'boolean',
                },
                provider: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                status: {
                    $ref: '#/definitions/WorkflowStepStatus',
                },
                task: {
                    type: 'string',
                },
                text: {
                    type: 'string',
                },
            },
            required: [
                'activity',
                'controlId',
                'controlRevision',
                'inputs',
                'invocationId',
                'model',
                'nodeId',
                'pauseRequested',
                'paused',
                'provider',
                'runId',
                'status',
                'task',
                'text',
            ],
            type: 'object',
        },
        WorkflowAgentSessionRequest: {
            description:
                'One exact agent invocation; identities are never retargeted to a newer attempt.',
            properties: {
                invocationId: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['invocationId', 'nodeId', 'runId'],
            type: 'object',
        },
        WorkflowAgentUsageIdentity: {
            properties: {
                agentId: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
            },
            required: ['agentId', 'nodeId'],
            type: 'object',
        },
        WorkflowAnswerType: {
            description: 'Supported answer shapes for the initial owner question component.',
            enum: ['boolean', 'choice', 'text'],
            type: 'string',
        },
        WorkflowApplication: {
            enum: ['claude-code', 'codex', 'grok-build', 'mistral-vibe', 'nerva-code'],
            type: 'string',
        },
        WorkflowApplicationRequest: {
            properties: {
                revision: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['revision', 'workflowId'],
            type: 'object',
        },
        WorkflowApplicationSetupRequest: {
            properties: {
                application: {
                    $ref: '#/definitions/WorkflowApplication',
                },
                revision: {
                    type: 'string',
                },
                sessionId: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['application', 'revision', 'sessionId', 'workflowId'],
            type: 'object',
        },
        WorkflowApplicationStatus: {
            properties: {
                application: {
                    $ref: '#/definitions/WorkflowApplication',
                },
                status: {
                    $ref: '#/definitions/ApplicationConnection',
                },
                title: {
                    type: 'string',
                },
            },
            required: ['application', 'status', 'title'],
            type: 'object',
        },
        WorkflowApprovalChoice: {
            description:
                'Explicit decisions; absence of a decision never grants permission.\nSupported owner review choices.',
            enum: ['approved', 'cancelled', 'changes_requested', 'rejected'],
            type: 'string',
        },
        WorkflowApprovalDecision: {
            description:
                'One explicit authenticated decision on one exact proposal and invocation.',
            properties: {
                commandId: {
                    type: 'string',
                },
                comment: {
                    type: 'string',
                },
                decision: {
                    $ref: '#/definitions/WorkflowApprovalChoice',
                },
                invocationId: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
                proposalRevision: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: [
                'commandId',
                'comment',
                'decision',
                'invocationId',
                'nodeId',
                'proposalRevision',
                'runId',
            ],
            type: 'object',
        },
        WorkflowApprovalProposal: {
            description:
                'Immutable canonical content identified by a server-computed SHA-256 revision.',
            properties: {
                action: {
                    type: 'string',
                },
                content: {
                    $ref: '#/definitions/WorkflowObject',
                },
                destination: {
                    type: 'string',
                },
                revision: {
                    type: 'string',
                },
            },
            required: ['action', 'content', 'destination', 'revision'],
            type: 'object',
        },
        WorkflowArtifactCursor: {
            description: "Exclusive position in the run's immutable invocation manifests.",
            properties: {
                invocationId: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
            },
            required: ['invocationId', 'nodeId'],
            type: 'object',
        },
        WorkflowArtifactListPage: {
            description:
                'Expiry is interpreted against the server observation time; bytes are retrieved separately.',
            properties: {
                items: {
                    items: {
                        $ref: '#/definitions/WorkflowArtifactPublication',
                    },
                    type: 'array',
                },
                next: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowArtifactCursor',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                observedAtMs: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['items', 'next', 'observedAtMs', 'runId'],
            type: 'object',
        },
        WorkflowArtifactListRequest: {
            description:
                'Lists metadata only, with at most six publications of at most 32 files each.',
            properties: {
                after: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowArtifactCursor',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                limit: {
                    type: 'number',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['after', 'limit', 'runId'],
            type: 'object',
        },
        WorkflowArtifactPublication: {
            description:
                'Recorded producing identity and public file metadata, without storage identifiers.',
            properties: {
                artifacts: {
                    items: {
                        $ref: '#/definitions/WorkflowRunArtifact',
                    },
                    type: 'array',
                },
                attempt: {
                    type: ['null', 'number'],
                },
                createdAtMs: {
                    type: ['null', 'string'],
                },
                invocationId: {
                    type: 'string',
                },
                label: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
                status: {
                    anyOf: [
                        {
                            enum: [
                                'cancelled',
                                'failed',
                                'interrupted',
                                'running',
                                'skipped',
                                'succeeded',
                                'uncertain',
                                'waiting',
                            ],
                            type: 'string',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
            },
            required: [
                'artifacts',
                'attempt',
                'createdAtMs',
                'invocationId',
                'label',
                'nodeId',
                'status',
            ],
            type: 'object',
        },
        WorkflowAttentionCategory: {
            description:
                'Inbox views share authoritative execution records, never copied request state.\nSupported attention sources.',
            enum: ['failures', 'requests'],
            type: 'string',
        },
        WorkflowAttentionCursor: {
            description:
                'Stable owner-scoped position, still usable after the preceding request is answered.',
            properties: {
                nodeId: {
                    type: ['null', 'string'],
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['nodeId', 'runId'],
            type: 'object',
        },
        WorkflowAttentionItem: {
            description:
                'Display metadata points to an exact invocation; proposal bodies are loaded only on review.',
            properties: {
                canRespond: {
                    type: 'boolean',
                },
                createdAtMs: {
                    type: 'string',
                },
                detail: {
                    type: 'string',
                },
                expiresAtMs: {
                    type: ['null', 'string'],
                },
                invocationId: {
                    type: ['null', 'string'],
                },
                kind: {
                    enum: ['approval', 'failure', 'question'],
                    type: 'string',
                },
                nodeId: {
                    type: ['null', 'string'],
                },
                recipient: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                status: {
                    enum: ['expired', 'failed', 'pending'],
                    type: 'string',
                },
                title: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
                workflowName: {
                    type: ['null', 'string'],
                },
                workflowRevision: {
                    type: 'string',
                },
            },
            required: [
                'canRespond',
                'createdAtMs',
                'detail',
                'expiresAtMs',
                'invocationId',
                'kind',
                'nodeId',
                'recipient',
                'runId',
                'status',
                'title',
                'workflowId',
                'workflowName',
                'workflowRevision',
            ],
            type: 'object',
        },
        WorkflowAttentionPage: {
            description:
                'Stable pagination may return an empty page with a continuation after stale records are filtered.',
            properties: {
                category: {
                    $ref: '#/definitions/WorkflowAttentionCategory',
                },
                items: {
                    items: {
                        $ref: '#/definitions/WorkflowAttentionItem',
                    },
                    type: 'array',
                },
                next: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowAttentionCursor',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                observedAtMs: {
                    type: 'string',
                },
            },
            required: ['category', 'items', 'next', 'observedAtMs'],
            type: 'object',
        },
        WorkflowAttentionQuery: {
            description: 'Bounded metadata query; the authenticated owner is not client input.',
            properties: {
                after: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowAttentionCursor',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                category: {
                    $ref: '#/definitions/WorkflowAttentionCategory',
                },
                limit: {
                    type: 'number',
                },
            },
            required: ['after', 'category', 'limit'],
            type: 'object',
        },
        WorkflowCalendarFold: {
            description:
                'A repeated local time always contributes at most one scheduled occurrence.\nExplicit repeated-time policy.',
            enum: ['first', 'second', 'skip'],
            type: 'string',
        },
        WorkflowCalendarGap: {
            description:
                'Calendar times are resolved in the named zone instead of by adding elapsed milliseconds.\nMissing local times are skipped or moved to the first valid instant on the same local date.',
            enum: ['next-valid', 'skip'],
            type: 'string',
        },
        WorkflowCalendarTiming: {
            description:
                'Weekdays use ISO numbering: Monday 1 through Sunday 7; date bounds/exceptions are local dates.',
            properties: {
                endDate: {
                    type: ['null', 'string'],
                },
                exceptDates: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                fold: {
                    $ref: '#/definitions/WorkflowCalendarFold',
                },
                gap: {
                    $ref: '#/definitions/WorkflowCalendarGap',
                },
                kind: {
                    const: 'calendar',
                    type: 'string',
                },
                startDate: {
                    type: 'string',
                },
                time: {
                    type: 'string',
                },
                timeZone: {
                    type: 'string',
                },
                weekdays: {
                    items: {
                        type: 'number',
                    },
                    type: 'array',
                },
            },
            required: [
                'endDate',
                'exceptDates',
                'fold',
                'gap',
                'kind',
                'startDate',
                'time',
                'timeZone',
                'weekdays',
            ],
            type: 'object',
        },
        WorkflowCatalog: {
            description:
                'Catalog format is separate from saved component versions and draft storage format.',
            properties: {
                components: {
                    items: {
                        $ref: '#/definitions/ComponentDefinition',
                    },
                    type: 'array',
                },
                format: {
                    const: 1,
                    type: 'number',
                },
            },
            required: ['components', 'format'],
            type: 'object',
        },
        WorkflowCatalogObservation: {
            description:
                'An observation time is not a release date, freshness guarantee, or permission grant.',
            properties: {
                checkedAt: {
                    type: ['null', 'string'],
                },
                refreshAvailable: {
                    type: 'boolean',
                },
                refreshFailed: {
                    type: 'boolean',
                },
            },
            required: ['checkedAt', 'refreshAvailable', 'refreshFailed'],
            type: 'object',
        },
        WorkflowCompletionTiming: {
            description:
                'One run at a time, followed by a delay from its persisted terminal transition.',
            properties: {
                endAtMs: {
                    type: ['null', 'string'],
                },
                intervalMs: {
                    type: 'string',
                },
                kind: {
                    const: 'after-completion',
                    type: 'string',
                },
                startAtMs: {
                    type: 'string',
                },
            },
            required: ['endAtMs', 'intervalMs', 'kind', 'startAtMs'],
            type: 'object',
        },
        WorkflowCreateRequest: {
            description: 'Client-chosen identities make an unacknowledged create safe to retry.',
            properties: {
                commandId: {
                    type: 'string',
                },
                details: {
                    $ref: '#/definitions/WorkflowDetails',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['commandId', 'details', 'workflowId'],
            type: 'object',
        },
        WorkflowDeleteReceipt: {
            description: 'An idempotent deletion receipt; immutable execution history is retained.',
            properties: {
                deleted: {
                    const: true,
                    type: 'boolean',
                },
                revision: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['deleted', 'revision', 'workflowId'],
            type: 'object',
        },
        WorkflowDeleteRequest: {
            description: 'Deletion must name the saved revision the owner reviewed.',
            properties: {
                expectedRevision: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['expectedRevision', 'workflowId'],
            type: 'object',
        },
        WorkflowDetails: {
            description: 'User-owned descriptive fields, independent of run and automation state.',
            properties: {
                description: {
                    type: 'string',
                },
                folder: {
                    type: ['null', 'string'],
                },
                name: {
                    type: 'string',
                },
                tags: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
            },
            required: ['description', 'folder', 'name', 'tags'],
            type: 'object',
        },
        WorkflowEdge: {
            description:
                'A draft can retain a dangling edge so validation can explain an unfinished edit.',
            properties: {
                from: {
                    $ref: '#/definitions/WorkflowEndpoint',
                },
                id: {
                    type: 'string',
                },
                kind: {
                    $ref: '#/definitions/WorkflowEdgeKind',
                },
                to: {
                    $ref: '#/definitions/WorkflowEndpoint',
                },
            },
            required: ['from', 'id', 'kind', 'to'],
            type: 'object',
        },
        WorkflowEdgeKind: {
            description:
                'Execution, values, and resource attachments have separate connection semantics.\nConnection purpose does not depend on visual position.',
            enum: ['data', 'flow', 'resource'],
            type: 'string',
        },
        WorkflowEdgeReference: {
            description: 'One immutable connection.',
            properties: {
                content: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
            },
            required: ['content', 'id'],
            type: 'object',
        },
        WorkflowEndpoint: {
            description: 'Stable endpoint identities survive cosmetic renames.',
            properties: {
                node: {
                    type: 'string',
                },
                port: {
                    type: 'string',
                },
            },
            required: ['node', 'port'],
            type: 'object',
        },
        WorkflowGroup: {
            description:
                'Saved hierarchy owns parent-local geometry; collapse and viewport remain editor preferences.',
            properties: {
                id: {
                    type: 'string',
                },
                nodes: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                objective: {
                    type: 'string',
                },
                parent: {
                    type: ['null', 'string'],
                },
                ports: {
                    items: {
                        $ref: '#/definitions/WorkflowGroupPort',
                    },
                    type: 'array',
                },
                title: {
                    type: 'string',
                },
                x: {
                    type: 'number',
                },
                y: {
                    type: 'number',
                },
            },
            required: ['id', 'nodes', 'objective', 'parent', 'ports', 'title', 'x', 'y'],
            type: 'object',
        },
        WorkflowGroupPort: {
            description:
                'Published ports retain the original executable endpoint and explicit direction.',
            properties: {
                direction: {
                    $ref: '#/definitions/PortDirection',
                },
                endpoint: {
                    $ref: '#/definitions/WorkflowEndpoint',
                },
                id: {
                    type: 'string',
                },
                label: {
                    type: 'string',
                },
            },
            required: ['direction', 'endpoint', 'id', 'label'],
            type: 'object',
        },
        WorkflowGroupReference: {
            description:
                'Each revision references an immutable group body independently from executable node content.',
            properties: {
                content: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
            },
            required: ['content', 'id'],
            type: 'object',
        },
        WorkflowHumanAnswer: {
            description: 'An idempotent explicit answer command.',
            properties: {
                answer: {
                    type: ['string', 'boolean'],
                },
                commandId: {
                    type: 'string',
                },
                invocationId: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['answer', 'commandId', 'invocationId', 'nodeId', 'runId'],
            type: 'object',
        },
        WorkflowHumanIdentity: {
            description:
                'Exact invocation identity; the authenticated principal is never supplied by clients.',
            properties: {
                invocationId: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['invocationId', 'nodeId', 'runId'],
            type: 'object',
        },
        WorkflowHumanOutcome: {
            description: 'Terminal outcomes never infer an answer from silence.',
            enum: ['answered', 'approved', 'cancelled', 'changes_requested', 'expired', 'rejected'],
            type: 'string',
        },
        WorkflowHumanPage: {
            description:
                'Pending questions are capped per run and returned without completed output bodies.',
            properties: {
                items: {
                    items: {
                        $ref: '#/definitions/WorkflowHumanRequest',
                    },
                    type: 'array',
                },
                observedAtMs: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['items', 'observedAtMs', 'runId'],
            type: 'object',
        },
        WorkflowHumanRequest: {
            description:
                'Public owner-scoped read, shared by pending-run views and future inbox navigation.',
            properties: {
                answerType: {
                    $ref: '#/definitions/WorkflowAnswerType',
                },
                approval: {
                    $ref: '#/definitions/WorkflowApprovalProposal',
                    description:
                        'Immutable canonical content identified by a server-computed SHA-256 revision.',
                },
                canAnswer: {
                    type: 'boolean',
                },
                choices: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                createdAtMs: {
                    type: 'string',
                },
                expiresAtMs: {
                    type: 'string',
                },
                invocationId: {
                    type: 'string',
                },
                label: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
                question: {
                    type: 'string',
                },
                recipient: {
                    type: 'string',
                },
                response: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowHumanResponse',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                runId: {
                    type: 'string',
                },
                status: {
                    $ref: '#/definitions/WorkflowHumanStatus',
                },
                timeoutMs: {
                    type: 'string',
                },
            },
            required: [
                'answerType',
                'canAnswer',
                'choices',
                'createdAtMs',
                'expiresAtMs',
                'invocationId',
                'label',
                'nodeId',
                'question',
                'recipient',
                'response',
                'runId',
                'status',
                'timeoutMs',
            ],
            type: 'object',
        },
        WorkflowHumanResponse: {
            description: 'Recorded response evidence; expiry contains no actor or answer.',
            properties: {
                actor: {
                    type: ['null', 'string'],
                },
                answer: {
                    type: ['null', 'string', 'boolean'],
                },
                atMs: {
                    type: 'string',
                },
                commandId: {
                    type: ['null', 'string'],
                },
                comment: {
                    type: 'string',
                },
                outcome: {
                    $ref: '#/definitions/WorkflowHumanOutcome',
                },
                proposalRevision: {
                    type: 'string',
                },
            },
            required: ['actor', 'answer', 'atMs', 'commandId', 'outcome'],
            type: 'object',
        },
        WorkflowHumanStatus: {
            description: 'Request presentation state also reflects whole-run cancellation.',
            enum: [
                'answered',
                'approved',
                'cancelled',
                'changes_requested',
                'expired',
                'pending',
                'rejected',
            ],
            type: 'string',
        },
        WorkflowImageCandidate: {
            description:
                'All connected render quotes share the selected snapshot and its evidence.',
            properties: {
                evidence: {
                    $ref: '#/definitions/WorkflowImagePolicyEvidence',
                },
                model: {
                    type: 'string',
                },
                provider: {
                    type: 'string',
                },
                quotes: {
                    items: {
                        $ref: '#/definitions/WorkflowImageQuote',
                    },
                    type: 'array',
                },
            },
            required: ['evidence', 'model', 'provider', 'quotes'],
            type: 'object',
        },
        WorkflowImageCapabilities: {
            description: 'Supported image settings from the same adapter used by execution.',
            properties: {
                dimensions: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowImageDimensions',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                maxCount: {
                    type: 'number',
                },
                outputFormats: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                providerOptions: {
                    $ref: '#/definitions/Record%3Cstring%2Cstring%3E',
                },
                qualities: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                sizes: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
            },
            required: [
                'dimensions',
                'maxCount',
                'outputFormats',
                'providerOptions',
                'qualities',
                'sizes',
            ],
            type: 'object',
        },
        WorkflowImageDimensions: {
            description: 'Pixel limits for a model that supports custom dimensions.',
            properties: {
                experimentalAbovePixels: {
                    type: 'number',
                },
                maxAspectRatio: {
                    type: 'number',
                },
                maxEdge: {
                    type: 'number',
                },
                maxPixels: {
                    type: 'number',
                },
                minPixels: {
                    type: 'number',
                },
                multiple: {
                    type: 'number',
                },
            },
            required: [
                'experimentalAbovePixels',
                'maxAspectRatio',
                'maxEdge',
                'maxPixels',
                'minPixels',
                'multiple',
            ],
            type: 'object',
        },
        WorkflowImagePolicy: {
            description:
                'Image policies bound each complete render; token rate ceilings do not apply to image tariffs.',
            properties: {
                allowPreview: {
                    type: 'boolean',
                },
                maxCatalogAgeMs: {
                    type: 'string',
                },
                maxGenerationMicrocents: {
                    description:
                        'Null retains the existing run budget. A value additionally caps each image operation.',
                    type: ['null', 'string'],
                },
                region: {
                    type: ['null', 'string'],
                },
            },
            required: ['allowPreview', 'maxCatalogAgeMs', 'maxGenerationMicrocents', 'region'],
            type: 'object',
        },
        WorkflowImagePolicyEvidence: {
            description: 'Immutable evidence for a concrete image model selected at run creation.',
            properties: {
                catalogCheckedAtMs: {
                    type: 'string',
                },
                eligibilityReference: {
                    type: 'string',
                },
                eligibilityVerifiedAtMs: {
                    type: 'string',
                },
                factsDigest: {
                    type: 'string',
                },
                format: {
                    const: 1,
                    type: 'number',
                },
                policy: {
                    $ref: '#/definitions/WorkflowImagePolicy',
                },
                releaseAtMs: {
                    type: 'string',
                },
                releaseReference: {
                    type: 'string',
                },
            },
            required: [
                'catalogCheckedAtMs',
                'eligibilityReference',
                'eligibilityVerifiedAtMs',
                'factsDigest',
                'format',
                'policy',
                'releaseAtMs',
                'releaseReference',
            ],
            type: 'object',
        },
        WorkflowImageQuote: {
            description:
                'An estimate creates no reservation and is recalculated when accepting a run.',
            properties: {
                capabilityReference: {
                    type: 'string',
                },
                estimatedMicrocents: {
                    type: 'string',
                },
                model: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
                pricingReference: {
                    type: 'string',
                },
                provider: {
                    type: 'string',
                },
                quotedAtMs: {
                    type: 'string',
                },
                settings: {
                    $ref: '#/definitions/WorkflowImageSettings',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: [
                'capabilityReference',
                'estimatedMicrocents',
                'model',
                'nodeId',
                'pricingReference',
                'provider',
                'quotedAtMs',
                'settings',
                'workflowId',
            ],
            type: 'object',
        },
        WorkflowImageQuoteRequest: {
            description: 'Unsaved render settings may be priced only in an owned workflow.',
            properties: {
                model: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
                provider: {
                    type: 'string',
                },
                settings: {
                    $ref: '#/definitions/WorkflowImageSettings',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['model', 'nodeId', 'provider', 'settings', 'workflowId'],
            type: 'object',
        },
        WorkflowImageRequirement: {
            description: 'Per-operation settings sharing one reusable image-model binding.',
            properties: {
                nodeId: {
                    type: 'string',
                },
                settings: {
                    $ref: '#/definitions/WorkflowImageSettings',
                },
            },
            required: ['nodeId', 'settings'],
            type: 'object',
        },
        WorkflowImageResolution: {
            description:
                'An unresolved policy has a reason, never an invented candidate or zero-price placeholder.',
            properties: {
                candidate: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowImageCandidate',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                reason: {
                    type: ['null', 'string'],
                },
            },
            required: ['candidate', 'reason'],
            type: 'object',
        },
        WorkflowImageResolutionRequest: {
            description:
                'A read-only policy preview uses unsaved settings and authenticated account pricing.',
            properties: {
                policy: {
                    $ref: '#/definitions/WorkflowImagePolicy',
                },
                provider: {
                    type: 'string',
                },
                requirements: {
                    items: {
                        $ref: '#/definitions/WorkflowImageRequirement',
                    },
                    type: 'array',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['policy', 'provider', 'requirements', 'workflowId'],
            type: 'object',
        },
        WorkflowImageSettings: {
            description:
                'An exact request, bounded before admission and independent of a text model binding.',
            properties: {
                count: {
                    type: 'number',
                },
                operation: {
                    description: 'Older generation-only snapshots omit this field.',
                    enum: ['edit', 'generate'],
                    type: 'string',
                },
                options: {
                    $ref: '#/definitions/Record%3Cstring%2Cstring%7Cnumber%7Cboolean%3E',
                },
                outputFormat: {
                    type: 'string',
                },
                quality: {
                    type: 'string',
                },
                size: {
                    type: 'string',
                },
            },
            required: ['count', 'options', 'outputFormat', 'quality', 'size'],
            type: 'object',
        },
        WorkflowIntervalTiming: {
            description:
                'Millisecond strings preserve exact instants across transport and MongoDB.',
            properties: {
                endAtMs: {
                    type: ['null', 'string'],
                },
                intervalMs: {
                    type: 'string',
                },
                kind: {
                    const: 'interval',
                    type: 'string',
                },
                startAtMs: {
                    type: 'string',
                },
            },
            required: ['endAtMs', 'intervalMs', 'kind', 'startAtMs'],
            type: 'object',
        },
        WorkflowListCursor: {
            description:
                'Cursor uses a timestamp plus stable identity to handle equal update times.',
            properties: {
                updatedAtMs: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['updatedAtMs', 'workflowId'],
            type: 'object',
        },
        WorkflowListPage: {
            description: 'Bounded management page.',
            properties: {
                items: {
                    items: {
                        $ref: '#/definitions/WorkflowSummary',
                    },
                    type: 'array',
                },
                next: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowListCursor',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
            },
            required: ['items', 'next'],
            type: 'object',
        },
        WorkflowListRequest: {
            description: 'Metadata pagination carries no node payloads.',
            properties: {
                cursor: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowListCursor',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                limit: {
                    type: 'number',
                },
            },
            required: ['cursor', 'limit'],
            type: 'object',
        },
        WorkflowLoopSpendingRequest: {
            description: 'Select one authored loop in an owned immutable run.',
            properties: {
                loopId: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['loopId', 'runId'],
            type: 'object',
        },
        WorkflowLoopSpendingView: {
            description:
                'The public projection adds run-pinned configuration and explicitly marks mocked execution.',
            properties: {
                deadlineAtMs: {
                    type: ['null', 'string'],
                },
                entries: {
                    type: 'string',
                },
                lastReportedAtMs: {
                    type: ['null', 'string'],
                },
                limitMicrocents: {
                    type: ['null', 'string'],
                },
                loopId: {
                    type: 'string',
                },
                observedAtMs: {
                    type: 'string',
                },
                pricing: {
                    description: 'Present only on the negotiated classified-report method.',
                    items: {
                        $ref: '#/definitions/WorkflowSpendingBucket',
                    },
                    type: 'array',
                },
                reportedMicrocents: {
                    type: ['null', 'string'],
                },
                reservationCount: {
                    type: 'number',
                },
                reservedMicrocents: {
                    type: 'string',
                },
                revision: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                simulated: {
                    type: 'boolean',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: [
                'deadlineAtMs',
                'entries',
                'lastReportedAtMs',
                'limitMicrocents',
                'loopId',
                'observedAtMs',
                'reportedMicrocents',
                'reservationCount',
                'reservedMicrocents',
                'revision',
                'runId',
                'simulated',
                'workflowId',
            ],
            type: 'object',
        },
        WorkflowManifestPage: {
            description:
                'Bounded manifest page; offsets count references, never bytes or revisions.',
            properties: {
                details: {
                    $ref: '#/definitions/WorkflowDetails',
                },
                edges: {
                    items: {
                        $ref: '#/definitions/WorkflowEdgeReference',
                    },
                    type: 'array',
                },
                format: {
                    const: 1,
                    type: 'number',
                },
                groups: {
                    items: {
                        $ref: '#/definitions/WorkflowGroupReference',
                    },
                    type: 'array',
                },
                nextEdgeOffset: {
                    type: ['null', 'number'],
                },
                nextGroupOffset: {
                    type: ['null', 'number'],
                },
                nextNodeOffset: {
                    type: ['null', 'number'],
                },
                nodes: {
                    items: {
                        $ref: '#/definitions/WorkflowNodeReference',
                    },
                    type: 'array',
                },
                revision: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: [
                'details',
                'edges',
                'format',
                'nextEdgeOffset',
                'nextNodeOffset',
                'nodes',
                'revision',
                'workflowId',
            ],
            type: 'object',
        },
        WorkflowModelCapability: {
            description: 'Operations available through the workflow model picker.',
            enum: ['image', 'reasoning', 'text'],
            type: 'string',
        },
        WorkflowModelChoice: {
            description:
                'Public model metadata only: no endpoints, keys, account names, or adapter options.',
            properties: {
                availableAtCheck: {
                    description:
                        'Null/absent means no explicit endpoint check, rather than proof that a model is absent.',
                    type: ['null', 'boolean'],
                },
                compatible: {
                    type: 'boolean',
                },
                contextWindow: {
                    type: ['null', 'number'],
                },
                efforts: {
                    description:
                        'Available effort overrides for this model; absent means metadata is unavailable.',
                    items: {
                        $ref: '#/definitions/WorkflowModelEffort',
                    },
                    type: 'array',
                },
                id: {
                    type: 'string',
                },
                image: {
                    $ref: '#/definitions/WorkflowImageCapabilities',
                    description:
                        'Present only for generation models; token prices do not describe image tariffs.',
                },
                input: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                maxOutputTokens: {
                    type: ['null', 'number'],
                },
                name: {
                    type: 'string',
                },
                price: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowModelPrice',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                provider: {
                    type: 'string',
                },
                reason: {
                    type: ['null', 'string'],
                },
                reasoning: {
                    type: ['null', 'boolean'],
                },
                source: {
                    type: 'string',
                },
                status: {
                    type: 'string',
                },
            },
            required: [
                'compatible',
                'contextWindow',
                'id',
                'input',
                'maxOutputTokens',
                'name',
                'price',
                'provider',
                'reason',
                'reasoning',
                'source',
                'status',
            ],
            type: 'object',
        },
        WorkflowModelEffort: {
            description:
                'Saved reasoning levels shared by workflows and provider requests; null uses the service default.\nOne explicit effort level, independent of model-selection policy.',
            enum: ['high', 'low', 'max', 'medium', 'minimal', 'off', 'xhigh'],
            type: 'string',
        },
        WorkflowModelFeature: {
            description: 'Features that integrations can explicitly verify for model selection.',
            enum: ['documents', 'reasoning', 'structuredOutput', 'tools', 'vision'],
            type: 'string',
        },
        WorkflowModelPolicy: {
            description:
                'Saved, explicit constraints for the latest supported model on one provider.',
            properties: {
                allowPreview: {
                    type: 'boolean',
                },
                allowUnpriced: {
                    type: 'boolean',
                },
                maxCatalogAgeMs: {
                    description: 'Endpoint observation age, between one second and one day.',
                    type: 'string',
                },
                maxInputUsdPerMillion: {
                    description:
                        'Decimal USD per million tokens. Null is no additional rate ceiling.',
                    type: ['null', 'string'],
                },
                maxOutputUsdPerMillion: {
                    type: ['null', 'string'],
                },
                region: {
                    type: ['null', 'string'],
                },
                requiredFeatures: {
                    items: {
                        $ref: '#/definitions/WorkflowModelFeature',
                    },
                    type: 'array',
                },
            },
            required: [
                'allowPreview',
                'allowUnpriced',
                'maxCatalogAgeMs',
                'maxInputUsdPerMillion',
                'maxOutputUsdPerMillion',
                'region',
                'requiredFeatures',
            ],
            type: 'object',
        },
        WorkflowModelPolicyEvidence: {
            description: 'The facts and constraints used for one immutable latest-policy decision.',
            properties: {
                capabilityDigest: {
                    type: 'string',
                },
                catalogCheckedAtMs: {
                    type: 'string',
                },
                eligibilityReference: {
                    type: 'string',
                },
                eligibilityVerifiedAtMs: {
                    type: 'string',
                },
                format: {
                    const: 1,
                    type: 'number',
                },
                policy: {
                    $ref: '#/definitions/WorkflowModelPolicy',
                },
                releaseAtMs: {
                    type: 'string',
                },
                releaseReference: {
                    type: 'string',
                },
            },
            required: [
                'capabilityDigest',
                'catalogCheckedAtMs',
                'eligibilityReference',
                'eligibilityVerifiedAtMs',
                'format',
                'policy',
                'releaseAtMs',
                'releaseReference',
            ],
            type: 'object',
        },
        WorkflowModelPrice: {
            description:
                'Existing ledger rate-card values, represented as decimal text without client-side money math.',
            properties: {
                inputUsdPerMillion: {
                    type: ['null', 'string'],
                },
                outputUsdPerMillion: {
                    type: ['null', 'string'],
                },
            },
            required: ['inputUsdPerMillion', 'outputUsdPerMillion'],
            type: 'object',
        },
        WorkflowModelResolution: {
            properties: {
                candidate: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowModelChoice',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                evidence: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowModelPolicyEvidence',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                reason: {
                    type: ['null', 'string'],
                },
            },
            required: ['candidate', 'evidence', 'reason'],
            type: 'object',
        },
        WorkflowModelResolutionRequest: {
            description:
                'Owner-authorized policy preview; never saves a draft or performs inference.',
            properties: {
                capability: {
                    $ref: '#/definitions/Exclude',
                },
                maxOutputTokens: {
                    type: 'number',
                },
                policy: {
                    $ref: '#/definitions/WorkflowModelPolicy',
                },
                provider: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['capability', 'maxOutputTokens', 'policy', 'provider', 'workflowId'],
            type: 'object',
        },
        WorkflowModelsPage: {
            description:
                "Registered providers and a bounded page from the selected provider's maintained catalog.",
            properties: {
                freshness: {
                    const: 'not-reported',
                    description:
                        'Legacy marker retained for older clients; endpoint check times are in observation.',
                    type: 'string',
                },
                items: {
                    items: {
                        $ref: '#/definitions/WorkflowModelChoice',
                    },
                    type: 'array',
                },
                next: {
                    type: ['null', 'string'],
                },
                observation: {
                    $ref: '#/definitions/WorkflowCatalogObservation',
                    description:
                        'Optional for older clients. The legacy freshness marker remains unchanged.',
                },
                providers: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
            },
            required: ['freshness', 'items', 'next', 'providers'],
            type: 'object',
        },
        WorkflowModelsRequest: {
            description:
                "Discovery never changes a workflow or grants access to another account's resources.",
            properties: {
                after: {
                    type: ['null', 'string'],
                },
                capability: {
                    $ref: '#/definitions/WorkflowModelCapability',
                },
                compatibleOnly: {
                    type: 'boolean',
                },
                favorites: {
                    anyOf: [
                        {
                            items: {
                                type: 'string',
                            },
                            type: 'array',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                provider: {
                    type: ['null', 'string'],
                },
                query: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: [
                'after',
                'capability',
                'compatibleOnly',
                'favorites',
                'provider',
                'query',
                'workflowId',
            ],
            type: 'object',
        },
        WorkflowModelUsage: {
            description:
                'Actual executed identity and original tariff, never current catalog prices.',
            properties: {
                basis: {
                    $ref: '#/definitions/WorkflowSpendingBasis',
                },
                entries: {
                    type: 'string',
                },
                expiresAtMs: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                kind: {
                    $ref: '#/definitions/ChargeKind',
                },
                lastReportedAtMs: {
                    type: 'string',
                },
                microcents: {
                    type: 'string',
                },
                model: {
                    type: ['null', 'string'],
                },
                provider: {
                    type: ['null', 'string'],
                },
                tariff: {
                    anyOf: [
                        {
                            $ref: '#/definitions/PricingTariff',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                unitEntries: {
                    type: 'string',
                },
                unitLabel: {
                    type: ['null', 'string'],
                },
                units: {
                    type: ['null', 'string'],
                },
                usage: {
                    $ref: '#/definitions/WorkflowUsageDimensions',
                },
                usageEntries: {
                    $ref: '#/definitions/WorkflowUsageDimensions',
                },
            },
            required: [
                'basis',
                'entries',
                'expiresAtMs',
                'id',
                'kind',
                'lastReportedAtMs',
                'microcents',
                'model',
                'provider',
                'tariff',
                'unitEntries',
                'unitLabel',
                'units',
                'usage',
                'usageEntries',
            ],
            type: 'object',
        },
        WorkflowNode: {
            description:
                'Versioned component configuration; unsupported or incomplete components can be saved.',
            properties: {
                component: {
                    type: 'string',
                },
                componentVersion: {
                    type: 'string',
                },
                configuration: {
                    $ref: '#/definitions/WorkflowObject',
                },
                id: {
                    type: 'string',
                },
                label: {
                    type: 'string',
                },
                resources: {
                    items: {
                        $ref: '#/definitions/ResourceBinding',
                    },
                    type: 'array',
                },
            },
            required: [
                'component',
                'componentVersion',
                'configuration',
                'id',
                'label',
                'resources',
            ],
            type: 'object',
        },
        WorkflowNodeReference: {
            description: "One node's immutable content and independently versioned layout.",
            properties: {
                content: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                position: {
                    type: 'string',
                },
            },
            required: ['content', 'id', 'position'],
            type: 'object',
        },
        WorkflowObject: {
            additionalProperties: {
                $ref: '#/definitions/WorkflowValue',
            },
            description: 'JSON configuration is data, not an executable plan or authorization.',
            type: 'object',
        },
        WorkflowOnceTiming: {
            description:
                "A single UTC instant, displayed in the user's selected timezone by the client.",
            properties: {
                atMs: {
                    type: 'string',
                },
                kind: {
                    const: 'once',
                    type: 'string',
                },
            },
            required: ['atMs', 'kind'],
            type: 'object',
        },
        WorkflowPatch: {
            description: 'A bounded edit; layout changes never include node configuration.',
            properties: {
                details: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowDetails',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                edges: {
                    items: {
                        $ref: '#/definitions/WorkflowEdge',
                    },
                    type: 'array',
                },
                groups: {
                    description:
                        'Present together on hierarchy-aware edits; omission denotes a legacy writer.',
                    items: {
                        $ref: '#/definitions/WorkflowGroup',
                    },
                    type: 'array',
                },
                nodes: {
                    items: {
                        $ref: '#/definitions/WorkflowNode',
                    },
                    type: 'array',
                },
                positions: {
                    items: {
                        $ref: '#/definitions/WorkflowPosition',
                    },
                    type: 'array',
                },
                removeEdges: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                removeGroups: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                removeNodes: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
            },
            required: ['details', 'edges', 'nodes', 'positions', 'removeEdges', 'removeNodes'],
            type: 'object',
        },
        WorkflowPosition: {
            description:
                'Personal viewport is excluded; these positions belong to the workflow itself.',
            properties: {
                id: {
                    type: 'string',
                },
                x: {
                    type: 'number',
                },
                y: {
                    type: 'number',
                },
            },
            required: ['id', 'x', 'y'],
            type: 'object',
        },
        WorkflowPublication: {
            description:
                'A complete immutable manifest points to retained graph records, never a mutable draft.',
            properties: {
                format: {
                    const: 1,
                    type: 'number',
                },
                name: {
                    type: 'string',
                },
                policy: {
                    $ref: '#/definitions/WorkflowPublicationPolicy',
                },
                publicationId: {
                    type: 'string',
                },
                publishedAtMs: {
                    type: 'string',
                },
                revision: {
                    type: 'string',
                },
                version: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: [
                'format',
                'name',
                'policy',
                'publicationId',
                'publishedAtMs',
                'revision',
                'version',
                'workflowId',
            ],
            type: 'object',
        },
        WorkflowPublicationCheck: {
            description:
                'Validation is an observation; publishing and execution each recheck current access.',
            properties: {
                checkedAtMs: {
                    type: 'string',
                },
                issues: {
                    items: {
                        $ref: '#/definitions/GraphIssue',
                    },
                    type: 'array',
                },
                revision: {
                    type: 'string',
                },
                valid: {
                    type: 'boolean',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['checkedAtMs', 'issues', 'revision', 'valid', 'workflowId'],
            type: 'object',
        },
        WorkflowPublicationCheckRequest: {
            properties: {
                policy: {
                    $ref: '#/definitions/WorkflowPublicationPolicy',
                },
                revision: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['policy', 'revision', 'workflowId'],
            type: 'object',
        },
        WorkflowPublicationListRequest: {
            properties: {
                afterVersion: {
                    type: ['null', 'string'],
                },
                limit: {
                    type: 'number',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['afterVersion', 'limit', 'workflowId'],
            type: 'object',
        },
        WorkflowPublicationPage: {
            properties: {
                items: {
                    items: {
                        $ref: '#/definitions/WorkflowPublication',
                    },
                    type: 'array',
                },
                next: {
                    type: ['null', 'string'],
                },
            },
            required: ['items', 'next'],
            type: 'object',
        },
        WorkflowPublicationPolicy: {
            description: 'Limits reviewed before publication; run callers cannot override them.',
            properties: {
                maxConcurrency: {
                    type: 'number',
                },
                timeoutMs: {
                    type: 'string',
                },
                triggerNodeId: {
                    type: 'string',
                },
            },
            required: ['maxConcurrency', 'timeoutMs', 'triggerNodeId'],
            type: 'object',
        },
        WorkflowPublicationReadRequest: {
            properties: {
                publicationId: {
                    type: ['null', 'string'],
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['publicationId', 'workflowId'],
            type: 'object',
        },
        WorkflowPublicationReference: {
            description: 'Immutable publication identity, distinct from its source draft revision.',
            properties: {
                publicationId: {
                    type: 'string',
                },
                revision: {
                    type: 'string',
                },
                version: {
                    type: 'string',
                },
            },
            required: ['publicationId', 'revision', 'version'],
            type: 'object',
        },
        WorkflowPublishedRunRequest: {
            description:
                'Explicitly selected immutable version, with server-owned execution limits.',
            properties: {
                input: {
                    $ref: '#/definitions/WorkflowObject',
                },
                publicationId: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['input', 'publicationId', 'runId', 'workflowId'],
            type: 'object',
        },
        WorkflowPublishRequest: {
            properties: {
                commandId: {
                    type: 'string',
                },
                expectedDraftRevision: {
                    type: 'string',
                },
                expectedPublicationId: {
                    type: ['null', 'string'],
                },
                policy: {
                    $ref: '#/definitions/WorkflowPublicationPolicy',
                },
                revision: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: [
                'commandId',
                'expectedDraftRevision',
                'expectedPublicationId',
                'policy',
                'revision',
                'workflowId',
            ],
            type: 'object',
        },
        WorkflowPublishResult: {
            properties: {
                check: {
                    $ref: '#/definitions/WorkflowPublicationCheck',
                },
                publication: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowPublication',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
            },
            required: ['check', 'publication'],
            type: 'object',
        },
        WorkflowReadRequest: {
            description:
                'Null resolves the current revision only for the first page. Subsequent pages pin it.',
            properties: {
                edgeOffset: {
                    type: 'number',
                },
                groupOffset: {
                    type: 'number',
                },
                nodeOffset: {
                    type: 'number',
                },
                revision: {
                    type: ['null', 'string'],
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['edgeOffset', 'nodeOffset', 'revision', 'workflowId'],
            type: 'object',
        },
        WorkflowReceipt: {
            description: 'Result retained by command receipts, including after subsequent edits.',
            properties: {
                revision: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['revision', 'workflowId'],
            type: 'object',
        },
        WorkflowRecordPage: {
            description:
                'JSON text chunks are concatenated before parsing. Offsets count UTF-16 code units.',
            properties: {
                content: {
                    type: 'string',
                },
                nextOffset: {
                    type: ['null', 'number'],
                },
                offset: {
                    type: 'number',
                },
                reference: {
                    type: 'string',
                },
                totalCharacters: {
                    type: 'number',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: [
                'content',
                'nextOffset',
                'offset',
                'reference',
                'totalCharacters',
                'workflowId',
            ],
            type: 'object',
        },
        WorkflowRecordRequest: {
            description:
                "A reference identifies immutable content within the authenticated owner's workflow.",
            properties: {
                offset: {
                    type: 'number',
                },
                reference: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['offset', 'reference', 'workflowId'],
            type: 'object',
        },
        WorkflowRecordsPage: {
            description:
                'The response remains bounded even when a selected record contains a large prompt.',
            properties: {
                records: {
                    items: {
                        $ref: '#/definitions/WorkflowRecordPage',
                    },
                    type: 'array',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['records', 'workflowId'],
            type: 'object',
        },
        WorkflowRecordsRequest: {
            description:
                'Batches first pages of immutable values; larger records continue through workflows.record.',
            properties: {
                references: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['references', 'workflowId'],
            type: 'object',
        },
        WorkflowRunArtifact: {
            description:
                'Public immutable file metadata; neither storage paths nor global media IDs cross this boundary.',
            properties: {
                artifactId: {
                    type: 'string',
                },
                bytes: {
                    type: 'string',
                },
                contentType: {
                    type: 'string',
                },
                expiresAtMs: {
                    type: ['null', 'string'],
                },
                name: {
                    type: 'string',
                },
                sha256: {
                    type: 'string',
                },
            },
            required: ['artifactId', 'bytes', 'contentType', 'expiresAtMs', 'name', 'sha256'],
            type: 'object',
        },
        WorkflowRunArtifactPage: {
            description:
                'A bounded binary fragment; clients verify the complete SHA-256 after assembling all fragments.',
            properties: {
                artifact: {
                    $ref: '#/definitions/WorkflowRunArtifact',
                },
                artifactId: {
                    type: 'string',
                },
                base64: {
                    type: 'string',
                },
                nextOffset: {
                    type: ['null', 'number'],
                },
                offset: {
                    type: 'number',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['artifact', 'artifactId', 'base64', 'nextOffset', 'offset', 'runId'],
            type: 'object',
        },
        WorkflowRunArtifactRequest: {
            description:
                "One exact operation's artifact, addressed within the authenticated account and run.",
            properties: {
                artifactId: {
                    type: 'string',
                },
                offset: {
                    type: 'number',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['artifactId', 'offset', 'runId'],
            type: 'object',
        },
        WorkflowRunAttemptsPage: {
            properties: {
                items: {
                    items: {
                        $ref: '#/definitions/WorkflowStepView',
                    },
                    type: 'array',
                },
                next: {
                    type: ['null', 'number'],
                },
            },
            required: ['items', 'next'],
            type: 'object',
        },
        WorkflowRunAttemptsRequest: {
            description:
                'Lists exact invocations for a node without including captured input/output bodies.',
            properties: {
                afterAttempt: {
                    type: ['null', 'number'],
                },
                limit: {
                    type: 'number',
                },
                nodeId: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['afterAttempt', 'limit', 'nodeId', 'runId'],
            type: 'object',
        },
        WorkflowRunBreakdownRequest: {
            properties: {
                dimension: {
                    $ref: '#/definitions/WorkflowUsageDimension',
                },
                offset: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['dimension', 'offset', 'runId'],
            type: 'object',
        },
        WorkflowRunBreakdownView: {
            properties: {
                dimension: {
                    $ref: '#/definitions/WorkflowUsageDimension',
                },
                entries: {
                    type: 'string',
                },
                expiresAtMs: {
                    type: ['null', 'string'],
                },
                groupCount: {
                    type: 'string',
                },
                groups: {
                    items: {
                        $ref: '#/definitions/WorkflowUsageGroup',
                    },
                    type: 'array',
                },
                labels: {
                    items: {
                        $ref: '#/definitions/WorkflowUsageGroupLabel',
                    },
                    type: 'array',
                },
                lastReportedAtMs: {
                    type: ['null', 'string'],
                },
                next: {
                    type: ['null', 'string'],
                },
                observedAtMs: {
                    type: 'string',
                },
                offset: {
                    type: 'string',
                },
                pricing: {
                    items: {
                        $ref: '#/definitions/WorkflowSpendingBucket',
                    },
                    type: 'array',
                },
                reportedMicrocents: {
                    type: ['null', 'string'],
                },
                retainedFromMs: {
                    type: ['null', 'string'],
                },
                revision: {
                    type: 'string',
                },
                runEntries: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                simulated: {
                    type: 'boolean',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: [
                'dimension',
                'entries',
                'expiresAtMs',
                'groupCount',
                'groups',
                'labels',
                'lastReportedAtMs',
                'next',
                'observedAtMs',
                'offset',
                'pricing',
                'reportedMicrocents',
                'retainedFromMs',
                'revision',
                'runEntries',
                'runId',
                'simulated',
                'workflowId',
            ],
            type: 'object',
        },
        WorkflowRunEvent: {
            properties: {
                atMs: {
                    type: 'string',
                },
                invocationId: {
                    type: ['null', 'string'],
                },
                kind: {
                    $ref: '#/definitions/WorkflowRunEventKind',
                },
                message: {
                    type: ['null', 'string'],
                },
                nodeId: {
                    type: ['null', 'string'],
                },
                origin: {
                    $ref: '#/definitions/WorkflowStepOrigin',
                    description:
                        'An execution instance points back to the immutable authored card and its collection item.',
                },
                runId: {
                    type: 'string',
                },
                sequence: {
                    type: 'string',
                },
                status: {
                    enum: [
                        'cancelled',
                        'failed',
                        'interrupted',
                        'queued',
                        'running',
                        'skipped',
                        'succeeded',
                        'uncertain',
                        'waiting',
                    ],
                    type: 'string',
                },
            },
            required: [
                'atMs',
                'invocationId',
                'kind',
                'message',
                'nodeId',
                'runId',
                'sequence',
                'status',
            ],
            type: 'object',
        },
        WorkflowRunEventKind: {
            enum: [
                'accepted',
                'cancelled',
                'claimed',
                'finished',
                'resumed',
                'step-finished',
                'step-started',
                'step-waiting',
                'suspended',
            ],
            type: 'string',
        },
        WorkflowRunEventsRequest: {
            description: 'Reads ordered journal events after an exclusive sequence.',
            properties: {
                after: {
                    type: 'string',
                },
                limit: {
                    type: 'number',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['after', 'limit', 'runId'],
            type: 'object',
        },
        WorkflowRunListPage: {
            description: 'A bounded history page ordered by creation time and run ID.',
            properties: {
                items: {
                    items: {
                        $ref: '#/definitions/WorkflowRunSummary',
                    },
                    type: 'array',
                },
                next: {
                    type: ['null', 'string'],
                },
            },
            required: ['items', 'next'],
            type: 'object',
        },
        WorkflowRunListRequest: {
            description: 'Pages run history for one owned workflow.',
            properties: {
                afterRunId: {
                    type: ['null', 'string'],
                },
                limit: {
                    type: 'number',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['afterRunId', 'limit', 'workflowId'],
            type: 'object',
        },
        WorkflowRunMode: {
            enum: ['live-test', 'mock-test', 'published'],
            type: 'string',
        },
        WorkflowRunOutputPage: {
            description: 'A bounded JSON fragment with total length and continuation offset.',
            properties: {
                content: {
                    type: 'string',
                },
                invocationId: {
                    type: 'string',
                },
                nextOffset: {
                    type: ['null', 'number'],
                },
                nodeId: {
                    type: 'string',
                },
                offset: {
                    type: 'number',
                },
                runId: {
                    type: 'string',
                },
                totalCharacters: {
                    type: 'number',
                },
            },
            required: [
                'content',
                'invocationId',
                'nextOffset',
                'nodeId',
                'offset',
                'runId',
                'totalCharacters',
            ],
            type: 'object',
        },
        WorkflowRunOutputRequest: {
            description: 'Addresses one exact attempt and a UTF-16 offset into its encoded result.',
            properties: {
                invocationId: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
                offset: {
                    type: 'number',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['invocationId', 'nodeId', 'offset', 'runId'],
            type: 'object',
        },
        WorkflowRunRequest: {
            description: 'Addresses a run within the authenticated principal.',
            properties: {
                runId: {
                    type: 'string',
                },
            },
            required: ['runId'],
            type: 'object',
        },
        WorkflowRunStartRequest: {
            description: 'Starts one idempotent run of an owned saved revision.',
            properties: {
                input: {
                    $ref: '#/definitions/WorkflowObject',
                },
                maxConcurrency: {
                    type: 'number',
                },
                mode: {
                    $ref: '#/definitions/WorkflowRunMode',
                },
                revision: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                timeoutMs: {
                    type: 'string',
                },
                triggerNodeId: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: [
                'input',
                'maxConcurrency',
                'mode',
                'revision',
                'runId',
                'timeoutMs',
                'triggerNodeId',
                'workflowId',
            ],
            type: 'object',
        },
        WorkflowRunStatus: {
            enum: ['cancelled', 'failed', 'queued', 'running', 'succeeded', 'waiting'],
            type: 'string',
        },
        WorkflowRunStepsPage: {
            description: 'A bounded step page and its continuation cursor.',
            properties: {
                items: {
                    items: {
                        $ref: '#/definitions/WorkflowStepView',
                    },
                    type: 'array',
                },
                next: {
                    type: ['null', 'string'],
                },
            },
            required: ['items', 'next'],
            type: 'object',
        },
        WorkflowRunStepsRequest: {
            description: 'Reads bounded step metadata after an exclusive node ID.',
            properties: {
                afterNodeId: {
                    type: ['null', 'string'],
                },
                limit: {
                    type: 'number',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['afterNodeId', 'limit', 'runId'],
            type: 'object',
        },
        WorkflowRunSummary: {
            properties: {
                createdAtMs: {
                    type: 'string',
                },
                message: {
                    type: ['null', 'string'],
                },
                mode: {
                    $ref: '#/definitions/WorkflowRunMode',
                },
                publication: {
                    $ref: '#/definitions/WorkflowPublicationReference',
                    description:
                        'Immutable publication identity, distinct from its source draft revision.',
                },
                runId: {
                    type: 'string',
                },
                schedule: {
                    $ref: '#/definitions/WorkflowScheduleSource',
                    description: 'Present only on scheduled published runs.',
                },
                sequence: {
                    type: 'string',
                },
                status: {
                    $ref: '#/definitions/WorkflowRunStatus',
                },
                updatedAtMs: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
                workflowRevision: {
                    type: 'string',
                },
            },
            required: [
                'createdAtMs',
                'message',
                'mode',
                'runId',
                'sequence',
                'status',
                'updatedAtMs',
                'workflowId',
                'workflowRevision',
            ],
            type: 'object',
        },
        WorkflowRunUsageRequest: {
            description: 'Only the owned run and a bounded page may be selected by a client.',
            properties: {
                offset: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['offset', 'runId'],
            type: 'object',
        },
        WorkflowRunUsageView: {
            description: 'Mock executions cannot supply live metering evidence.',
            properties: {
                entries: {
                    type: 'string',
                },
                expiresAtMs: {
                    type: ['null', 'string'],
                },
                lastReportedAtMs: {
                    type: ['null', 'string'],
                },
                modelCount: {
                    type: 'string',
                },
                models: {
                    items: {
                        $ref: '#/definitions/WorkflowModelUsage',
                    },
                    type: 'array',
                },
                next: {
                    type: ['null', 'string'],
                },
                observedAtMs: {
                    type: 'string',
                },
                offset: {
                    type: 'string',
                },
                pricing: {
                    items: {
                        $ref: '#/definitions/WorkflowSpendingBucket',
                    },
                    type: 'array',
                },
                reportedMicrocents: {
                    type: ['null', 'string'],
                },
                retainedFromMs: {
                    type: ['null', 'string'],
                },
                revision: {
                    type: 'string',
                },
                runId: {
                    type: 'string',
                },
                simulated: {
                    type: 'boolean',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: [
                'entries',
                'expiresAtMs',
                'lastReportedAtMs',
                'modelCount',
                'models',
                'next',
                'observedAtMs',
                'offset',
                'pricing',
                'reportedMicrocents',
                'retainedFromMs',
                'revision',
                'runId',
                'simulated',
                'workflowId',
            ],
            type: 'object',
        },
        WorkflowSaveRequest: {
            description: 'Command identity and expected revision serve different purposes.',
            properties: {
                commandId: {
                    type: 'string',
                },
                expectedRevision: {
                    type: 'string',
                },
                patch: {
                    $ref: '#/definitions/WorkflowPatch',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['commandId', 'expectedRevision', 'patch', 'workflowId'],
            type: 'object',
        },
        WorkflowScheduleCommand: {
            description: 'Configuration revision is independent of execution progress.',
            properties: {
                commandId: {
                    type: 'string',
                },
                expectedRevision: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['commandId', 'expectedRevision', 'workflowId'],
            type: 'object',
        },
        WorkflowScheduleConfiguration: {
            description:
                'Activation binds saved timing rules to one publication and its submitted input.',
            properties: {
                catchUpLimit: {
                    type: 'number',
                },
                input: {
                    $ref: '#/definitions/WorkflowObject',
                },
                lateGraceMs: {
                    type: 'string',
                },
                maxConcurrentRuns: {
                    type: 'number',
                },
                missed: {
                    $ref: '#/definitions/WorkflowScheduleMissed',
                },
                publicationId: {
                    type: 'string',
                },
                timing: {
                    $ref: '#/definitions/WorkflowScheduleTiming',
                },
            },
            required: [
                'catchUpLimit',
                'input',
                'lateGraceMs',
                'maxConcurrentRuns',
                'missed',
                'publicationId',
                'timing',
            ],
            type: 'object',
        },
        WorkflowScheduleEnable: {
            description:
                'Explicit enable or replace command containing the reviewed complete configuration.',
            properties: {
                commandId: {
                    type: 'string',
                },
                configuration: {
                    $ref: '#/definitions/WorkflowScheduleConfiguration',
                },
                expectedRevision: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['commandId', 'configuration', 'expectedRevision', 'workflowId'],
            type: 'object',
        },
        WorkflowScheduleEvent: {
            description: 'Concise automation status evidence.',
            properties: {
                atMs: {
                    type: 'string',
                },
                message: {
                    type: ['null', 'string'],
                },
                occurrenceMs: {
                    type: 'string',
                },
                outcome: {
                    enum: ['accepted', 'blocked', 'skipped'],
                    type: 'string',
                },
                runId: {
                    type: ['null', 'string'],
                },
            },
            required: ['atMs', 'message', 'occurrenceMs', 'outcome', 'runId'],
            type: 'object',
        },
        WorkflowScheduleMissed: {
            description:
                'Late occurrences are skipped, coalesced into the latest, or replayed up to a configured cap.\nExplicit outage handling policy.',
            enum: ['catch-up', 'latest', 'skip'],
            type: 'string',
        },
        WorkflowSchedulePreview: {
            description: 'Preview performs no activation, storage mutation or run preparation.',
            properties: {
                afterMs: {
                    type: 'string',
                },
                timing: {
                    $ref: '#/definitions/WorkflowScheduleTiming',
                },
            },
            required: ['afterMs', 'timing'],
            type: 'object',
        },
        WorkflowScheduleRead: {
            description: 'Owner-scoped current automation state.',
            properties: {
                workflowId: {
                    type: 'string',
                },
            },
            required: ['workflowId'],
            type: 'object',
        },
        WorkflowScheduleSource: {
            description:
                'Immutable provenance included in both the execution snapshot and run metadata.',
            properties: {
                occurrenceMs: {
                    type: 'string',
                },
                revision: {
                    type: 'string',
                },
            },
            required: ['occurrenceMs', 'revision'],
            type: 'object',
        },
        WorkflowScheduleStatus: {
            description:
                'UI and runtime share these lifecycle meanings.\nDurable activation state, separate from run status.',
            enum: ['blocked', 'complete', 'disabled', 'enabled'],
            type: 'string',
        },
        WorkflowScheduleTiming: {
            anyOf: [
                {
                    $ref: '#/definitions/WorkflowCalendarTiming',
                },
                {
                    $ref: '#/definitions/WorkflowIntervalTiming',
                },
                {
                    $ref: '#/definitions/WorkflowOnceTiming',
                },
                {
                    $ref: '#/definitions/WorkflowCompletionTiming',
                },
            ],
            description: 'Supported timing forms, with inclusive start and end instants.',
        },
        WorkflowScheduleView: {
            description:
                'No graph, outputs, credentials or unbounded event collections are embedded here.',
            properties: {
                configuration: {
                    $ref: '#/definitions/WorkflowScheduleConfiguration',
                },
                last: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowScheduleEvent',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
                nextAtMs: {
                    type: ['null', 'string'],
                },
                pendingCount: {
                    type: 'number',
                },
                revision: {
                    type: 'string',
                },
                skippedOccurrences: {
                    type: 'string',
                },
                status: {
                    $ref: '#/definitions/WorkflowScheduleStatus',
                },
                updatedAtMs: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: [
                'configuration',
                'last',
                'nextAtMs',
                'pendingCount',
                'revision',
                'skippedOccurrences',
                'status',
                'updatedAtMs',
                'workflowId',
            ],
            type: 'object',
        },
        WorkflowSpendingBasis: {
            description:
                'Legacy reporting never infers a pricing classification from its amount.\nA bounded classification independent of mutable provider pricing.',
            enum: [
                'adjustment',
                'estimate',
                'included-estimate',
                'included-unpriced',
                'legacy',
                'local',
                'unpriced',
                'wallet',
            ],
            type: 'string',
        },
        WorkflowSpendingBucket: {
            description:
                'Exact subtotal and usage count; buckets partition the recorded amount, never add another charge.',
            properties: {
                basis: {
                    $ref: '#/definitions/WorkflowSpendingBasis',
                },
                entries: {
                    type: 'string',
                },
                microcents: {
                    type: 'string',
                },
            },
            required: ['basis', 'entries', 'microcents'],
            type: 'object',
        },
        WorkflowStepOrigin: {
            description:
                'An execution instance points back to the immutable authored card and its collection item.',
            properties: {
                itemIndex: {
                    type: 'number',
                },
                loopId: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
            },
            required: ['itemIndex', 'loopId', 'nodeId'],
            type: 'object',
        },
        WorkflowStepStatus: {
            enum: [
                'cancelled',
                'failed',
                'interrupted',
                'running',
                'skipped',
                'succeeded',
                'uncertain',
                'waiting',
            ],
            type: 'string',
        },
        WorkflowStepUsageIdentity: {
            properties: {
                attempt: {
                    type: 'string',
                },
                invocationId: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
                origin: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowStepUsageOrigin',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
            },
            required: ['attempt', 'invocationId', 'nodeId', 'origin'],
            type: 'object',
        },
        WorkflowStepUsageOrigin: {
            properties: {
                itemIndex: {
                    type: 'string',
                },
                loopId: {
                    type: 'string',
                },
                nodeId: {
                    type: 'string',
                },
            },
            required: ['itemIndex', 'loopId', 'nodeId'],
            type: 'object',
        },
        WorkflowStepView: {
            description:
                'Exposes step metadata without embedding potentially large result payloads.',
            properties: {
                attempt: {
                    type: 'number',
                },
                component: {
                    type: 'string',
                },
                finishedAtMs: {
                    type: ['null', 'string'],
                },
                hasResult: {
                    type: 'boolean',
                },
                invocationId: {
                    type: 'string',
                },
                label: {
                    type: 'string',
                },
                message: {
                    type: ['null', 'string'],
                },
                nodeId: {
                    type: 'string',
                },
                origin: {
                    $ref: '#/definitions/WorkflowStepOrigin',
                    description:
                        'Only repeated instances carry this provenance; nodeId identifies the execution instance.',
                },
                startedAtMs: {
                    type: 'string',
                },
                status: {
                    $ref: '#/definitions/WorkflowStepStatus',
                },
                wakeAtMs: {
                    description:
                        'Persisted timer target; retained after completion or cancellation as timing evidence.',
                    type: 'string',
                },
            },
            required: [
                'attempt',
                'component',
                'finishedAtMs',
                'hasResult',
                'invocationId',
                'label',
                'message',
                'nodeId',
                'startedAtMs',
                'status',
            ],
            type: 'object',
        },
        WorkflowSummary: {
            description:
                'Small management projection; contains no graph, prompts, or run histories.',
            properties: {
                createdAtMs: {
                    type: 'string',
                },
                details: {
                    $ref: '#/definitions/WorkflowDetails',
                },
                edgeCount: {
                    type: 'number',
                },
                nodeCount: {
                    type: 'number',
                },
                publication: {
                    $ref: '#/definitions/WorkflowPublicationReference',
                    description:
                        'Immutable publication identity, distinct from its source draft revision.',
                },
                revision: {
                    type: 'string',
                },
                updatedAtMs: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: [
                'createdAtMs',
                'details',
                'edgeCount',
                'nodeCount',
                'revision',
                'updatedAtMs',
                'workflowId',
            ],
            type: 'object',
        },
        WorkflowTerminalCommand: {
            properties: {
                action: {
                    $ref: '#/definitions/TerminalAction',
                },
                cols: {
                    type: 'number',
                },
                commandId: {
                    type: 'string',
                },
                expectedRevision: {
                    type: 'string',
                },
                input: {
                    type: 'string',
                },
                rows: {
                    type: 'number',
                },
                sessionId: {
                    type: 'string',
                },
            },
            required: [
                'action',
                'cols',
                'commandId',
                'expectedRevision',
                'input',
                'rows',
                'sessionId',
            ],
            type: 'object',
        },
        WorkflowTerminalRequest: {
            properties: {
                sessionId: {
                    type: 'string',
                },
            },
            required: ['sessionId'],
            type: 'object',
        },
        WorkflowTerminalSnapshot: {
            properties: {
                application: {
                    $ref: '#/definitions/WorkflowApplication',
                },
                cols: {
                    type: 'number',
                },
                commandId: {
                    type: 'string',
                },
                commandRevision: {
                    type: 'string',
                },
                error: {
                    type: 'string',
                },
                revision: {
                    type: 'string',
                },
                rows: {
                    type: 'number',
                },
                screen: {
                    type: 'string',
                },
                sessionId: {
                    type: 'string',
                },
                setup: {
                    type: 'boolean',
                },
                status: {
                    $ref: '#/definitions/TerminalStatus',
                },
            },
            required: [
                'application',
                'cols',
                'commandId',
                'commandRevision',
                'error',
                'revision',
                'rows',
                'screen',
                'sessionId',
                'setup',
                'status',
            ],
            type: 'object',
        },
        WorkflowUsageDimension: {
            description: 'Alternative partitions of the same reported usage.',
            enum: ['agents', 'steps'],
            type: 'string',
        },
        WorkflowUsageDimensions: {
            description: 'Exact counters; missing dimensions were not reported.',
            properties: {
                cachedInputTokens: {
                    type: 'string',
                },
                inputTokens: {
                    type: 'string',
                },
                outputTokens: {
                    type: 'string',
                },
                reasoningTokens: {
                    type: 'string',
                },
            },
            type: 'object',
        },
        WorkflowUsageGroup: {
            properties: {
                entries: {
                    type: 'string',
                },
                expiresAtMs: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                identity: {
                    anyOf: [
                        {
                            $ref: '#/definitions/WorkflowStepUsageIdentity',
                        },
                        {
                            $ref: '#/definitions/WorkflowAgentUsageIdentity',
                        },
                    ],
                },
                lastReportedAtMs: {
                    type: 'string',
                },
                microcents: {
                    type: 'string',
                },
                pricing: {
                    items: {
                        $ref: '#/definitions/WorkflowSpendingBucket',
                    },
                    type: 'array',
                },
            },
            required: [
                'entries',
                'expiresAtMs',
                'id',
                'identity',
                'lastReportedAtMs',
                'microcents',
                'pricing',
            ],
            type: 'object',
        },
        WorkflowUsageGroupLabel: {
            description:
                'Labels come from the owned immutable graph; they do not choose the billing partition.',
            properties: {
                component: {
                    type: 'string',
                },
                id: {
                    type: 'string',
                },
                label: {
                    type: 'string',
                },
            },
            required: ['component', 'id', 'label'],
            type: 'object',
        },
        WorkflowValidateRequest: {
            description: 'Authoritative validation always names one immutable saved revision.',
            properties: {
                revision: {
                    type: 'string',
                },
                workflowId: {
                    type: 'string',
                },
            },
            required: ['revision', 'workflowId'],
            type: 'object',
        },
        WorkflowValue: {
            anyOf: [
                {
                    $ref: '#/definitions/WorkflowObject',
                },
                {
                    items: {
                        $ref: '#/definitions/WorkflowValue',
                    },
                    type: 'array',
                },
                {
                    type: ['null', 'string', 'number', 'boolean'],
                },
            ],
            description: 'Large integers and financial values must use decimal strings.',
        },
        Workspace: {
            description: 'An isolated place an agent works.',
            properties: {
                createdAt: {
                    type: 'number',
                },
                destroyedAt: {
                    description: 'When the tree was removed. Present exactly on a tombstone.',
                    type: 'number',
                },
                expiresAt: {
                    description: 'When an ephemeral workspace should be reaped.',
                    type: 'number',
                },
                extraRoots: {
                    description:
                        'Additional roots tools may also reach (a shared cache, a read-only reference checkout).',
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                id: {
                    type: 'string',
                },
                kind: {
                    $ref: '#/definitions/WorkspaceKind',
                },
                leases: {
                    description:
                        'Runs currently holding it. Read through {@link activeLeases}, which drops expired ones.',
                    items: {
                        $ref: '#/definitions/WorkspaceLeaseRecord',
                    },
                    type: 'array',
                },
                name: {
                    description: 'A human name, e.g. `acme-migration`.',
                    type: 'string',
                },
                owner: {
                    $ref: '#/definitions/WorkspaceOwner',
                    description:
                        "Who may use it. Absent means the deployment's default policy decides.",
                },
                quota: {
                    $ref: '#/definitions/WorkspaceQuota',
                    description:
                        "Ceilings for this workspace's contents. Absent means unbounded — see {@link WorkspaceQuota}.",
                },
                root: {
                    description:
                        'The absolute root. Every tool bound to this workspace is confined here.',
                    type: 'string',
                },
                state: {
                    description:
                        'Where it is in its lifecycle.\n\nOptional because records written before the lifecycle existed do not carry it, and those\nrecords are on disk in every install that already made a workspace. Read it through\n{@link stateOf}, which supplies the only truthful default for such a record: it was created\nand it was never being destroyed, because the old destroy path deleted the row outright.',
                    enum: ['active', 'creating', 'destroyed', 'destroying', 'draining', 'expired'],
                    type: 'string',
                },
                tags: {
                    description: 'Free-form labels.',
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                updatedAt: {
                    type: 'number',
                },
                usage: {
                    $ref: '#/definitions/WorkspaceUsage',
                    description:
                        'Last known contents. Read through {@link usageOf}, which defaults a legacy record to zero.',
                },
                worktree: {
                    description:
                        "Set when this workspace IS a git worktree, so destroy unregisters it rather than deleting it.\n\nRecorded on the workspace because destroy has to know: removing the directory of a worktree\nleaves its registration in the source repository's `.git/worktrees`, and the branch stays\nchecked-out-somewhere forever with the name unusable.",
                    properties: {
                        branch: {
                            type: 'string',
                        },
                        deleteBranchOnDestroy: {
                            type: 'boolean',
                        },
                        repo: {
                            type: 'string',
                        },
                    },
                    required: ['branch', 'repo'],
                    type: 'object',
                },
            },
            required: ['createdAt', 'id', 'kind', 'name', 'root', 'updatedAt'],
            type: 'object',
        },
        WorkspaceCreateParams: {
            description:
                'What `workspaces.create` is asked for. Narrower than `CreateWorkspaceInput` — see the handler.',
            properties: {
                name: {
                    type: 'string',
                },
                tags: {
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                ttlMs: {
                    type: 'number',
                },
            },
            required: ['name'],
            type: 'object',
        },
        WorkspaceDescription: {
            description:
                'A workspace plus the lifecycle facts a caller has to see to make a decision about it.',
            properties: {
                createdAt: {
                    type: 'number',
                },
                destroyedAt: {
                    description: 'When the tree was removed. Present exactly on a tombstone.',
                    type: 'number',
                },
                expiresAt: {
                    description: 'When an ephemeral workspace should be reaped.',
                    type: 'number',
                },
                extraRoots: {
                    description:
                        'Additional roots tools may also reach (a shared cache, a read-only reference checkout).',
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                id: {
                    type: 'string',
                },
                kind: {
                    $ref: '#/definitions/WorkspaceKind',
                },
                leases: {
                    description:
                        'Only the leases still counting; expired ones are not shown because they hold nothing.',
                    items: {
                        $ref: '#/definitions/WorkspaceLeaseRecord',
                    },
                    type: 'array',
                },
                name: {
                    description: 'A human name, e.g. `acme-migration`.',
                    type: 'string',
                },
                owner: {
                    $ref: '#/definitions/WorkspaceOwner',
                    description:
                        "Who may use it. Absent means the deployment's default policy decides.",
                },
                quota: {
                    $ref: '#/definitions/WorkspaceQuota',
                    description:
                        "Ceilings for this workspace's contents. Absent means unbounded — see {@link WorkspaceQuota}.",
                },
                root: {
                    description:
                        'The absolute root. Every tool bound to this workspace is confined here.',
                    type: 'string',
                },
                state: {
                    $ref: '#/definitions/WorkspaceState',
                    description:
                        'Where it is in its lifecycle.\n\nOptional because records written before the lifecycle existed do not carry it, and those\nrecords are on disk in every install that already made a workspace. Read it through\n{@link stateOf}, which supplies the only truthful default for such a record: it was created\nand it was never being destroyed, because the old destroy path deleted the row outright.',
                },
                tags: {
                    description: 'Free-form labels.',
                    items: {
                        type: 'string',
                    },
                    type: 'array',
                },
                updatedAt: {
                    type: 'number',
                },
                usage: {
                    $ref: '#/definitions/WorkspaceUsage',
                    description:
                        'Last known contents. Read through {@link usageOf}, which defaults a legacy record to zero.',
                },
                worktree: {
                    description:
                        "Set when this workspace IS a git worktree, so destroy unregisters it rather than deleting it.\n\nRecorded on the workspace because destroy has to know: removing the directory of a worktree\nleaves its registration in the source repository's `.git/worktrees`, and the branch stays\nchecked-out-somewhere forever with the name unusable.",
                    properties: {
                        branch: {
                            type: 'string',
                        },
                        deleteBranchOnDestroy: {
                            type: 'boolean',
                        },
                        repo: {
                            type: 'string',
                        },
                    },
                    required: ['branch', 'repo'],
                    type: 'object',
                },
            },
            required: [
                'createdAt',
                'id',
                'kind',
                'leases',
                'name',
                'root',
                'state',
                'updatedAt',
                'usage',
            ],
            type: 'object',
        },
        WorkspaceDestroyParams: {
            description: 'What `workspaces.destroy` is asked for.',
            properties: {
                force: {
                    description:
                        'Overrides live leases. Recorded in the audit trail with the runs it overrode.',
                    type: 'boolean',
                },
                id: {
                    type: 'string',
                },
            },
            required: ['id'],
            type: 'object',
        },
        WorkspaceKind: {
            description: 'How a workspace came to exist, which decides how it is cleaned up.',
            enum: ['attached', 'ephemeral', 'managed'],
            type: 'string',
        },
        WorkspaceLeaseRecord: {
            description:
                "One run's claim on a workspace, as stored in the record.\n\nDurable rather than in-process, because the process holding the lease and the process asked to\ndestroy the workspace are routinely different ones — a gateway serving a conversation and a CLI\nrunning `nexa workspace destroy`. An in-memory lease would be invisible to exactly the caller it\nhas to stop. `expiresAt` is what keeps a crashed run from pinning a workspace forever: a lease\nnobody heartbeats stops counting on its own.",
            properties: {
                acquiredAt: {
                    type: 'number',
                },
                expiresAt: {
                    type: 'number',
                },
                runId: {
                    type: 'string',
                },
            },
            required: ['acquiredAt', 'expiresAt', 'runId'],
            type: 'object',
        },
        WorkspaceOwner: {
            description: 'Who a workspace belongs to.',
            properties: {
                agentId: {
                    type: 'string',
                },
                projectId: {
                    type: 'string',
                },
                userId: {
                    type: 'string',
                },
            },
            type: 'object',
        },
        WorkspaceQuota: {
            description:
                "The ceilings a workspace's contents may not pass.\n\nBoth are OPTIONAL and both default to absent, which means unbounded. That is deliberate and it is\nthe opposite of what the plan's \"2 GiB by default\" says: a user who tells the agent to clone a\n10 GB monorepo into a workspace has asked for exactly that, and a default ceiling would refuse\nthe user's own instruction with an error about a limit they never chose. A quota here is a\nrunaway guard an operator sets on a shared deployment, or a bound a caller puts on one specific\nworkspace — never a product limit that arrives by omission.",
            properties: {
                maxBytes: {
                    description: 'Byte ceiling for the tree. Absent means unbounded.',
                    type: 'number',
                },
                maxFiles: {
                    description:
                        'File-count ceiling. Absent means unbounded — a million tiny files is invisible to a byte quota.',
                    type: 'number',
                },
            },
            type: 'object',
        },
        WorkspaceState: {
            description:
                'Where a workspace is in its life.\n\nThe states exist because destruction is not instantaneous and must not be silent. A workspace\nholds the user\'s work, so "delete it" has to pass through a phase where a run that is still\nwriting can stop it (`draining`), and a phase that survives a crash so the next start can finish\nthe job instead of finding a half-emptied tree behind a record that still says `active`\n(`destroying`). `expired` is the grace state: a user who comes back a week after a task\nworkspace\'s TTL sees "this expired, here is how to keep it" rather than a vanished directory.',
            enum: ['active', 'creating', 'destroyed', 'destroying', 'draining', 'expired'],
            type: 'string',
        },
        WorkspaceUsage: {
            description:
                'What a workspace currently holds, and when that was last measured against the disk.',
            properties: {
                bytes: {
                    type: 'number',
                },
                files: {
                    type: 'number',
                },
                reconciledAt: {
                    description:
                        'When a full walk last corrected these numbers. `0` means never — the counters are then a\nlower bound built from writes this process saw, which is honest but not authoritative.',
                    type: 'number',
                },
            },
            required: ['bytes', 'files', 'reconciledAt'],
            type: 'object',
        },
    },
    description: 'All protocol contracts reachable from the public transport.',
    properties: {
        approvalRequested: {
            $ref: '#/definitions/ApprovalRequestedData',
        },
        approvalResolved: {
            $ref: '#/definitions/ApprovalResolvedData',
        },
        challenge: {
            $ref: '#/definitions/ConnectChallengeData',
        },
        changed: {
            $ref: '#/definitions/ChangedData',
        },
        error: {
            $ref: '#/definitions/WireError',
        },
        historyRecord: {
            $ref: '#/definitions/SessionHistoryRecord',
        },
        methods: {
            $ref: '#/definitions/GatewayMethods',
        },
        native: {
            $ref: '#/definitions/NcapDelta',
        },
        reverseBrowser: {
            $ref: '#/definitions/ReverseBrowserPage',
        },
        reverseBrowserModules: {
            $ref: '#/definitions/BrowserModulePage',
        },
        reverseBrowserScreenshot: {
            $ref: '#/definitions/BrowserScreenshotPage',
        },
        reverseBrowserSources: {
            $ref: '#/definitions/BrowserSourcesPage',
        },
        reverseBrowserStorage: {
            $ref: '#/definitions/BrowserStoragePage',
        },
        reverseBrowserStorageComparison: {
            $ref: '#/definitions/BrowserStorageComparisonPage',
        },
        reverseBrowserStructure: {
            $ref: '#/definitions/BrowserStructurePage',
        },
        reverseBrowserWebMcp: {
            $ref: '#/definitions/BrowserWebMcpPage',
        },
        reverseCatalog: {
            $ref: '#/definitions/ReverseCatalogPage',
        },
        reverseEvidence: {
            $ref: '#/definitions/ReverseEvidencePage',
        },
        reverseFunctions: {
            $ref: '#/definitions/ReverseFunctionsPage',
        },
        reverseGraph: {
            $ref: '#/definitions/ReverseGraphPage',
        },
        reverseInspection: {
            $ref: '#/definitions/ReverseInspectResult',
        },
        reverseNetworkDetail: {
            $ref: '#/definitions/ReverseNetworkDetailPage',
        },
        reverseNetworkDirectory: {
            $ref: '#/definitions/ReverseNetworkDirectoryPage',
        },
        reverseSnapshot: {
            $ref: '#/definitions/ReverseRunSnapshot',
        },
        sessionHistory: {
            $ref: '#/definitions/SessionHistoryData',
        },
        sessionMessage: {
            $ref: '#/definitions/SessionMessageData',
        },
        toolSites: {
            $ref: '#/definitions/ToolSitesData',
        },
        turnEnd: {
            $ref: '#/definitions/TurnEndData',
        },
        turnEvent: {
            $ref: '#/definitions/TurnEventData',
        },
        voice: {
            $ref: '#/definitions/VoiceCallEvent',
        },
    },
    required: [
        'approvalRequested',
        'approvalResolved',
        'challenge',
        'changed',
        'error',
        'historyRecord',
        'methods',
        'native',
        'reverseBrowser',
        'reverseBrowserModules',
        'reverseBrowserScreenshot',
        'reverseBrowserSources',
        'reverseBrowserStorage',
        'reverseBrowserStorageComparison',
        'reverseBrowserStructure',
        'reverseBrowserWebMcp',
        'reverseCatalog',
        'reverseEvidence',
        'reverseFunctions',
        'reverseGraph',
        'reverseInspection',
        'reverseNetworkDetail',
        'reverseNetworkDirectory',
        'reverseSnapshot',
        'sessionHistory',
        'sessionMessage',
        'toolSites',
        'turnEnd',
        'turnEvent',
        'voice',
    ],
    type: 'object',
};
