import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Sparkles, Code, Brain, Globe } from "lucide-react";
import heroLearning from "@/assets/hero-learning.png";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-primary py-20 lg:py-28 min-h-[90vh] flex items-center">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 animate-blob" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 animate-blob" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-primary-foreground/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 animate-blob" style={{ animationDelay: "4s" }} />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        
        {/* Floating Icons */}
        <div className="hidden lg:block absolute top-20 left-[15%] animate-float-slow opacity-20">
          <Code className="h-12 w-12 text-accent" />
        </div>
        <div className="hidden lg:block absolute bottom-32 left-[10%] animate-float opacity-20" style={{ animationDelay: "1s" }}>
          <Brain className="h-10 w-10 text-primary-foreground" />
        </div>
        <div className="hidden lg:block absolute top-32 right-[20%] animate-float-slow opacity-20" style={{ animationDelay: "0.5s" }}>
          <Globe className="h-14 w-14 text-accent" />
        </div>
        <div className="hidden lg:block absolute bottom-20 right-[15%] animate-float opacity-15" style={{ animationDelay: "2s" }}>
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
      </div>

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Шинэ сургалтууд нэмэгдлээ!</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight animate-fade-in-left" style={{ animationDelay: "0.1s" }}>
              AI-тай хосолсон{" "}
              <span className="relative">
                <span className="text-accent">шинэ үеийн</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path 
                    d="M2 10C50 4 150 4 198 10" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    className="text-accent/50"
                  />
                </svg>
              </span>{" "}
              програмчлалд суралц
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-in-left" style={{ animationDelay: "0.2s" }}>
              Дэлхийн тренд болж буй AI болон програмчлалын ур чадварыг мэргэжлийн түвшинд, хамгийн хялбараар эзэмшиж өөрийн хүссэн web site, гар утасны app-ийг хөгжүүлж сур.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <Button variant="hero" size="xl" asChild className="group">
                <Link to="/courses">
                  <Play className="h-5 w-5 transition-transform group-hover:scale-110" />
                  Сургалтууд
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild className="group">
                <Link to="/auth?mode=register">
                  Бүртгүүлэх
                  <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </Button>
            </div>

          </div>

          {/* Hero Image */}
          <div className="hidden lg:block relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-accent/20 blur-[60px] rounded-full scale-75" />
            
            {/* Rotating Ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[450px] h-[450px] rounded-full border-2 border-dashed border-accent/20 animate-spin-slow" />
            </div>
            
            {/* Main Image */}
            <div className="relative animate-fade-in-right" style={{ animationDelay: "0.2s" }}>
              <img 
                src={heroLearning} 
                alt="Онлайн сургалт" 
                className="w-full max-w-lg mx-auto drop-shadow-2xl animate-float" 
              />
            </div>

            {/* Floating Cards */}
            <div className="absolute -left-4 top-1/4 bg-card/90 backdrop-blur-sm rounded-xl p-4 shadow-lg animate-fade-in-left border border-border/50" style={{ animationDelay: "0.6s" }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
                  <Code className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-card-foreground text-sm">Веб хөгжүүлэлт</p>
                  <p className="text-xs text-muted-foreground">Сургалтууд</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 bottom-1/4 bg-card/90 backdrop-blur-sm rounded-xl p-4 shadow-lg animate-fade-in-right border border-border/50" style={{ animationDelay: "0.8s" }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-card-foreground text-sm">AI сургалт</p>
                  <p className="text-xs text-muted-foreground">Сургалтууд</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
