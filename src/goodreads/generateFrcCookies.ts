// Coming back to this 7 months later, I was confused where a lot of this must've code from
// I did some searching online and I think it must be https://github.com/athrowaway2021/amazon_auth/blob/c39339ed4711c1ee51346ba285fb9b76c7f98b9e/amazon_auth.py,
// It seems likely considering they're doing the exact same thing.
// I don't remember converting this at all, but oh well; who cares. It's there.

import * as crypto from "crypto";
import * as os from "os";
import { gzip } from "zlib";

const APP_NAME = "GoodreadsForIOS App";
const APP_VERSION = "4.1";

function getIpAddress() {
	const ifaces = os.networkInterfaces();
	for (const ifaceName of Object.keys(ifaces)) {
		const list = ifaces[ifaceName];
		if (!list) continue;

		for (const iface of list) {
			if (!iface.internal && iface.family === "IPv4") {
				return iface.address;
			}
		}
	}
}

function createSaltedKey(key: string, salt: crypto.BinaryLike) {
	return crypto.pbkdf2Sync(
		key,
		salt,
		1000, // iterations
		16, // key length (in bytes, vs Java's bits)
		"SHA1" // hash
	);
}

export async function generateFrcCookies(deviceId: string, language: string) {
	const cookies = JSON.stringify({
		ApplicationName: APP_NAME,
		ApplicationVersion: APP_VERSION,
		DeviceLanguage: language,
		DeviceName: "walleye/google/Pixel 2",
		DeviceOSVersion:
			"google/walleye/walleye:8.1.0/OPM1.171019.021/4565141:user/release-keys",
		IpAddress: getIpAddress(),
		ScreenHeightPixels: "1920",
		ScreenWidthPixels: "1280",
		TimeZone: "-04:00",
	});

	// gzip
	const zipped: Buffer = await new Promise((resolve, reject) => {
		gzip(cookies, {}, (e, result) => {
			if (e) reject(e);
			else resolve(result);
		});
	});

	// encrypt the cookies JSON
	// don't ask about the salts used for the keys; I don't make the rules ;)
	const key = createSaltedKey(deviceId, "AES/CBC/PKCS7Padding");
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
	const cipheredBase = cipher.update(zipped);
	const ciphered = Buffer.concat([cipheredBase, cipher.final()]);

	// create an hmac digest containing the IV and the ciphered data
	const hmac = crypto.createHmac(
		"sha256",
		createSaltedKey(deviceId, "HmacSHA256")
	);
	hmac.update(iv);
	hmac.update(ciphered);
	const hmacd = hmac.digest();

	// build the cookies buffer
	const toBase64Encode = Buffer.concat([
		Buffer.of(0),
		hmacd.slice(0, 8),
		iv,
		ciphered,
	]);

	return toBase64Encode.toString("base64");
}
