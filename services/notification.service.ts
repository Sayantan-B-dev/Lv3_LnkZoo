import sql from '@/lib/db';

interface NotifParams {
  user_id: string;
  actor_id: string;
  type: 'like' | 'reply' | 'follow' | 'mention' | 'flag';
  entity_id: string;
  message: string;
}

export const notificationService = {
  async create(p: NotifParams) {
    await sql`
      INSERT INTO notifications (user_id, actor_id, type, entity_id, message)
      VALUES (${p.user_id}, ${p.actor_id}, ${p.type}, ${p.entity_id}, ${p.message})
    `;
  },
};
