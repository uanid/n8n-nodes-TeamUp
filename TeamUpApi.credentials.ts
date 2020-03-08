import {
	ICredentialType,
	NodePropertyTypes,
} from 'n8n-workflow';


export class TeamUpApi implements ICredentialType {
	name = 'teamUpApi';
	displayName = 'TeamUp-API';
	properties = [
		{
			displayName: 'OAuth Client Id',
			name: 'oAuthClientId',
			type: 'string' as NodePropertyTypes,
			default: '',
		},
		{
			displayName: 'OAuth Client Secret',
			name: 'oAuthClientSecret',
			type: 'string' as NodePropertyTypes,
			default: '',
			typeOptions: {
				password: true,
			},
		},
		{
			displayName: 'Bot Username',
			name: 'botUsername',
			type: 'string' as NodePropertyTypes,
			default: '',
		},
		{
			displayName: 'Bot Password',
			name: 'botPassword',
			type: 'string' as NodePropertyTypes,
			default: '',
			typeOptions: {
				password: true,
			},
		},
	];
}