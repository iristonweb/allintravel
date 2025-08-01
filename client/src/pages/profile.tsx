import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import NavigationHeader from "@/components/navigation-header";
import PlaceCard from "@/components/place-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Star, Heart } from "lucide-react";

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: favorites, isLoading: favoritesLoading, error: favoritesError } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  const { data: userTrips, isLoading: tripsLoading } = useQuery({
    queryKey: ["/api/trips", { userId: user?.id }],
    enabled: isAuthenticated && !!user?.id,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (favoritesError && isUnauthorizedError(favoritesError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [favoritesError, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <NavigationHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-xl mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <NavigationHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
            <p className="text-gray-600">Unable to load your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <img
                src={user.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=120"}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {user.firstName || user.lastName 
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : user.email
                  }
                </h1>
                {user.email && (
                  <p className="text-gray-600 mb-4">{user.email}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    <MapPin className="h-3 w-3 mr-1" />
                    Global Traveler
                  </Badge>
                  <Badge variant="secondary">
                    <Calendar className="h-3 w-3 mr-1" />
                    Member since {new Date(user.createdAt || '').getFullYear()}
                  </Badge>
                </div>
              </div>
              <div className="flex space-x-4">
                <Button variant="outline">Edit Profile</Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/api/logout'}
                >
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="text-center pt-6">
              <div className="text-2xl font-bold text-primary mb-1">
                {favorites?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Favorites</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center pt-6">
              <div className="text-2xl font-bold text-secondary mb-1">
                {userTrips?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Trips</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center pt-6">
              <div className="text-2xl font-bold text-accent mb-1">
                0
              </div>
              <div className="text-sm text-gray-600">Reviews</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center pt-6">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                4.8
              </div>
              <div className="text-sm text-gray-600">Rating</div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Content */}
        <Tabs defaultValue="favorites" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="trips">My Trips</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-primary" />
                  Favorite Places
                </CardTitle>
              </CardHeader>
              <CardContent>
                {favoritesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-gray-200 rounded-xl h-64 animate-pulse"></div>
                    ))}
                  </div>
                ) : favorites && favorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((favorite: any) => (
                      <PlaceCard key={favorite.place?.id} place={favorite.place} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No favorite places yet.</p>
                    <p className="text-gray-500 text-sm">Start exploring and save places you love!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trips">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-secondary" />
                  My Trips
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tripsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-gray-200 rounded h-20 animate-pulse"></div>
                    ))}
                  </div>
                ) : userTrips && userTrips.length > 0 ? (
                  <div className="space-y-4">
                    {userTrips.map((trip: any) => (
                      <div key={trip.id} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{trip.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{trip.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{trip.destination}</span>
                          <span>{new Date(trip.startDate).toLocaleDateString()}</span>
                          <span>{trip.currentParticipants}/{trip.maxParticipants} participants</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No trips planned yet.</p>
                    <p className="text-gray-500 text-sm">Create your first trip to find travel companions!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-accent" />
                  My Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No reviews written yet.</p>
                  <p className="text-gray-500 text-sm">Share your experiences to help other travelers!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Personal Information</h4>
                    <p className="text-gray-600 text-sm">
                      Update your personal details and preferences.
                    </p>
                    <Button variant="outline" className="mt-2">
                      Edit Information
                    </Button>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Privacy Settings</h4>
                    <p className="text-gray-600 text-sm">
                      Control who can see your profile and activity.
                    </p>
                    <Button variant="outline" className="mt-2">
                      Privacy Settings
                    </Button>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Notifications</h4>
                    <p className="text-gray-600 text-sm">
                      Manage your notification preferences.
                    </p>
                    <Button variant="outline" className="mt-2">
                      Notification Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
