import { Pool } from "pg";
import { configDotenv } from "dotenv";

configDotenv();

const POKE_API_BASEURL = "https://pokeapi.co/api/v2/pokemon/";

const db = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }, // required for RDS
});

async function fetchPokemonDetails() {
  const randomNumber = (Math.random() * 100).toFixed(0);

  const response = await fetch(POKE_API_BASEURL + randomNumber);
  const data = await response.json();

  const name = data.name || "undefined";
  const types = data.types.map((t) => t.type.name).join(",") || "undefined";

  const dbClient = await db.connect();

  try {
    await dbClient.query("BEGIN");
    await dbClient.query(
      `INSERT INTO pokemondata (pokemon_id, name, types)
        VALUES ($1, $2, $3)`,
      [randomNumber, name, types],
    );
    await dbClient.query("COMMIT");
  } catch (error) {
    await dbClient.query("ROLLBACK");
    throw error;
  } finally {
    dbClient.release();
  }
}

fetchPokemonDetails();
