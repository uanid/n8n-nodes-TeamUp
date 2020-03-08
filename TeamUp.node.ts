import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { Request } from 'request';
import {
	getAccessToken,
	teamUpRequest,
} from './GenericFunctions';


export class TeamUp implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TeamUP',
		name: 'teamup',
		icon: 'file:teamup.png',
		group: ['output'],
		version: 1,
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
							'feed', 'note'
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
			}
		]
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		console.log("execute Called");
		let token = await getAccessToken.call(this);
		console.log("Token: " + token);

		const TEAMUP_EDGE_URL = 'https://edge.tmup.com';

		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		const apiType: string = this.getNodeParameter('apiType', 0) as string;
		const targetId: string = this.getNodeParameter('targetId', 0) as string;
		const title: string = this.getNodeParameter('title', 0, '') as string;
		const content: string = this.getNodeParameter('content', 0) as string;

		console.log(typeof items);
		console.log("api: " + apiType);

		if (apiType == 'chat') {

			const options = {
				method: 'POST',
				headers: {
					'Authorization': 'bearer 4de0d941feffaf199c2e045275cd099fd0d3ea8c9e46a459ef70de9a50a344fb'
				},
				body: {
					content: 'n8n test'
				},
				uri: TEAMUP_EDGE_URL + "/v3/message/773203",
				json: true
			}

			let request: Request = await this.helpers.request(options);
			console.log(request.response?.headers);
			console.log(request.body);
			return [this.helpers.returnJsonArray({ request })];
		} else if (apiType == 'feed') {

		} else if (apiType == 'note') {
			const body = {
				to: [
					{
						name: '송민욱',
						user: targetId
					}
				],
				title: title,
				content: content,
				files: []
			}
			let response = await teamUpRequest.call(this, 'POST', 'https://edge.tmup.com/v3/note/1/1', body);
			console.log("===Response===");
			console.log(response);
		}

		let item: INodeExecutionData;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			item = items[itemIndex];

			item.json['myString'] = "A";
		}
		return this.prepareOutputData(items);

	}
}
