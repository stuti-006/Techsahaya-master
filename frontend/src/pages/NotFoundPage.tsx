import { Link } from "react-router-dom";
import { Search, Home } from "lucide-react";
import { Footer } from "../components/Footer";
import { TechSahayaLogo, TechSahayaEmblem } from "../components/TechSahayaLogo";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1A3D2E] flex flex-col justify-between">
      {/* Top Banner Bar */}
      <div className="border-b border-[#1A3D2E]/10 bg-[#1A3D2E] py-2 text-center text-xs font-semibold tracking-widest text-[#FAF7F0] uppercase">
        🇮🇳 WELCOME TO TECH SAHAYA • CITIZEN WELFARE INTELLIGENCE PORTAL
      </div>

      {/* Clean Minimal Header */}
      <header className="border-b border-[#1A3D2E]/10 bg-[#FAF7F0]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="hidden items-center gap-6 text-xs font-bold uppercase tracking-widest md:flex">
            <Link to="/schemes" className="hover:opacity-75 transition">
              All Schemes +
            </Link>
            <Link to="/how-it-works" className="hover:opacity-75 transition">
              How It Works
            </Link>
            <Link to="/about" className="hover:opacity-75 transition">
              About
            </Link>
          </div>

          {/* Centered Brand Title */}
          <Link to="/home" className="flex items-center">
            <TechSahayaLogo size={36} glowing={true} />
          </Link>

          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
            <Link to="/schemes" className="hidden sm:inline-flex hover:opacity-75 transition">
              Discover
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-[#1A3D2E] px-4 py-2 text-xs font-bold tracking-wider hover:bg-[#1A3D2E] hover:text-white transition"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main 404 Hero Section with warm sand tone & botanical feel */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">
        {/* Subtle decorative watermark icon */}
        <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-5">
          <TechSahayaEmblem size={380} />
        </div>

        <div className="relative z-10 max-w-3xl">
          <span className="inline-block rounded-full bg-[#1A3D2E]/10 px-4 py-1.5 text-xs font-bold tracking-widest uppercase text-[#1A3D2E]">
            OH NO THERE'S AN ERROR! (404)
          </span>

          <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-[#1A3D2E] sm:text-6xl md:text-7xl leading-tight">
            Looks like the page you're looking for doesn't exist.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-700">
            The welfare scheme or citizen service URL may have moved, updated during official verification, or you may have entered an incorrect web address.
          </p>

          {/* CTA Buttons styled with pill borders as in inspiration */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/schemes"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#1A3D2E] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-[#FAF7F0] shadow-lg hover:bg-[#1A3D2E]/90 hover:scale-105 transition duration-200"
            >
              <Search size={16} /> Discover Schemes
            </Link>
            <Link
              to="/home"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-[#1A3D2E] bg-transparent px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-[#1A3D2E] hover:bg-[#1A3D2E] hover:text-white transition duration-200"
            >
              <Home size={16} /> Return Home
            </Link>
          </div>

          {/* Quick links shortcut */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600">
            <span className="font-semibold text-[#1A3D2E]">Popular Sections:</span>
            <Link to="/eligibility" className="underline underline-offset-4 hover:text-[#1A3D2E]">
              Check Eligibility
            </Link>
            <span>•</span>
            <Link to="/documents" className="underline underline-offset-4 hover:text-[#1A3D2E]">
              Documents
            </Link>
            <span>•</span>
            <Link to="/security" className="underline underline-offset-4 hover:text-[#1A3D2E]">
              Security & Privacy
            </Link>
          </div>
        </div>
      </main>

      {/* Rich Footer */}
      <Footer />
    </div>
  );
}
