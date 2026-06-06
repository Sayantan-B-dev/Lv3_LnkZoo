'use client';

import React, { useId } from 'react';
import { useScrollReveal } from './hooks';

export function Reveal({ children, className = '', disableExit }: { children: React.ReactNode; className?: string; disableExit?: boolean }) {
  const id = useId();
  const idx = id.split(':').reduce((acc, s) => acc + [...s].reduce((a, c) => a + c.charCodeAt(0), 0), 0);
  const { ref, revealed, exiting, offset } = useScrollReveal(idx);
  const style: React.CSSProperties = {
    transitionDuration: offset.dur + 's',
    transitionDelay: revealed ? offset.del + 's' : '0s',
  };
  let transform = 'translateY(30px)';
  if (offset.dir === 'translateX') transform = 'translateX(' + offset.x + 'px)';
  else if (offset.dir === 'scale') transform = 'scale(0.95)';
  else transform = 'translateY(' + offset.y + 'px)';

  return (
    <div
      ref={ref}
      className={'reveal ' + (revealed ? 'revealed' : '') + (exiting && !disableExit ? ' exiting' : '') + (className ? ' ' + className : '')}
      style={Object.assign({}, style, {
        '--reveal-x': offset.x + 'px',
        '--reveal-y': offset.y + 'px',
        '--reveal-dir': offset.dir,
        transform: revealed ? 'none' : transform,
      } as React.CSSProperties)}
    >
      {children}
    </div>
  );
}
