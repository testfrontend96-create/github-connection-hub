import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { PlayerProvider } from './components/Player'
import { TopNav, Footer } from './components/chrome'
import Home from './pages/Home'
import Topic from './pages/Topic'
import KnowledgeBase from './pages/KnowledgeBase'
import Entity from './pages/Entity'
import Blog from './pages/Blog'
import Article from './pages/Article'
import Podcast from './pages/Podcast'
import Episode from './pages/Episode'
import Biohackers from './pages/Biohackers'
import Profile from './pages/Profile'
import Social from './pages/Social'
import FAQ from './pages/FAQ'
import Problem from './pages/Problem'
import Simple from './pages/Simple'
import NotFound from './pages/NotFound'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function LegacyHowTo() {
  const { hash } = useLocation()
  return <Navigate replace to={`/knowledge-base?type=howto${hash}`} />
}

export default function App() {
  return (
    <PlayerProvider>
      <ScrollToTop />
      <TopNav />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/topics/:slug" element={<Topic />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/knowledge/:slug" element={<Entity />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/articles/:slug" element={<Article />} />
          <Route path="/podcast" element={<Podcast />} />
          <Route path="/podcast/:slug" element={<Episode />} />
          <Route path="/biohackers" element={<Biohackers />} />
          <Route path="/biohackers/:slug" element={<Profile />} />
          <Route path="/social" element={<Social />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/problems/:slug" element={<Problem />} />
          <Route path="/reports" element={<Simple which="reports" />} />
          <Route path="/howto" element={<LegacyHowTo />} />
          <Route path="/about" element={<Simple which="about" />} />
          <Route path="/search" element={<Simple which="search" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </PlayerProvider>
  )
}
