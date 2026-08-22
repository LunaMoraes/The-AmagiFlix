import { CATEGORY_RULES } from "../config/categories";
import { OTHER_CATEGORY_ID, OTHER_SHOWS_CATEGORY_ID } from "../config/app";
import { useLibrary } from "../context/LibraryContext";
import { selectContinueWatchingTitles, selectMyListTitles, selectRecommendedTitles, selectWatchAgainTitles } from "../lib/library";
import { selectFeaturedTitle } from "../lib/movies";
import { filterTitlesBySubcategory } from "../lib/category-engine";
import type { CatalogMovie, CatalogShow, CatalogTitle } from "../types/catalog";
import { Hero } from "../components/Hero";
import { HistoryImportCard } from "../components/HistoryImportCard";
import { MovieShelf } from "../components/MovieShelf";
import styles from "../styles/app.module.css";

export function HomePage({ movies, shows, recommendationOrder }: { movies: CatalogMovie[]; shows: CatalogShow[]; recommendationOrder: CatalogTitle[] }) {
  const { library } = useLibrary();
  const titles: CatalogTitle[] = [...movies, ...shows];
  const featured = selectFeaturedTitle(titles);
  if (!featured) return null;
  const continueWatching = selectContinueWatchingTitles(movies, shows, library);
  const myList = selectMyListTitles(movies, shows, library);
  const recommended = selectRecommendedTitles(recommendationOrder, library);
  const watchAgain = selectWatchAgainTitles(movies, shows, library);

  return (
    <main>
      <Hero title={featured} />
      <div className={styles.homeShelves}>
        <HistoryImportCard />
        <MovieShelf title="Continue Watching" titles={continueWatching} />
        <MovieShelf title="My List" titles={myList} />
        <MovieShelf title="Recommended" titles={recommended} />
        {CATEGORY_RULES.filter((category) => ![OTHER_CATEGORY_ID, OTHER_SHOWS_CATEGORY_ID].includes(category.id)).map((category) => {
          const categoryTitles = titles.filter((item) => item.categories.includes(category.id));
          if (!categoryTitles.length) return null;

          if (category.subcategories && category.subcategories.length > 0) {
            const subShelves = category.subcategories
              .map((sub) => {
                const subTitles = filterTitlesBySubcategory(categoryTitles, sub.id);
                if (!subTitles.length) return null;
                return (
                  <MovieShelf
                    key={`${category.id}-${sub.id}`}
                    id={`shelf-${category.id}-${sub.id}`}
                    title={sub.label}
                    titles={subTitles}
                    headingLevel="h3"
                  />
                );
              })
              .filter(Boolean);

            if (!subShelves.length) return null;

            return (
              <section key={category.id} className={styles.categoryGroup} aria-labelledby={`category-heading-${category.id}`}>
                <h2 id={`category-heading-${category.id}`} className={styles.categoryGroupTitle}>{category.label}</h2>
                {subShelves}
              </section>
            );
          }

          return <MovieShelf key={category.id} title={category.label} titles={categoryTitles} />;
        })}
        <MovieShelf title="Uncategorized Full Movies" titles={movies.filter((movie) => movie.categories.includes(OTHER_CATEGORY_ID))} />
        <MovieShelf title="Uncategorized Shows" titles={shows.filter((show) => show.categories.includes(OTHER_SHOWS_CATEGORY_ID))} />
        <MovieShelf title="Watch Again" titles={watchAgain} />
      </div>
    </main>
  );
}
