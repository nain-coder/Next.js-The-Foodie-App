import fs from "node:fs/promises";
import sql from "better-sqlite3";
import slugify from "slugify";
import xss from "xss";

const db = sql("meals.db");

export async function getMeals() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return db.prepare("SELECT * FROM meals").all();
}

export function getMeal(slug) {
  return db.prepare("SELECT * FROM meals WHERE slug = ?").get(slug);
}

export async function saveMeal(meal) {
  // 1. Sanitize text and generate slug
  meal.slug = slugify(meal.title, { lower: true });
  meal.instructions = xss(meal.instructions);

  // 2. Extract extension and build file path
  const extension = meal.image.name.split(".").pop();
  const fileName = `${meal.slug}.${extension}`;

  // 3. Convert image to Buffer and await filesystem write
  const bufferedImage = await meal.image.arrayBuffer();
  await fs.writeFile(`public/images/${fileName}`, Buffer.from(bufferedImage));

  // 4. Set web-accessible image path for Next.js
  meal.image = `/images/${fileName}`;

  // 5. Insert record into database
  db.prepare(
    `
    INSERT INTO meals
      (title, summary, instructions, creator, creator_email, image, slug)
    VALUES (
      @title,
      @summary,
      @instructions,
      @creator,
      @creator_email,
      @image,
      @slug
    )
  `,
  ).run(meal);
}
