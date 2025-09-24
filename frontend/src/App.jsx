
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'

function App() {

  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="auth" element={<Auth />} />
          <Route path="book-a-show" element={<Book />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
