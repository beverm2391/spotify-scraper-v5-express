import express, { Request, Response } from "express";
import { Timer, scrapeURL, parseHTML, aiParseHTML } from "./lib.js";

const app = express();
const port = 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World. The app is, in fact, running. Freaking sick!");
});

app.get("/artist/:artist_id", async (req: Request, res: Response) => {
  const timer = new Timer();

  const artist_id = req.params.artist_id;
  if (!artist_id) {
    return res.status(400).json({ error: "Artist ID parameter is required" });
  }

  const url = `https://open.spotify.com/artist/${artist_id}`;

  try {
    const timer1 = new Timer();
    const rawHTML = await scrapeURL(url);
    console.log("Scraped in ", timer1.responseTime);

    const timer2 = new Timer();
    const parsedHTML = await parseHTML(rawHTML);
    console.log("Parsed in ", timer2.responseTime);

    const timer3 = new Timer();
    const aiParsedHTML = await aiParseHTML(parsedHTML);
    console.log("AI parsed in ", timer3.responseTime);

    res.json({ response_time: timer.responseTime, result: aiParsedHTML });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({
      error: "An error occurred while processing the request",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
