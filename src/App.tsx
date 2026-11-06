import { href, useRoute } from './lib/router.ts';
import { useStore } from './lib/useStore.ts';
import { Home } from './pages/Home.tsx';
import { SetDetail } from './pages/SetDetail.tsx';
import { Study } from './pages/Study.tsx';

export function App() {
  const route = useRoute();
  const [store, update] = useStore();

  return (
    <>
      <header className="topbar">
        <a href={href.home()} className="brand">
          <span aria-hidden>🐦</span> Fieldcards
        </a>
        <span className="muted small">Birds of North America</span>
      </header>
      <main>
        {route.page === 'home' && <Home store={store} />}
        {route.page === 'set' && <SetDetail key={route.id} setId={route.id} store={store} update={update} />}
        {route.page === 'study' && <Study key={route.id} setId={route.id} store={store} update={update} />}
      </main>
      <footer className="footer muted small">
        Photos and recordings from iNaturalist and xeno-canto contributors. Range maps from Wikimedia Commons. Summaries from
        Wikipedia. Each item is credited on its card.
      </footer>
    </>
  );
}
