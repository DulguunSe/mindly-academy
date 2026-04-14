import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, X } from "lucide-react";
import Layout from "@/components/layout/Layout";
import CourseCard from "@/components/courses/CourseCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
  instructors: {
    name: string;
  } | null;
}

// Default category labels
const CATEGORY_LABELS: Record<string, string> = {
  ielts: "IELTS",
  programming: "Програмчлал",
  sat: "SAT",
};

const levels = [
  { id: "all", label: "Бүх түвшин" },
  { id: "beginner", label: "Анхан шат" },
  { id: "intermediate", label: "Дунд шат" },
  { id: "advanced", label: "Ахисан шат" },
];

const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([
    { id: "all", label: "Бүгд" },
  ]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [selectedCategory, selectedLevel, searchQuery]);

  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("courses")
      .select("category")
      .eq("is_published", true);

    if (data) {
      const uniqueCategories = [...new Set(data.map((c) => c.category))];
      const categoryList = uniqueCategories.map((cat) => ({
        id: cat,
        label: CATEGORY_LABELS[cat] || cat,
      }));
      
      // Sort: known categories first, then alphabetically
      categoryList.sort((a, b) => {
        const aKnown = CATEGORY_LABELS[a.id] ? 0 : 1;
        const bKnown = CATEGORY_LABELS[b.id] ? 0 : 1;
        if (aKnown !== bKnown) return aKnown - bKnown;
        return a.label.localeCompare(b.label);
      });

      setCategories([{ id: "all", label: "Бүгд" }, ...categoryList]);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    let query = supabase
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
      .eq("is_published", true);

    if (selectedCategory !== "all") {
      query = query.eq("category", selectedCategory);
    }

    if (selectedLevel !== "all") {
      query = query.eq("level", selectedLevel);
    }

    if (searchQuery) {
      query = query.ilike("title", `%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching courses:", error);
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", categoryId);
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedLevel("all");
    setSearchQuery("");
    setSearchParams({});
  };

  const hasActiveFilters =
    selectedCategory !== "all" || selectedLevel !== "all" || searchQuery !== "";

  return (
    <Layout>
      <div className="bg-primary py-12">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Сургалтууд
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-2xl">
            Өөрийн сонирхсон чиглэлээр мэргэжлийн багш нараас суралцаарай
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Сургалт хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Шүүлтүүр цэвэрлэх
            </Button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "secondary"}
              className="cursor-pointer px-4 py-2 text-sm"
              onClick={() => handleCategoryChange(category.id)}
            >
              {category.label}
            </Badge>
          ))}
        </div>

        {/* Level Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {levels.map((level) => (
            <Badge
              key={level.id}
              variant={selectedLevel === level.id ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
              onClick={() => setSelectedLevel(level.id)}
            >
              {level.label}
            </Badge>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                shortDescription={course.short_description || undefined}
                price={Number(course.price)}
                thumbnailUrl={course.thumbnail_url || undefined}
                instructorName={course.instructors?.name}
                durationHours={course.duration_hours || 0}
                lessonsCount={course.lessons_count || 0}
                level={course.level || "beginner"}
                category={course.category}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Сургалт олдсонгүй</h3>
            <p className="text-muted-foreground mb-4">
              Таны хайлтад тохирсон сургалт олдсонгүй
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Шүүлтүүр цэвэрлэх
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Courses;
