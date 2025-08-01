import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Review } from "@shared/schema";

interface ReviewCardProps {
  review?: Review & {
    user?: { firstName?: string; lastName?: string; profileImageUrl?: string };
    place?: { name: string };
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  // Default review data for demonstration when no review prop is provided
  const defaultReview = {
    id: "default-1",
    rating: 5,
    content: "Absolutely incredible dining experience! The pasta was perfectly al dente and the tiramisu was to die for. The view from the terrace is breathtaking, especially during sunset. Service was impeccable.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    images: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=80",
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=80"
    ],
    user: {
      firstName: "David",
      lastName: "L.",
      profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"
    },
    place: {
      name: "Bella Vista Restaurant"
    }
  };

  const displayReview = review || defaultReview;

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const reviewDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInHours < 48) {
      return "1 day ago";
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 2) return "2 days ago";
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 14) return "1 week ago";
      return `${Math.floor(diffInDays / 7)} weeks ago`;
    }
  };

  const getUserDisplayName = () => {
    if (displayReview.user?.firstName && displayReview.user?.lastName) {
      return `${displayReview.user.firstName} ${displayReview.user.lastName.charAt(0)}.`;
    }
    return "Anonymous User";
  };

  return (
    <Card className="bg-white border border-gray-200 rounded-xl">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <img
            src={displayReview.user?.profileImageUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"}
            alt="Reviewer avatar"
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-semibold text-gray-900">
                  {getUserDisplayName()}
                </h4>
                <p className="text-sm text-gray-600">
                  {displayReview.place?.name || "Restaurant"}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <div className="flex text-yellow-400 mr-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < displayReview.rating 
                            ? 'fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatTimeAgo(displayReview.createdAt)}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-gray-700 mb-3 leading-relaxed">
              {displayReview.content}
            </p>
            
            {displayReview.images && displayReview.images.length > 0 && (
              <div className="flex space-x-2 mb-4">
                {displayReview.images.slice(0, 3).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Review photo ${index + 1}`}
                    className="w-20 h-16 rounded-md object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
                {displayReview.images.length > 3 && (
                  <div className="w-20 h-16 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 text-xs">
                    +{displayReview.images.length - 3} more
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">Helpful (12)</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary">
                  <span className="text-sm">Reply</span>
                </Button>
              </div>
              
              <Badge variant="outline" className="text-xs">
                Verified Visit
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
