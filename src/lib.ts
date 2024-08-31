import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import * as cheerio from 'cheerio';
import OpenAI from "openai";
import dotenv from 'dotenv'
import puppeteer from "puppeteer";
import { promisify } from "util";
import { exec } from "child_process";

dotenv.config()

export async function getPuppeteerBrowser() {

  if (process.env.ENVIORNMENT != "development") {
    // For replit deployment. see https://replit.com/@AllailQadrillah/Running-Puppeteer-in-Replit#index.js
    const { stdout: chromiumPath_ } = await promisify(exec)("which chromium")
    const { stdout: chromiumPath } = await promisify(exec)("which chromium")
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: chromiumPath.trim()
    });
  }

  return await puppeteer.launch()
}

export async function scrapeURL(url: string): Promise<string> {

  const browser = await getPuppeteerBrowser()
  const page = await browser.newPage();

  try {
    // waitUntil options:
    // "networkidle0": Navigation done when 0 network connections for 500ms. Strictest, slowest.
    // "networkidle2": Navigation done when ≤2 network connections for 500ms. Good balance.
    // "domcontentloaded": Navigation done on DOMContentLoaded event. Fast, may miss dynamic content.
    // "load": Navigation done on load event. May miss some async content.
    await page.goto(url, { waitUntil: "networkidle2" });
    
    // You might need to adjust the selector based on the specific page structure
    await page.waitForSelector("body", { timeout: 1000 });

    // Get the HTML content
    const content = await page.content();

    await browser.close();
    return content;
  } catch (error) {
    console.error("An error occurred:", error);
    await browser.close();
    throw error;
  }
}

export const Track = z.object({
  name: z.string(),
  streams: z.number(),
});

export const ArtistExtraction = z.object({
  artist_name: z.string(),
  monthly_listeners: z.number(),
  top_tracks: z.array(Track),
  artist_image_url: z.string(),
});

export async function parseHTML(html: string): Promise<string> {
    const $ = cheerio.load(html);
  
    // Find the main content container
    const mainContent = $('.main-view-container__scroll-node-child').html();
  
    if (!mainContent) {
      throw new Error("Couldn't find main content");
    }

    return mainContent
  }

export async function aiParseHTML(html: string): Promise<z.infer<typeof ArtistExtraction>> {

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  // api call
  try {
    const completion = await openai.beta.chat.completions.parse({
        model: "gpt-4o-2024-08-06",
        // model: "gpt-4o-mini",
        messages: [
        {
            role: "system",
            content:
            "You are an expert at structured data extraction. You will be given unstructured HTML content about a music artist and should convert it into the given structure.",
        },
        { role: "user", content: html },
        ],
        response_format: zodResponseFormat(ArtistExtraction, "artist_extraction"),
    });
    if (completion.choices[0].message.parsed) {
        return completion.choices[0].message.parsed;
    } else {
        console.log("no parsed data found")
        throw new Error(`No parsed data returned from OpenAI. RAW RESPONSE: ${completion}`);
    };
  } catch (error) {
    console.error("An error occurred:", error);
    throw error;
  }
}

export const getCurrentTimeString = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour12: false });
  };
  
  export class Timer {
    private startTime: number;
  
    constructor() {
      this.startTime = performance.now();
    }
  
    get responseTime(): string {
      return `${Number((performance.now() - this.startTime).toFixed(0))} ms`
    }
  }
  