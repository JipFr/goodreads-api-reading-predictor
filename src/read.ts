import fs from "fs";
import { config } from "dotenv";
config();

import GoodReads from "./goodreads";

(async () => {
	// Initiate client
	const gr = new GoodReads();

	// Log in
	if (!process.env.GR_USERNAME) throw new Error("GR_PROVIDE_USERNAME");
	if (!process.env.GR_PASSWORD) throw new Error("GR_PROVIDE_PASSWORD");

	await gr.login(process.env.GR_USERNAME, process.env.GR_PASSWORD);

	// Get current user data
	const currentUser = gr.user;
	if (currentUser) {
		console.log(currentUser);

		const readingShelf = await gr.getShelf(gr?.user?.user.id, "read");
		const allBooks = readingShelf.reviews;

		console.log(JSON.stringify(allBooks, null, "  "));
		console.log(allBooks.length);
		fs.writeFileSync(
			"./goodreads-read.json",
			JSON.stringify(allBooks, null, "  ")
		);
	}
})();
