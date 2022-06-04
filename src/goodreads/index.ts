import fetch from "node-fetch";

import { parseString } from "xml2js";

import { getAmazonAuthCookies } from "./amazonAuth";
import { GoodReadsUserRes, Tokens } from "./types";

export default class GoodReads {
	tokens?: Tokens;
	user?: GoodReadsUserRes;
	endpoints: {
		current_user_shelves: string;
		current_user_data: string;
	};

	constructor() {
		this.endpoints = {
			current_user_shelves: "api/current_user_shelves?_nc=true&format=xml",
			current_user_data:
				"api/current_user_data?_nc=true&format=xml&id=151009784&include_social_shelving_info=true&user_shelves=true&v=2",
		};
	}

	async login(username: string, password: string): Promise<Tokens> {
		this.tokens = await getAmazonAuthCookies(username, password);
		await this.updateUser();
		return this.tokens;
	}

	async get(url: string) {
		if (this.tokens?.access_token) {
			const req = await fetch(`https://www.goodreads.com/${url}`, {
				headers: {
					Accept: "*/*",
					X_apple_app_version: "800",
					X_apple_device_model: "iPhone",
					X_apple_system_version: "15.6",
					"X-Amz-Access-Token": this.tokens.access_token,
				},
			});
			const body = await req.text();
			return (await body.startsWith("<"))
				? (await convertXml(body)).GoodreadsResponse
				: body;
		}
		throw new Error("NO_ACCESS_TOKEN");
	}

	async updateUser() {
		const currentUserData = await this.get(this.endpoints.current_user_data);
		const currentUser = currentUserData?.current_user;
		if (!currentUser) throw new Error("USER_FETCHING_FAILED");
		this.user = currentUser;
	}

	async getShelf(
		userId = this.user?.user.id,
		shelfName: string,
		page = 0,
		perPage = 10
	) {
		const url = `review/list/${userId}?_nc=true&format=xml&order=d&page=${page}&per_page=${perPage}&shelf=${shelfName}&show_user_statuses=true&sort=position&v=2`;
		const res = await this.get(url);
		return res;
	}
}

export async function convertXml(xml: string): Promise<any> {
	const parsed: any = await new Promise((resolve, reject) => {
		return parseString(xml, { explicitArray: false }, (err, result) => {
			if (err) reject(err);
			resolve(result);
		});
	});

	const converted = convertResJson(parsed);

	return converted;
}

function convertResJson(data: { [key: string]: any }): any {
	// Recursion to replace `id: { _: '493157462', '$': { type: 'integer' } },` with `id: 490748788`
	for (const key of Object.keys(data)) {
		if (data[key]?._ && data[key]?.$?.type) {
			const value = data[key]?._;
			const type = data[key]?.$?.type;

			if (type === "integer") {
				data[key] = Number(value);
			} else if (type === "boolean") {
				data[key] = value === "true";
			} else if (type === "datetime") {
				data[key] = new Date(value);
			}
		} else if (typeof data[key] === "object") {
			data[key] = convertResJson(data[key]);
		} else if (data[key] !== "" && data[key] == Number(data[key])) {
			data[key] = Number(data[key]);
		}
	}

	return data;
}
