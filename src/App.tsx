import './App.css'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import LoginPage from "./pages/LoginPage.tsx";
import {HelmetProvider} from "react-helmet-async";

function App() {


  return (
      <HelmetProvider>
      <BrowserRouter>
          <Routes>
              <Route index path="/" element={<LoginPage/>}/>





          </Routes>
      </BrowserRouter>
      </HelmetProvider>
  )
}

export default App
