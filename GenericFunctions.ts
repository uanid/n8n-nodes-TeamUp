import {
    IExecuteFunctions,
    IHookFunctions,
} from 'n8n-core';

import {
    IDataObject,
    ICredentialDataDecryptedObject,
} from 'n8n-workflow';

import { stringify } from 'querystring';
import { Request } from 'request';

declare global {
    var accessToken: string;
}

export function isAccessTokenExpired(this: IExecuteFunctions): boolean {
    const staticData = this.getWorkflowStaticData('global');
    let accessToken = staticData.teamUpAccessToken;
    let expiresSeconds = staticData.teamUpAccessTokenExpiresSeconds;
    let currentSeconds = Math.floor(new Date().getTime() / 1000);

    console.log("accessToken: " + accessToken);
    console.log("expiresSeconds: " + expiresSeconds);

    if (accessToken === undefined || expiresSeconds === undefined) {
        return true;
    }

    if (expiresSeconds as number < currentSeconds) {
        return true;
    }

    return false;
}

export async function getAccessToken(this: IExecuteFunctions): Promise<string> {
    console.log("getAccessToken called");

    if (isAccessTokenExpired.call(this)) {
        console.log("Token is Expired");

        const credentials = this.getCredentials('teamUpApi');
        if (credentials === undefined) {
            throw new Error('No credentials got returned!');
        }
        const clientId = credentials.oAuthClientId;
        const clientPw = credentials.oAuthClientSecret;
        const userId = credentials.botUsername;
        const userPw = credentials.botPassword;

        if (clientId === undefined
            || clientPw === undefined
            || userId === undefined
            || userPw === undefined) {
            throw new Error('Credential has not enough information!');
        }

        const options = {
            method: 'POST',
            uri: 'https://auth.tmup.com/oauth2/token',
            form: {
                grant_type: 'password',
                client_id: clientId,
                client_secret: clientPw,
                username: userId,
                password: userPw
            },
        }
        try {
            let response = await this.helpers.request!(options);
            let jsonResponse = JSON.parse(response);

            let staticData = this.getWorkflowStaticData('global');
            staticData.teamUpAccessToken = jsonResponse['access_token'];
            staticData.teamUpAccessTokenExpiresSeconds = Math.floor(new Date().getTime() / 1000) + jsonResponse['expires_in'];
            console.log(staticData);
            return staticData.teamUpAccessToken as string;
        } catch (error) {
            if (error.statusCode === 401) {
                // Return a clear error
                throw new Error('팀업 계정 또는 OAuth Client 계정 정보가 올바르지 않습니다.');
            }

            if (error.response && error.response.body && error.response.body.message) {
                // Try to return the error prettier
                throw new Error(`팀업 에러가 발생했습니다. [${error.statusCode}]: ${error.response.body.message}`);
            }

            // If that data does not exist for some reason return the actual error
            throw error;
        }
    } else {
        console.log("Token is Not Expired");
        const staticData = this.getWorkflowStaticData('global');
        return staticData.teamUpAccessToken as string;
    }
}

export async function teamUpRequest(this: IExecuteFunctions, method: string, endpointUri: string, body?: object, query?: object): Promise<string> {
    let accessToken = await getAccessToken.call(this);
    let options = {
        method: method,
        headers: {
            'Authorization': 'bearer 4de0d941feffaf199c2e045275cd099fd0d3ea8c9e46a459ef70de9a50a344fb'
        },
        uri: endpointUri,
        body: body,
        qs: query,
        json: true
    }
    const responseString = this.helpers.request!(options);
    return responseString;
}
