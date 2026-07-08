import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from './components/sections/Navbar';
import { Hero } from './components/sections/Hero';
import { Services } from './components/sections/Services';
import { Team } from './components/sections/Team';
import { Gallery } from './components/sections/Gallery';
import { Reviews } from './components/sections/Reviews';
import { Pricing } from './components/sections/Pricing';
import { FAQ } from './components/sections/FAQ';
import { Contact } from './components/sections/Contact';
import { Footer } from './components/sections/Footer';
import { BookingWizard } from './components/booking/BookingWizard';
import { AdminDashboard } from './components/admin/AdminDashboard';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Main Website Layout
function MainSite() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-black text-white antialiased">
      <Navbar />
      <main className="w-full overflow-x-hidden">
        <Hero />
        <Services />
        <Team />
        <BookingWizard />
        <Gallery />
        <Reviews />
        <Pricing />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/*" element={<MainSite />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
