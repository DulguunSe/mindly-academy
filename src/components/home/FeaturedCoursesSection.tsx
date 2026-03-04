import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CourseCard from "@/components/courses/CourseCard";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  short_description: string | null;
  price: number;
  thumbnail_url: string | null;
  duration_hours: number | null;
  lessons_count: number | null;
  level: string | null;
  category: string;
  instructors: { name: string } | null;
}

const FeaturedCoursesSection = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select(`
            id,
            title,
            short_description,
            price,
            thumbnail_url,
            duration_hours,
            lessons_count,
            level,
            category,
            instructors (name)
          `)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(6);

        if (error) throw error;
        setCourses(data || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Онцлох сургалтууд
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Хамгийн шинэ болон эрэлттэй сургалтуудаас сонгоорой
            </p>
          </div>
          <Button variant="outline" asChild className="w-fit">
            <Link to="/courses">
              Бүгдийг үзэх
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden">
                <Skeleton className="aspect-video" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <div
                key={course.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CourseCard
                  id={course.id}
                  title={course.title}
                  shortDescription={course.short_description || undefined}
                  price={course.price}
                  thumbnailUrl={course.thumbnail_url || undefined}
                  instructorName={course.instructors?.name}
                  durationHours={course.duration_hours || 0}
                  lessonsCount={course.lessons_count || 0}
                  level={course.level || "beginner"}
                  category={course.category}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl">
            <p className="text-muted-foreground">
              Одоогоор сургалт байхгүй байна
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCoursesSection;
