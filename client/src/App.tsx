import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { consumeSearchIntent } from "./lib/searchIntent";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Landing } from "@/pages/landing";
import { Login } from "@/pages/login";
import { Home } from "@/pages/home";
import { RequireLogin } from "@/pages/require-login";
import PlaceDetails from "@/pages/place-details";
import { Profile } from "@/pages/profile";
import { ProfileEdit } from "@/pages/profile-edit";
import { ProfileSettings } from "@/pages/profile-settings";
import { Friends } from "@/pages/friends";
import { UserPublicProfile } from "@/pages/user-public";
import { Messages } from "@/pages/messages";
import { SocialFeed } from "@/pages/social-feed";
import { Trips } from "@/pages/trips";
import TripDetail from "@/pages/trip-detail";
import { Events } from "@/pages/events";
import { Chat } from "@/pages/chat";
import { Places } from "@/pages/places";
import MapPage from "@/pages/map";
import Blog from "@/pages/blog";
import BlogPostPage from "@/pages/blog-post";
import { Wallet } from "@/pages/wallet";
import { Privacy } from "@/pages/privacy";
import NotFound from "@/pages/not-found";
import PremiumBackground from "@/components/premium/PremiumBackground";
import ErrorBoundary from "@/components/error-boundary";
import { AnimatePresence, motion } from "framer-motion";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    const pending = consumeSearchIntent();
    if (pending && location === "/") {
      navigate(pending);
    }
  }, [isAuthenticated, isLoading, location, navigate]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && location === "/login") {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, location, navigate]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <PremiumBackground contentClassName="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </PremiumBackground>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <Switch>
          {!isAuthenticated && <Route path="/login" component={Login} />}
          {!isAuthenticated && <Route path="/privacy" component={Privacy} />}
          {!isAuthenticated && <Route path="/" component={Landing} />}
          {!isAuthenticated && <Route path="*" component={RequireLogin} />}

          {isAuthenticated && <Route path="/" component={Home} />}
          {isAuthenticated && <Route path="/map" component={MapPage} />}
          {isAuthenticated && <Route path="/blog" component={Blog} />}
          {isAuthenticated && <Route path="/blog/:id" component={BlogPostPage} />}
          {isAuthenticated && <Route path="/place/:id" component={PlaceDetails} />}
          {isAuthenticated && <Route path="/places" component={Places} />}
          {isAuthenticated && <Route path="/profile" component={Profile} />}
          {isAuthenticated && <Route path="/profile/edit" component={ProfileEdit} />}
          {isAuthenticated && <Route path="/profile/settings" component={ProfileSettings} />}
          {isAuthenticated && <Route path="/profile/friends" component={Friends} />}
          {isAuthenticated && <Route path="/u/:username" component={UserPublicProfile} />}
          {isAuthenticated && <Route path="/friends" component={Friends} />}
          {isAuthenticated && <Route path="/messages" component={Messages} />}
          {isAuthenticated && <Route path="/social-feed" component={SocialFeed} />}
          {isAuthenticated && <Route path="/trips" component={Trips} />}
          {isAuthenticated && <Route path="/trips/:id" component={TripDetail} />}
          {isAuthenticated && <Route path="/events" component={Events} />}
          {isAuthenticated && <Route path="/chat" component={Chat} />}
          {isAuthenticated && <Route path="/chat/join/:token" component={Chat} />}
          {isAuthenticated && <Route path="/wallet" component={Wallet} />}
          {isAuthenticated && <Route path="/privacy" component={Privacy} />}
          {isAuthenticated && <Route component={NotFound} />}
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ErrorBoundary>
          <Router />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
