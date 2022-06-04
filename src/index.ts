import chalk from "chalk";
import { config } from "dotenv";
config();

import GoodReads from "./goodreads";

(async () => {
	const gr = new GoodReads();

	// Log in
	if (!process.env.GR_USERNAME) throw new Error("GR_PROVIDE_USERNAME");
	if (!process.env.GR_PASSWORD) throw new Error("GR_PROVIDE_PASSWORD");

	await gr.login(process.env.GR_USERNAME, process.env.GR_PASSWORD);

	// Get all shelves
	const shelves = gr.user?.user_shelves.user_shelf;
	if (!shelves) throw new Error("NO_SHELVES");
	if (!gr.user) throw new Error("NO_USER");

	async function getFullShelf(
		userId: number,
		shelfName: string,
		page = 1
	): Promise<any> {
		const shelfRes = await gr.getShelf(gr.user?.user.id, shelfName, page, 20);
		if (shelfRes.reviews.$.end !== shelfRes.reviews.$.total) {
			// If not at the end of the pagination, get MOAR BOOKS!
			shelfRes.reviews.review.push(
				...(await getFullShelf(userId, shelfName, page + 1)).reviews.review
			);
		}
		return shelfRes;
	}

	// Get all shelves in their entirety
	const fullShelves = await Promise.all(
		shelves.map(async (shelf) => {
			if (!gr.user) throw new Error("NO_USER");
			return await getFullShelf(gr.user?.user.id, shelf.name);
		})
	);

	for (const shelf of fullShelves) {
		const shelfName = shelf.shelf.$.name;
		let formattedShelfName = shelfName.replace(/-/g, " ");
		formattedShelfName =
			formattedShelfName.slice(0, 1).toUpperCase() +
			formattedShelfName.slice(1);
		console.log(chalk.bold(formattedShelfName));
		for (const book of shelf?.reviews?.review || []) {
			console.log(
				` - ${chalk.bold(
					book.book.title_without_series
				)} ${chalk.grey`- ${book.book.authors.author.name}`}`
			);
		}

		if (!shelf?.reviews?.review) {
			console.log(chalk.grey(" - No books in this shelf"));
		}

		console.log("\n");
	}
})();
