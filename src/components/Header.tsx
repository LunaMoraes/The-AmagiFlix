import { Film, Home, ListPlus, Search as SearchIcon } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import styles from "../styles/app.module.css";
import { AccountMenu } from "./AccountMenu";

import { ExtendedExperienceToggle } from "./ExtendedExperienceToggle";

const navClass = ({ isActive }: { isActive: boolean }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(location.pathname === "/search" ? params.get("q") ?? "" : "");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (location.pathname === "/search") {
      setSearchOpen(true);
      setQuery(params.get("q") ?? "");
    }
  }, [location.pathname, params]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const next = query.trim();
    navigate(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  };

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
        <NavLink to="/" className={styles.wordmark} aria-label="The AmagiFlix home"><span>THE</span> AMAGIFLIX</NavLink>
        <nav className={styles.desktopNav} aria-label="Main navigation">
          <NavLink to="/" end className={navClass}>Home</NavLink>
          <NavLink to="/movies" className={navClass}>Movies &amp; Shows</NavLink>
          <NavLink to="/my-list" className={navClass}>My List</NavLink>
          <ExtendedExperienceToggle />
        </nav>
        <form className={`${styles.headerSearch} ${searchOpen ? styles.headerSearchOpen : ""}`} onSubmit={submitSearch} role="search">
          <button type="button" aria-label="Open search" onClick={() => { setSearchOpen(true); navigate("/search"); }}>
            <SearchIcon aria-hidden="true" />
          </button>
          <input
            aria-label="Search movies and shows"
            placeholder="Titles, people, genres"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>
        <AccountMenu />
      </header>
      <nav className={styles.mobileNav} aria-label="Mobile navigation">
        <NavLink to="/" end className={navClass}><Home aria-hidden="true" /><span>Home</span></NavLink>
        <NavLink to="/search" className={navClass}><SearchIcon aria-hidden="true" /><span>Search</span></NavLink>
        <NavLink to="/my-list" className={navClass}><ListPlus aria-hidden="true" /><span>My List</span></NavLink>
        <NavLink to="/movies" className={navClass}><Film aria-hidden="true" /><span>Browse</span></NavLink>
      </nav>
    </>
  );
}
