// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    ComponentCategory,
    ComponentEffect,
    ComponentRole,
    PortDirection,
    type ComponentDefinition,
} from './ComponentTypes.js';
import { ComponentFactory as Ports } from './ComponentFactory.js';
import { CoreComponents } from './CoreComponents.js';
import { Schemas } from './Schemas.js';
import { WorkflowHttpMethod, WorkflowHttpFormat } from './HttpInputs.js';

/** HTTP requests execute in the workspace through authenticated proxy sessions. */
export class HttpComponents {
    /** The same typed inputs and outputs are used by the editor and runtime. */
    public static definition(): ComponentDefinition {
        return {
            id: 'http.request',
            version: '1',
            role: ComponentRole.Step,
            category: ComponentCategory.Api,
            display: CoreComponents.display(
                'HTTP Request',
                'Call an API through workspace proxies and use its response as data.',
                'Fetch JSON, pick a field and pass it to a model.',
                ['api', 'http', 'request', 'fetch', 'proxy', 'data', 'input'],
                'http',
                ['method', 'url', 'headers', 'body', 'responseFormat'],
            ),
            configuration: Schemas.object([
                Schemas.field('method', Schemas.choice(Object.values(WorkflowHttpMethod))),
                Schemas.field('url', { ...Schemas.text, maxLength: 8192 }, false),
                Schemas.field('headers', Schemas.object([], true), false),
                Schemas.field('body', Schemas.json, false),
                Schemas.field('responseFormat', Schemas.choice(Object.values(WorkflowHttpFormat))),
                Schemas.field('timeoutMs', { ...Schemas.count, minimum: 1000, maximum: 60000 }),
                Schemas.field('maxResponseBytes', {
                    ...Schemas.count,
                    minimum: 1024,
                    maximum: 1048576,
                }),
                Schemas.field('followRedirects', Schemas.boolean),
                Schemas.field('mockResponse', Schemas.json),
                Schemas.field('mockStatus', {
                    ...Schemas.number,
                    whole: true,
                    minimum: 100,
                    maximum: 599,
                }),
            ]),
            defaults: {
                method: 'GET',
                responseFormat: 'auto',
                timeoutMs: '30000',
                maxResponseBytes: '262144',
                followRedirects: true,
                mockResponse: {},
                mockStatus: 200,
            },
            ports: [
                Ports.flow('in', PortDirection.Input),
                Ports.input('url', 'URL', Schemas.text, true, 'url'),
                Ports.input('headers', 'Headers', Schemas.object([], true), false, 'headers'),
                Ports.input('body', 'Request body', Schemas.json, false, 'body'),
                Ports.flow('success', PortDirection.Output, 'Success'),
                Ports.flow('error', PortDirection.Output, 'HTTP error'),
                Ports.output('response', 'Response body', Schemas.json),
                Ports.output('status', 'Status code', Schemas.number),
                Ports.output('responseHeaders', 'Response headers', Schemas.object([], true)),
            ],
            resources: [],
            resourceRole: null,
            migratesFrom: [],
            execution: Ports.execution(ComponentEffect.External, ['http.proxy']),
        };
    }
}
