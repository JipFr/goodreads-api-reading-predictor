export interface AmazonChallenge {
	challenge: {
		/** Reason authentication was denied */
		challenge_reason: string;
		/** URL to challenge; which is always broken */
		uri: string;
		required_authentication_method: string;
	};
}

export interface Tokens {
	access_token: string;
	refresh_token: string;
	expires_in: string;
}

export interface AmazonSuccess {
	success: {
		extensions: {
			device_info: {
				device_name: string;
				device_serial_number: string;
				device_type: string;
			};
			customer_info: {
				/** Account type, someting like 'GoodReadsAccountPool' */
				account_pool: string;
				preferred_marketplace: string;
				/** 2-letter country code */
				country_of_recidence: string;
				/** Amazon customer id */
				user_id: string;
				home_region: string;
				name: string;
				given_name: string;
				source_of_country_of_residence: "IP_ADDRESS" | string;
			};
		};
		tokens: {
			mac_dms: {
				device_private_key: string;
				adp_token: string;
			};
			bearer: Tokens;
		};
		/** Amazon customer id */
		customerid: string;
	};
}

export type AmazonResponse = AmazonChallenge | AmazonSuccess;

export interface Shelf {
	id: number;
	name: string;
	book_count: number;
	exclusive_flag: boolean;
	image_url: string;
}

export interface GoodReadsUser {
	id: number;
	uri: string;
	name: string;
	age: string;
	gender: string;
	location: string;
	postal_code: string;
	country_code: string;
	link: string;
	small_image_url: string;
	image_url: string;
	friends_count: "0";
	friend_invite_url: string;
}

export interface GoodReadsUserRes {
	user: GoodReadsUser;
	user_shelves: {
		user_shelf: Shelf[];
	};
}
