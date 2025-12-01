import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';
import Cdn20180510, { RefreshObjectCachesRequest } from '@alicloud/cdn20180510';
import { Config } from '@alicloud/openapi-client';
import { RuntimeOptions } from '@alicloud/tea-util';

export class AliyunCdn implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Aliyun CDN',
		name: 'aliyunCdn',
		icon: 'file:aliyun.svg',
		group: ['cloud'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Manage Aliyun CDN cache operations',
		defaults: {
			name: 'Aliyun CDN',
		},
		inputs: [
			{
				type: NodeConnectionType.Main,
				required: true,
			},
		],
		outputs: [
			{
				type: NodeConnectionType.Main,
				required: true,
			},
		],
		credentials: [
			{
				name: 'aliyunApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Refresh Object Caches',
						value: 'refreshObjectCaches',
						description: 'Refresh or purge CDN cached objects by path',
						action: 'Refresh CDN object caches',
					},
				],
				default: 'refreshObjectCaches',
				required: true,
			},
			{
				displayName: 'Object Paths',
				name: 'objectPath',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				placeholder: 'https://example.com/path/file.jpg',
				description: 'Enter URLs or directories separated by line breaks (up to 1,000 entries)',
			},
			{
				displayName: 'Object Type',
				name: 'objectType',
				type: 'options',
				default: 'File',
				options: [
					{
						name: 'File',
						value: 'File',
					},
					{
						name: 'Directory',
						value: 'Directory',
					},
				],
				description: 'Choose whether to refresh single files or whole directories',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Force',
						name: 'force',
						type: 'boolean',
						default: false,
						description: 'Whether to force refresh even if the cache is not expired',
					},
					{
						displayName: 'Owner ID',
						name: 'ownerId',
						type: 'number',
						default: 0,
					},
					{
						displayName: 'Security Token',
						name: 'securityToken',
						type: 'string',
						typeOptions: {
							password: true,
						},
						default: '',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('aliyunApi');

		const config = new Config({
			accessKeyId: credentials.accessKeyId as string,
			accessKeySecret: credentials.accessKeySecret as string,
			endpoint: 'cdn.aliyuncs.com',
		});

		try {
			if (operation === 'refreshObjectCaches') {
				const objectPath = this.getNodeParameter('objectPath', 0) as string;
				const objectType = this.getNodeParameter('objectType', 0) as string;
				const additionalFields = this.getNodeParameter('additionalFields', 0, {}) as {
					force?: boolean;
					securityToken?: string;
					ownerId?: number;
				};

				const request = new RefreshObjectCachesRequest({
					objectPath,
					objectType,
				});

				if (additionalFields.force !== undefined) {
					request.force = additionalFields.force;
				}

				if (additionalFields.securityToken) {
					request.securityToken = additionalFields.securityToken;
				}

				if (additionalFields.ownerId !== undefined) {
					request.ownerId = additionalFields.ownerId;
				}

				const client = new Cdn20180510(config);
				const runtime = new RuntimeOptions({});
				const response = await client.refreshObjectCachesWithOptions(request, runtime);

				returnData.push({
					json: response.body ?? {},
				});
			}
		} catch (error) {
			if (error.message) {
				throw new NodeOperationError(this.getNode(), error.message);
			}
			throw error;
		}

		return [returnData];
	}
}
