import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ThumbsUp } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Review } from "@shared/schema";

interface ReviewCardProps {
  review: Review;
  onHelpful?: (reviewId: string) => void;
  showPlaceName?: boolean;
}

function ReviewCard({ review, onHelpful, showPlaceName = false }: ReviewCardProps) {
  const formatDate = (date: string | Date | null) => {
    if (!date) return "Недавно";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "d MMM yyyy", { locale: ru });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" alt="User" />
              <AvatarFallback>
                U
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex">
                  {renderStars(review.rating)}
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              {review.title && (
                <h4 className="font-medium text-sm">{review.title}</h4>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {review.content && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {review.content}
            </p>
          )}
          
          {review.images && review.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {review.images.slice(0, 4).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Review image ${index + 1}`}
                  className="w-full h-20 object-cover rounded"
                />
              ))}
              {review.images.length > 4 && (
                <div className="w-full h-20 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center text-sm text-muted-foreground">
                  +{review.images.length - 4} фото
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onHelpful?.(review.id)}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Полезно ({review.isHelpful || 0})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { ReviewCard };
export default ReviewCard;