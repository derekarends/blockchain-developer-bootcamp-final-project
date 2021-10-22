import * as React from 'react';

export enum Status {
  info,
  success,
  error,
}

type SnackType = {
  show: boolean;
  status: Status;
  message: string;
  display: (status: Status, message: string) => void;
  close: () => void;
};

type State = {
  status?: Status;
  message?: string;
  show: boolean;
};

/**
 * Create an Snack context to be used throughout the application
 */
const SnackContext = React.createContext<SnackType | undefined>(undefined);
SnackContext.displayName = 'SnackContext';

function SnackProvider(props: any) {
  const [state, setState] = React.useState<State>({ show: false });

  const display = React.useCallback((status: Status, message: string) => {
    setState({ status, message, show: true });
  }, []);

  const close = React.useCallback(() => {
    setState({ ...state, show: false });
  }, []);

  const value = React.useMemo(
    () => ({
      display,
      close,
      show: state?.show,
      status: state?.status,
      message: state?.message,
    }),
    [state]
  );

  return <SnackContext.Provider value={value} {...props} />;
}

/**
 * Used for getting the auth context
 */
function useSnack(): SnackType {
  const context = React.useContext(SnackContext);
  if (context === undefined) {
    throw new Error(`useSnack must be used within a SnackProvider`);
  }
  return context;
}

export { SnackProvider, useSnack };
