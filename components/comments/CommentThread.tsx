'use client';

import React, { useMemo } from 'react';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

interface CommentData {
  id: string;
  parent_id: string | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  username: string | null;
  avatar_url: string | null;
  depth: number;
}

interface CommentThreadProps {
  comments: CommentData[];
  currentUsername?: string | null;
  commentValue: string;
  onCommentChange: (value: string) => void;
  onCommentSubmit: (e: React.FormEvent) => void;
  onCommentDelete: (id: string) => void;
  onReply: (parentId: string, content: string) => Promise<boolean>;
  isAuthenticated: boolean;
  postingComment?: boolean;
  postingReply?: boolean;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
}

function CommentNodeView({
  node,
  childrenMap,
  currentUsername,
  onCommentDelete,
  onReply,
  replyingTo,
  setReplyingTo,
  postingReply,
  depth,
}: {
  node: CommentData;
  childrenMap: Map<string | null, CommentData[]>;
  currentUsername?: string | null;
  onCommentDelete: (id: string) => void;
  onReply: (parentId: string, content: string) => Promise<boolean>;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  postingReply: boolean;
  depth: number;
}) {
  const children = childrenMap.get(node.id) || [];

  return (
    <CommentItem
      comment={node}
      currentUsername={currentUsername}
      onDelete={onCommentDelete}
      onReply={onReply}
      replyingTo={replyingTo}
      setReplyingTo={setReplyingTo}
      postingReply={postingReply}
      depth={depth}
    >
      {children.map((child) => (
        <CommentNodeView
          key={child.id}
          node={child}
          childrenMap={childrenMap}
          currentUsername={currentUsername}
          onCommentDelete={onCommentDelete}
          onReply={onReply}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          postingReply={postingReply}
          depth={Math.min(depth + 1, 10)}
        />
      ))}
    </CommentItem>
  );
}

export default function CommentThread({
  comments,
  currentUsername,
  commentValue,
  onCommentChange,
  onCommentSubmit,
  onCommentDelete,
  onReply,
  isAuthenticated,
  postingComment = false,
  postingReply = false,
  replyingTo,
  setReplyingTo,
}: CommentThreadProps) {
  const { roots, childrenMap } = useMemo(() => {
    const map = new Map<string | null, CommentData[]>();
    for (const c of comments) {
      const pk = c.parent_id;
      if (!map.has(pk)) map.set(pk, []);
      map.get(pk)!.push(c);
    }
    return { roots: map.get(null) || [], childrenMap: map };
  }, [comments]);

  return (
    <div className="comments-section">
      <h2 className="section-title">Discussion ({comments.length})</h2>

      {isAuthenticated ? (
        <CommentForm
          value={commentValue}
          onChange={onCommentChange}
          onSubmit={(e, _content) => onCommentSubmit(e)}
          loading={postingComment}
        />
      ) : (
        <div className="auth-prompt">Sign in to join the discussion.</div>
      )}

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="empty">No comments yet. Be the first!</div>
        ) : (
          roots.map((root) => (
            <CommentNodeView
              key={root.id}
              node={root}
              childrenMap={childrenMap}
              currentUsername={currentUsername}
              onCommentDelete={onCommentDelete}
              onReply={onReply}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              postingReply={postingReply}
              depth={0}
            />
          ))
        )}
      </div>
    </div>
  );
}
