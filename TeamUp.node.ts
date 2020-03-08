import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { Request } from 'request';
import {
	sendTeamUpChat,
	sendTeamUpNote,
	sendTeamUpFeed,
	searchTeamUpUser,
} from './TeamUpFunctions';


export class TeamUp implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TeamUP',
		name: 'teamup',
		icon: 'file:teamup.png',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["apiType"] + "/" + $parameter["targetId"]}}',
		description: '팀업 API를 사용해 알림을 보내기',
		defaults: {
			name: 'TeamUP',
			color: '#00A2FF',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'teamUpApi',
				required: true
			}
		],
		properties: [
			{
				displayName: 'API',
				name: 'apiType',
				type: 'options',
				options: [
					{
						name: '채팅 보내기',
						value: 'chat'
					},
					{
						name: '피드 작성하기',
						value: 'feed'
					},
					{
						name: '쪽지 보내기',
						value: 'note'
					}
				],
				default: 'chat',
				description: '요청할 API 행위'
			},
			{
				displayName: '대상',
				name: 'targetId',
				type: 'string',
				default: '',
				required: true,
				placeholder: '대상 ID',
				description: '방번호, 그룹피드번호, 사용자이메일'
			},
			{
				displayName: '제목',
				displayOptions: {
					show: {
						apiType: [
							'note'
						]
					}
				},
				name: 'title',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'title',
			},
			{
				displayName: '내용',
				name: 'content',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'content',
			},
			{
				displayName: '강제알림',
				displayOptions: {
					show: {
						apiType: [
							'feed'
						]
					}
				},
				name: 'push',
				type: 'boolean',
				default: false,
				required: true,
			}
		]
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		console.log("execute Called");

		const TEAMUP_EDGE_URL = 'https://edge.tmup.com';

		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		const apiType: string = this.getNodeParameter('apiType', 0) as string;
		const targetId: string = this.getNodeParameter('targetId', 0) as string;
		const title: string = this.getNodeParameter('title', 0, '') as string;
		const content: string = this.getNodeParameter('content', 0) as string;
		const isPush: boolean = this.getNodeParameter('push', 0, false) as boolean;

		if (apiType == 'chat') {
			if (Number(targetId) === NaN) {
				throw new Error('채팅방 ID는 정수만 입력 가능합니다.');
			}

			try {
				let response = await sendTeamUpChat.call(this, Number.parseInt(targetId), content);
				return [this.helpers.returnJsonArray({ response })];
			} catch (error) {
				let response = {
					status: 'failed',
					reason: error.statusCode,
					developerMessage: error.statusCode == 403 ? '채팅방 번호가 잘못되었을 가능성이 있습니다.' : '알 수 없는 실패',
				};
				return [this.helpers.returnJsonArray({ response })]
			}
		} else if (apiType == 'feed') {
			if (Number(targetId) === NaN) {
				throw new Error('피드 그룹 ID는 정수만 입력 가능합니다.');
			}

			try {
				let response = await sendTeamUpFeed.call(this, Number.parseInt(targetId), content, isPush);
				return [this.helpers.returnJsonArray({ response })];
			} catch (error) {
				let response = {
					status: 'failed',
					reason: error.statusCode,
					developerMessage: error.statusCode == 403 ? '피드 그룹 번호가 잘못되었을 가능성이 있습니다.' : '알 수 없는 실패',
				};
				return [this.helpers.returnJsonArray({ response })]
			}
		} else if (apiType == 'note') {
			let searchInfo = await searchTeamUpUser.call(this, "musong@estsecurity.com");
			if (searchInfo.users === undefined || searchInfo.users === null) {
				let response = {
					status: 'failed',
					reason: 0,
					developerMessage: '사용자를 찾을 수 없습니다.',
				};
				return [this.helpers.returnJsonArray({ response })]
			}

			try {
				let user = searchInfo.users[0];
				let response = await sendTeamUpNote.call(this, user.name, user.index, title, content);
				return [this.helpers.returnJsonArray({ response })];
			} catch (error) {
				let response = {
					status: 'failed',
					reason: error.statusCode,
					developerMessage: '알 수 없는 실패',
				};
				return [this.helpers.returnJsonArray({ response })]
			}
		} else {
			let response = {
				status: 'failed',
				reason: 0,
				developerMessage: '해석할 수 없는 API 타입입니다.',
			};
			return [this.helpers.returnJsonArray({ response })]
		}
	}
}
