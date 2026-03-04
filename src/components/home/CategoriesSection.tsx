import { Link } from "react-router-dom";
import { Code, Sparkles, Terminal, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  {
    id: "vibe-coding",
    icon: Sparkles,
    title: "Vibe Coding (AI Coding)",
    description: "AI ашиглан код бичих, Lovable, Cursor, Bolt зэрэг AI хэрэгслүүд",
    coursesCount: null,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "programming",
    icon: Code,
    title: "Програмчлал",
    description: "Python, JavaScript, React зэрэг програмчлалын хэлнүүд болон framework-ууд",
    coursesCount: null,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "coding-it",
    icon: Terminal,
    title: "Coding & IT",
    description: "Веб хөгжүүлэлт, мобайл апп, DevOps болон IT дэд бүтцийн сургалтууд",
    coursesCount: null,
    color: "from-green-500 to-emerald-500",
  },
];

const CategoriesSection = () => {
  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Сургалтын ангилал
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Өөрийн сонирхолд тохирсон ангиллаас сургалтаа сонгоно уу
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={`/courses?category=${category.id}`}
              className="group relative overflow-hidden rounded-2xl p-8 bg-card shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              />

              <div className="relative">
                <div
                  className={`h-16 w-16 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <category.icon className="h-8 w-8 text-white" />
                </div>

                <h3 className="text-xl font-bold text-card-foreground mb-3">
                  {category.title}
                </h3>

                <p className="text-muted-foreground mb-4">
                  {category.description}
                </p>

                <div className="flex items-center justify-end">
                  <span className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                    Үзэх
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" asChild>
            <Link to="/courses">
              Бүх сургалтуудыг үзэх
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
