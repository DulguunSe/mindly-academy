import { Link } from "react-router-dom";
import { Clock, Users, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CourseCardProps {
  id: string;
  title: string;
  shortDescription?: string;
  price: number;
  thumbnailUrl?: string;
  instructorName?: string;
  durationHours?: number;
  lessonsCount?: number;
  level?: string;
  category: string;
}

const levelLabels: Record<string, string> = {
  beginner: "Анхан шат",
  intermediate: "Дунд шат",
  advanced: "Ахисан шат",
};

const categoryLabels: Record<string, string> = {
  ielts: "IELTS",
  programming: "Програмчлал",
  sat: "SAT",
};

const CourseCard = ({
  id,
  title,
  shortDescription,
  price,
  thumbnailUrl,
  instructorName,
  durationHours = 0,
  lessonsCount = 0,
  level = "beginner",
  category,
}: CourseCardProps) => {
  return (
    <Link
      to={`/courses/${id}`}
      className="group block bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
    >
      <div className="aspect-video relative overflow-hidden bg-muted">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <BookOpen className="h-12 w-12 text-primary/40" />
          </div>
        )}
        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
          {categoryLabels[category] || category}
        </Badge>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            {levelLabels[level] || level}
          </Badge>
        </div>

        <h3 className="font-semibold text-lg text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {shortDescription && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {shortDescription}
          </p>
        )}

        {instructorName && (
          <p className="text-sm text-muted-foreground mb-3">
            Багш: <span className="font-medium text-foreground">{instructorName}</span>
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{durationHours} цаг</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{lessonsCount} хичээл</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          {price === 0 ? (
            <span className="text-2xl font-bold text-green-600">Үнэгүй</span>
          ) : (
            <span className="text-2xl font-bold text-primary">
              {price.toLocaleString()}₮
            </span>
          )}
          <span className="text-sm font-medium text-accent group-hover:underline">
            {price === 0 ? "Үзэх →" : "Худалдаж авах →"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
