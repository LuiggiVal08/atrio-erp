import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/core/components/AppProvider';
import { AppRoutes } from '@/routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
