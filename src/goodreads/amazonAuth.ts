import fetch from "node-fetch";
import { generateFrcCookies } from "./generateFrcCookies";
import { AmazonResponse, AmazonSuccess, Tokens } from "./types";

export async function getAmazonAuthCookies(
	username: string,
	password: string
): Promise<Tokens> {
	const deviceId = "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD";

	const req = await fetch("https://api.amazon.com/auth/register", {
		body: JSON.stringify({
			requested_extensions: ["device_info", "customer_info"],
			cookies: {
				website_cookies: [],
				domain: ".goodreads.com",
			},
			registration_data: {
				domain: "Device",
				app_version: "4.1",
				device_type: "A3NWHXTQ4EBCZS",
				os_version: "15.6",
				device_model: "iPhone",
				device_serial: deviceId,
				app_name: "GoodreadsForIOS App",
			},
			auth_data: {
				user_id_password: {
					user_id: username,
					password,
				},
			},
			user_context_map: {
				frc: await generateFrcCookies(deviceId, "en"),
			},
			requested_token_type: ["bearer", "mac_dms", "website_cookies"],
		}),
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			"X-Amzn-Identity-Auth-Domain": "goodreads.com",
		},
		method: "POST",
	});

	const res: {
		response: AmazonResponse;
	} = await req.json();

	if (didSucceed(res.response)) {
		return res.response.success.tokens.bearer;
	} else {
		throw new Error(res.response.challenge.challenge_reason);
	}
}

function didSucceed(res: AmazonResponse): res is AmazonSuccess {
	return typeof (res as AmazonSuccess).success !== "undefined";
}
