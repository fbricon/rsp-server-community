/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the EPL v2.0 License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { RSP_PROVIDER_NAME } from './constants';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as server from './server';
import { Uri } from 'vscode';
import { RSPController, ServerInfo, ServerState } from 'vscode-server-connector-api';

export class ExtensionAPI implements RSPController {

    private host: string;
    private port: number;
    private emitter: EventEmitter;

    public constructor() {
        this.host = '';
        this.port = 0;
        this.emitter = new EventEmitter();
    }

    public async startRSP(stdoutCallback: (data: string) => void, stderrCallback: (data: string) => void): Promise<ServerInfo>  {
        this.updateRSPStateChanged(ServerState.STARTING);
        return await server.start(stdoutCallback, stderrCallback, this).then(serverInfo => {
            this.host = serverInfo.host;
            this.port = serverInfo.port;
            this.updateRSPStateChanged(ServerState.STARTED);
            return serverInfo;
        }).catch(error => {
            this.updateRSPStateChanged(ServerState.STOPPED);
            const innerMsg: string = error ? (error.message ? error.message : JSON.stringify(error)) : '';
            return Promise.reject(`RSP Error - ${RSP_PROVIDER_NAME} failed to start - ${innerMsg}`);
        });
    }

    public async stopRSP(): Promise<void> {
        server.terminate().catch(error => {
            const innerMsg: string = error ? (error.message ? error.message : JSON.stringify(error)) : '';
            return Promise.reject(`RSP Error - ${RSP_PROVIDER_NAME} failed to stop - ${innerMsg}`);
        });
    }

    public getImage(serverType: string): Uri {
        if (!serverType) {
            return null;
        }

        return Uri.file(path.join(__dirname, '..', '..', 'images', this.getFilename(serverType)));
    }

    private getFilename(serverType: string): string {
        if(serverType.toLowerCase().indexOf('karaf') != -1) {
            return 'karaf.png';
        }
        if(serverType.toLowerCase().indexOf('tomcat') != -1) {
            return 'tomcat.svg';
        }
        if(serverType.toLowerCase().indexOf('felix') != -1) {
            return 'felix.png';
        }
        if(serverType.toLowerCase().indexOf('jetty') != -1) {
            return 'jetty.png';
        }
        if(serverType.toLowerCase().indexOf('glassfish') != -1) {
            return 'glassfish.png';
        }
        if(serverType.toLowerCase().indexOf('payara') != -1) {
            return 'payara.png';
        }
        if(serverType.toLowerCase().indexOf('liberty') != -1) {
            return 'websphere.png';
        }

        return 'community.png';
    }

    public onRSPServerStateChanged(listener: (state: number) => void): void {
        this.emitter.on('rspServerStateChanged', listener);
    }

    public async updateRSPStateChanged(state: number): Promise<void> {
        this.emitter.emit('rspServerStateChanged', state);
    }

    public getHost(): string {
        return this.host;
    }

    public getPort(): number {
        return this.port;
    }
}
