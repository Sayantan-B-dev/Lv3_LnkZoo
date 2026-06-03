import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";

const useLocal =
  process.env.NODE_ENV === "development" &&
  process.env.LOCAL_DATABASE_URL;

let sql: any;
let pool: Pool | undefined;

if (useLocal) {
  pool = new Pool({
    connectionString: process.env.LOCAL_DATABASE_URL,
  });

  sql = async (
    strings: TemplateStringsArray,
    ...values: any[]
  ) => {
    let text = "";

    strings.forEach((str, i) => {
      text += str;
      if (i < values.length) {
        text += `$${i + 1}`;
      }
    });

    const result = await pool.query(text, values);
    return result.rows;
  };
} else {
  sql = neon(process.env.NEON_DATABASE_URL!);
}

async function query(text: string, values?: any[]) {
  if (useLocal) {
    const result = await pool!.query(text, values);
    return result.rows;
  }
  return sql(text, values);
}

export { sql, query };
export default sql;