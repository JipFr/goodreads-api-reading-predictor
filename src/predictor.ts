import * as chalk from "chalk";
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
import { config } from "dotenv";
config();

dayjs.extend(relativeTime);

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

		const readingShelf = await gr.getShelf(
			gr?.user?.user.id,
			"currently-reading"
		);
		let booksOnShelf = readingShelf.reviews.review;
		if (!Array.isArray(booksOnShelf)) booksOnShelf = [booksOnShelf];

		console.log(JSON.stringify(booksOnShelf, null, "  "));

		console.log("┌" + "─".repeat(38) + "┐", "\n");

		for (let i = 0; i < booksOnShelf.length; i++) {
			const book = booksOnShelf[i];
			const updates = book.user_statuses.user_status;

			// Log title
			console.info(chalk.bold(book.book.title));

			// Get predicted time until end of book
			const timeUntilEndTotalInDays = Math.round(
				getRemainingReadingTime(updates, updates.length) / (1e3 * 60 * 60 * 24)
			);

			const timeUntilEndTotalInDaysBasedOnRecents = Math.round(
				getRemainingReadingTime(updates, 5) / (1e3 * 60 * 60 * 24)
			);

			console.info(
				`\nBased on your last ${chalk.bold(
					updates.length
				)} updates, it will take you about ${chalk.bold(
					timeUntilEndTotalInDays
				)} more days to finish this book.`
			);

			if (timeUntilEndTotalInDaysBasedOnRecents !== timeUntilEndTotalInDays) {
				console.info(
					`If we only look at your last ${chalk.bold(
						5
					)} updates, it will take you about ${chalk.bold(
						timeUntilEndTotalInDaysBasedOnRecents
					)} days`
				);
			}

			// Log each update
			for (const update of updates.slice(0, 5)) {
				// Create progress bar
				const block = "█";
				const totalBlockCount = 35;
				const updatePercentage = update.percent;
				const completedBlocks = Math.round(
					(updatePercentage / 100) * totalBlockCount
				);
				const bar =
					chalk.green(block.repeat(completedBlocks)) +
					chalk.bgBlack(block.repeat(totalBlockCount - completedBlocks));

				// Create "x time ago"
				const daysDiffFormatted = dayjs().to(update.updated_at);

				// Log all the things
				console.log("\n");
				console.log(bar, updatePercentage + "%");
				console.log(` ${daysDiffFormatted}`.padStart(totalBlockCount, "─"));
			}

			if (booksOnShelf[i + 1]) {
				console.log("\n├" + "─".repeat(38) + "┤", "\n");
			}
		}
		console.log("\n└" + "─".repeat(38) + "┘", "\n");
	}
})();

function getRemainingReadingTime(updates: any[], count = updates.length) {
	const relevantUpdates = updates.slice(0, count);
	const latestUpdate = relevantUpdates[0];
	const earliestUpdate = relevantUpdates[relevantUpdates.length - 1];

	const diff =
		new Date().getTime() - new Date(earliestUpdate.updated_at).getTime();

	const diffInPercentages = latestUpdate.percent - earliestUpdate.percent;

	const remaining = 100 - latestUpdate.percent;

	// Calculate how long it'll take to finish the book
	const timeUntilEnd = diff * (remaining / diffInPercentages);

	return timeUntilEnd;
}
