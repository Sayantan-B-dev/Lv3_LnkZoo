import sql from '@/lib/db';

interface NotifParams {
  userId: string;
  actorId: string;
  type: 'upvote' | 'reply' | 'follow' | 'mention';
  entityId: string;
  message: string;
}

export const notificationService = {
  async create(p: NotifParams) {
    await sql`
      INSERT INTO notifications (user_id, actor_id, type, entity_id, message)
      VALUES (${p.userId}, ${p.actorId}, ${p.type}, ${p.entityId}, ${p.message})
    `;
  },
};
