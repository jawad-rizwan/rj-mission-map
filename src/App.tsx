import { useReducer } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapView } from './components/MapView';
import {
  AppStateContext,
  AppDispatchContext,
  appReducer,
  initialState,
} from './store/appState';
import './App.css';

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, initialState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        <div className="app">
          <Sidebar />
          <main className="main">
            <MapView />
          </main>
        </div>
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}
