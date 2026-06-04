import sql from '@/lib/db';

export const gamificationService = {
  async updateStreak(userId: string) {
    await sql`
      UPDATE users
      SET last_post_date = CURRENT_DATE,
          streak = CASE
            WHEN last_post_date = CURRENT_DATE - 1 THEN streak + 1
            WHEN last_post_date = CURRENT_DATE THEN streak
            ELSE 1
          END
      WHERE id = ${userId}
    `;
  },

  async recalculateStreaks() {
    await sql`
      UPDATE users
      SET streak = CASE
        WHEN last_post_date >= CURRENT_DATE - 1 THEN
          CASE
            WHEN last_post_date = CURRENT_DATE - 1 THEN 1
            ELSE streak
          END
        ELSE 0
      END
    `;
  },
};
