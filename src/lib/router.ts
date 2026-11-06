import { useEffect, useState } from 'react';

/** Tiny hash router: #/, #/set/:id, #/study/:id */
export type Route = { page: 'home' } | { page: 'set'; id: string } | { page: 'study'; id: string };

function parse(hash: string): Route {
  const [, page, id] = hash.replace(/^#/, '').split('/');
  if (page === 'set' && id) return { page: 'set', id };
  if (page === 'study' && id) return { page: 'study', id };
  return { page: 'home' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const href = {
  home: () => '#/',
  set: (id: string) => `#/set/${id}`,
  study: (id: string) => `#/study/${id}`,
};
