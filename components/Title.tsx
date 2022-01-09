import * as React from 'react';

type Props = {
  children: React.ReactNode;
}

/**
 * Create generic Title
 * @param param0 
 * @returns element
 */
export default function Title({children}: Props) {
  return (
    <div style={{
      fontSize: '20px'
    }}>
      {children}
    </div>
  );
}