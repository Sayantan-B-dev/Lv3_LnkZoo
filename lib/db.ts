import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";

/**
 * Clients are created lazily (not at import time) so `next build` can collect
 * page data / prerender without a database URL set. The throw only happens
 * when a query actually runs without the URL — i.e. at request time, where
 * the error is actionable, instead of killing the whole Vercel build.
 */

function useLocalDb(): string | undefined {
  return process.env.NODE_ENV === "development"
    ? process.env.LOCAL_DATABASE_URL
    : undefined;
}

let pool: Pool | undefined;
let neonSql: any | undefined;

function getPool(): Pool {
  const connectionString = process.env.LOCAL_DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "LOCAL_DATABASE_URL is not set. Set it for local development."
    );
  }
  if (!pool) {
    pool = new Pool({ connectionString });
  }
  return pool;
}

function getNeonSql(): any {
  if (!neonSql) {
    const connectionString = process.env.NEON_DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "NEON_DATABASE_URL is not set. Set it in your deployment environment."
      );
    }
    neonSql = neon(connectionString);
  }
  return neonSql;
}

async function localTaggedQuery(strings: TemplateStringsArray, values: any[]) {
  const params: any[] = [];
  let text = "";
  let paramIdx = 0;

  strings.forEach((str, i) => {
    text += str;
    if (i < values.length) {
      paramIdx++;
      params.push(values[i]);
      text += `$${paramIdx}`;
    }
  });

  const result = await getPool().query(text, params);
  return result.rows;
}

/**
 * Drop-in for the neon tagged-template client: `sql`SELECT ... ${x}``
 * plus the `(text, values)` call form. Local dev runs against pg Pool,
 * everything else against Neon.
 */
const sql: any = async (stringsOrText: any, ...values: any[]) => {
  if (useLocalDb()) {
    // (text, values) call form.
    if (typeof stringsOrText === "string") {
      const result = await getPool().query(stringsOrText, values[0]);
      return result.rows;
    }
    return localTaggedQuery(stringsOrText as TemplateStringsArray, values);
  }
  return getNeonSql()(stringsOrText, ...values);
};

async function query(text: string, values?: any[]) {
  if (useLocalDb()) {
    const result = await getPool().query(text, values);
    return result.rows;
  }
  return getNeonSql()(text, values);
}

export { sql, query };
export default sql;
