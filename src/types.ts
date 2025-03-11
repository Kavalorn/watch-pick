interface AlpineAuth {
    user: any | null;
    token: string | null;
    isAuthenticated: boolean;
    showLoginModal: boolean;
    showSignupModal: boolean;
    authError: string | null;
    authEmail: string;
    authPassword: string;
    
    checkAuth(): Promise<void>;
    login(): Promise<void>;
    signup(): Promise<void>;
    logout(): Promise<void>;
  }
  
  interface MovieAppData extends AlpineAuth {
    currentTab: string;
    searchTerm: string;
    movies: any[];
    watchlist: any[];
    isLoading: boolean;
    hasError: boolean;
    selectedMovie: any;
    movieDetails: any;
    cast: any[];
    images: any[];
    loadingDetails: boolean;
    actorDetails: any;
    actorMovies: any[];
    actorLoading: boolean;
    showActorModal: boolean;
    previousMovie: any;
    selectedActor: any;
    loadingActorMovies: boolean;
    
    formatMovieForDetails(movie: any): any;
    loadWatchlist(): Promise<void>;
    isInWatchlist(movieId: number | string): boolean;
    toggleWatchlist(movie: any): Promise<void>;
    handleSearch(): Promise<void>;
    viewActorFilmography(actor: any): Promise<void>;
    openMovieDetails(movie: any): Promise<void>;
    closeMovieDetails(): void;
  }