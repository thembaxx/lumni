import { useEffect, useMemo, useState } from "react";

export function createSubscriberHook<TState, TService>(config: {
  getService: () => TService;
  subscribe: (service: TService, cb: () => void) => () => void;
  getState: (service: TService) => TState;
  onInit?: (service: TService) => void;
}) {
  return function useSubscriber(): { state: TState; service: TService } {
    const service = useMemo(() => config.getService(), []);
    const [state, setState] = useState<TState>(() => config.getState(service));

    useEffect(() => {
      const unsub = config.subscribe(service, () => {
        setState(config.getState(service));
      });
      config.onInit?.(service);
      return unsub;
    }, [service]);

    return { state, service };
  };
}
