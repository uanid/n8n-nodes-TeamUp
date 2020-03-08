import {
    IExecuteFunctions,
    IHookFunctions,
} from 'n8n-core';

declare global {
    var accessToken: string;
}

export function isAccessTokenExpired(this: IExecuteFunctions): boolean {
    const staticData = this.getWorkflowStaticData('global');
    let accessToken = staticData.teamUpAccessToken;
    let expiresSeconds = staticData.teamUpAccessTokenExpiresSeconds;
    let currentSeconds = Math.floor(new Date().getTime() / 1000);

    // console.log("accessToken: " + accessToken);
    // console.log("expiresSeconds: " + expiresSeconds);

    if (accessToken === undefined || expiresSeconds === undefined) {
        return true;
    }

    if (expiresSeconds as number < currentSeconds) {
        return true;
    }

    return false;
}

export async function getAccessToken(this: IExecuteFunctions): Promise<string> {
    if (isAccessTokenExpired.call(this)) {
        console.log("AccessToken is Expired, create new token");

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
            // console.log(staticData);
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
        // console.log("Token is Not Expired");
        const staticData = this.getWorkflowStaticData('global');
        return staticData.teamUpAccessToken as string;
    }
}

export async function teamUpRequest(this: IExecuteFunctions, method: string, endpointUri: string, body?: object, query?: object): Promise<any> {
    let accessToken = await getAccessToken.call(this);
    let options = {
        method: method,
        headers: {
            'Authorization': 'bearer ' + accessToken
        },
        uri: endpointUri,
        body: body,
        qs: query,
        json: true
    }
    const responseBody = await this.helpers.request!(options);
    return responseBody;
}

export async function searchTeamUpUser(this: IExecuteFunctions, query: string): Promise<any> {
    const qs = {
        query: query
    };
    return await teamUpRequest.call(this, 'GET', 'https://auth.tmup.com/v1/search/1', {}, qs);
}

export async function sendTeamUpNote(this: IExecuteFunctions, userName: string, userIndex: number, title: string, content: string): Promise<any> {
    const body = {
        to: [
            {
                name: userName,
                user: userIndex,
            }
        ],
        title: title,
        content: content,
        files: []
    }
    let response = await teamUpRequest.call(this, 'POST', 'https://edge.tmup.com/v3/note/1/1', body);
    return response;
}

export async function sendTeamUpChat(this: IExecuteFunctions, roomIndex: number, content: string): Promise<any> {
    const body = {
        content: content, 
    }

    let uri = 'https://edge.tmup.com/v3/message/' + roomIndex;
    let response = await teamUpRequest.call(this, 'POST', uri, body);
    return response;
}

export async function sendTeamUpFeed(this: IExecuteFunctions, feedGroupIndex: number, content: string, push: boolean): Promise<any> {
    const body = {
        content: content, 
        push: push ? 1 : 0,
    }

    let uri = 'https://edge.tmup.com/v3/feed/' + feedGroupIndex;
    let response = await teamUpRequest.call(this, 'POST', uri, body);
    return response;
}