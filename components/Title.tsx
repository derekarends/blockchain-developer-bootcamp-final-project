import * as React from 'react';

type Props = {
  children: React.ReactNode;
}

export default function Title({children}: Props) {
  return (
    <div style={{
      fontSize: '20px'
    }}>
      {children}
    </div>
  );
}