import { Config } from '@alicloud/openapi-client';
import Oss, { PutObjectHeaders, PutObjectRequest } from '@alicloud/oss20190517';
import { RuntimeOptions } from '@alicloud/tea-util';
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';
import { Readable } from 'stream';

export class AliyunOss implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Aliyun OSS',
		name: 'aliyunOss',
		icon: 'file:aliyun-oss.svg',
		group: ['cloud'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Upload files to Alibaba Cloud Object Storage Service',
		defaults: {
			name: 'Aliyun OSS',
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
						name: 'Put Object',
						value: 'putObject',
						description: 'Upload a file to OSS from binary data',
						action: 'Upload a file to OSS',
					},
				],
				default: 'putObject',
				required: true,
			},
			{
				displayName: 'Bucket Name',
				name: 'bucketName',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'my-bucket',
				description: 'Name of the OSS bucket',
			},
			{
				displayName: 'Region',
				name: 'region',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'cn-hangzhou',
				description: 'OSS region ID, e.g. cn-hangzhou',
			},
			{
				displayName: 'Object Key',
				name: 'objectKey',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'path/to/file.jpg',
				description: 'Object key (path and filename) in the bucket',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property from the previous node',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('aliyunApi');

		try {
			if (operation === 'putObject') {
				const bucketName = this.getNodeParameter('bucketName', 0) as string;
				const region = this.getNodeParameter('region', 0) as string;
				const objectKey = this.getNodeParameter('objectKey', 0) as string;
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0) as string;

				const config = new Config({
					accessKeyId: credentials.accessKeyId as string,
					accessKeySecret: credentials.accessKeySecret as string,
					endpoint: `oss-${region}.aliyuncs.com`,
				});

				const client = new Oss(config);
				const runtime = new RuntimeOptions({});

				const binaryData = await this.helpers.getBinaryDataBuffer(0, binaryPropertyName);
				const binaryMetadata = this.helpers.assertBinaryData(0, binaryPropertyName);

				const body = Readable.from(binaryData);
				const request = new PutObjectRequest({ body });

				const headers = new PutObjectHeaders({
					commonHeaders: {
						'Content-Type': binaryMetadata.mimeType || 'application/octet-stream',
					},
				});

				const response = await client.putObjectWithOptions(
					bucketName,
					objectKey,
					request,
					headers,
					runtime,
				);

				returnData.push({
					json: {
						bucketName,
						objectKey,
						etag: response.headers?.etag ?? '',
						requestId: response.headers?.['x-oss-request-id'] ?? '',
						statusCode: response.statusCode,
					},
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
