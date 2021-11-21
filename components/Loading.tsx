import * as React from 'react';

type LoadingType = {
  isShowing: boolean;
  show: () => void;
  hide: () => void;
};

type State = {
  isShowing: boolean;
};

/**
 * Loading Component
 */
function Loading() {
  const loading = useLoading();

  if (!loading.isShowing) {
    return <></>;
  }

  return (
    <div>
      <div className='overlay-text-container'>
        <p className="overlay-text">Verifying please wait...</p>
      </div>
      <div className="overlay" />
    </div>
  );
}

/**
 * Create an Loading context to be used throughout the application
 */
const LoadingContext = React.createContext<LoadingType | undefined>(undefined);
LoadingContext.displayName = 'LoadingContext';

function LoadingProvider(props: any) {
  const [state, setState] = React.useState<State>({ isShowing: false });

  const show = React.useCallback(() => {
    setState({ isShowing: true });
  }, []);

  const hide = React.useCallback(() => {
    setState({ isShowing: false });
  }, []);

  const value = React.useMemo(
    () => ({
      show,
      hide,
      isShowing: state?.isShowing,
    }),
    [state]
  );

  return <LoadingContext.Provider value={value} {...props} />;
}

/**
 * Used for getting the auth context
 */
function useLoading(): LoadingType {
  const context = React.useContext(LoadingContext);
  if (context === undefined) {
    throw new Error(`useLoading must be used within a LoadingProvider`);
  }
  return context;
}

export { LoadingProvider, useLoading, Loading };
