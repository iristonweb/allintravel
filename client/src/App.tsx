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
import { ProfileMusic } from "@/pages/profile-music";
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
import { BlogRedirect, BlogPostRedirect } from "@/pages/blog-redirect";
import PostDetailPage from "@/pages/post-detail";
import { Wallet } from "@/pages/wallet";
import { Privacy } from "@/pages/privacy";
import NotFound from "@/pages/not-found";
import AmbientBackground from "@/components/premium/AmbientBackground";
import ErrorBoundary from "@/components/error-boundary";
import { AnimatePresence, motion } from "framer-motion";
import AitGrantListener from "@/components/ait/AitGrantListener";
import ReferralAutoApply from "@/components/ait/ReferralAutoApply";
import PushSoundListener from "@/components/PushSoundListener";
import { ChatGroupSearchProvider } from "@/components/chat/ChatGroupSearchContext";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import GlobalMusicBar from "@/components/music/GlobalMusicBar";
import AdminPage from "@/pages/admin";
import { NotificationsPage } from "@/pages/notifications";
import { captureReferralFromUrl } from "@/lib/referral-pending";
import TripPublic from "@/pages/trip-public";
import TripJoinPage from "@/pages/trip-join";
import DestinationPage from "@/pages/destination";
import DestinationsIndexPage from "@/pages/destinations";
import TelegramAppPage from "@/pages/telegram-app";
import PassportPage from "@/pages/passport";
import NomadHubsPage from "@/pages/nomad-hubs";
import CreatorsPage from "@/pages/creators";
import LaunchPage from "@/pages/launch";
import PageMeta from "@/components/seo/PageMeta";
import { initTelegramMiniApp } from "@/lib/telegram";
import { useTranslation } from "react-i18next";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const { t } = useTranslation();

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

  useEffect(() => {
    initTelegramMiniApp();
  }, []);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <AmbientBackground className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </AmbientBackground>
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
          <Route path="/privacy" component={Privacy} />
          <Route path="/map" component={MapPage} />
          <Route path="/places" component={Places} />
          <Route path="/place/:id" component={PlaceDetails} />
          <Route path="/blog/:id" component={BlogPostRedirect} />
          <Route path="/blog" component={BlogRedirect} />
          <Route path="/post/:id" component={PostDetailPage} />
          <Route path="/trips/:id/public" component={TripPublic} />
          <Route path="/trips/join/:token" component={TripJoinPage} />
          <Route path="/destinations" component={DestinationsIndexPage} />
          <Route path="/destinations/:slug" component={DestinationPage} />
          <Route path="/telegram" component={TelegramAppPage} />
          <Route path="/nomad-hubs" component={NomadHubsPage} />
          <Route path="/creators" component={CreatorsPage} />
          <Route path="/launch" component={LaunchPage} />

          {!isAuthenticated && <Route path="/login" component={Login} />}
          {!isAuthenticated && <Route path="/" component={Landing} />}
          {!isAuthenticated && <Route path="*" component={RequireLogin} />}

          {isAuthenticated && <Route path="/" component={Home} />}
          {isAuthenticated && <Route path="/profile/edit" component={ProfileEdit} />}
          {isAuthenticated && <Route path="/profile/settings" component={ProfileSettings} />}
          {isAuthenticated && <Route path="/profile/friends" component={Friends} />}
          {isAuthenticated && <Route path="/profile/music" component={ProfileMusic} />}
          {isAuthenticated && <Route path="/music" component={ProfileMusic} />}
          {isAuthenticated && <Route path="/profile" component={Profile} />}
          {isAuthenticated && <Route path="/u/:username" component={UserPublicProfile} />}
          {isAuthenticated && <Route path="/friends" component={Friends} />}
          {isAuthenticated && <Route path="/messages" component={Messages} />}
          {isAuthenticated && <Route path="/notifications" component={NotificationsPage} />}
          {isAuthenticated && <Route path="/social-feed" component={SocialFeed} />}
          {isAuthenticated && <Route path="/trips" component={Trips} />}
          {isAuthenticated && <Route path="/trips/:id" component={TripDetail} />}
          {isAuthenticated && <Route path="/events" component={Events} />}
          {isAuthenticated && <Route path="/chat" component={Chat} />}
          {isAuthenticated && <Route path="/chat/join/:token" component={Chat} />}
          {isAuthenticated && <Route path="/passport" component={PassportPage} />}
          {isAuthenticated && <Route path="/wallet" component={Wallet} />}
          {isAuthenticated && <Route path="/admin" component={AdminPage} />}
          {isAuthenticated && <Route path="/privacy" component={Privacy} />}
          {isAuthenticated && <Route component={NotFound} />}
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  useEffect(() => {
    captureReferralFromUrl();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MusicPlayerProvider>
        <TooltipProvider>
          <PageMeta />
          <Toaster />
          <AitGrantListener />
          <ReferralAutoApply />
          <PushSoundListener />
          <GlobalMusicBar />
          <ChatGroupSearchProvider>
            <ErrorBoundary>
              <Router />
            </ErrorBoundary>
          </ChatGroupSearchProvider>
        </TooltipProvider>
      </MusicPlayerProvider>
    </QueryClientProvider>
  );
}

export default App;
