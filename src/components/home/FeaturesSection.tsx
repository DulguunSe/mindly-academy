import { Video, Award, Users, Clock, Shield, Headphones, Sparkles } from "lucide-react";

const features = [
  {
    icon: Video,
    title: "HD чанартай видео",
    description: "Бүх хичээлүүд өндөр чанартай видео бичлэгээр бэлтгэгдсэн",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Award,
    title: "Сертификат",
    description: "Сургалт дуусмагц албан ёсны сертификат авах боломжтой",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Users,
    title: "Мэргэжлийн багш",
    description: "Салбартаа туршлагатай, мэргэжлийн багш нар хичээлийг заана",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Clock,
    title: "Насан туршид хандах",
    description: "Нэг удаа худалдаж авснаар насан туршид хандах эрхтэй",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Shield,
    title: "Баталгаат чанар",
    description: "Сэтгэл ханамжгүй бол 30 хоногийн дотор мөнгө буцаана",
    color: "from-red-500 to-rose-500",
  },
  {
    icon: Headphones,
    title: "24/7 Дэмжлэг",
    description: "Асуулт байвал бидэнтэй хүссэн үедээ холбогдоорой",
    color: "from-indigo-500 to-violet-500",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-muted/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Давуу талууд</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Яагаад биднийг сонгох вэ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Бид танд хамгийн чанартай онлайн сургалтын туршлагыг санал болгож байна
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card p-8 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-2 animate-fade-in overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              {/* Animated border */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/20 transition-colors duration-300" />
              
              {/* Icon container */}
              <div className="relative mb-6">
                <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                {/* Glow effect */}
                <div className={`absolute inset-0 h-14 w-14 rounded-xl bg-gradient-to-br ${feature.color} blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
              </div>

              {/* Content */}
              <h3 className="font-bold text-xl text-card-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Arrow indicator */}
              <div className="mt-4 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                <span className="text-sm font-medium">Дэлгэрэнгүй</span>
                <span className="text-lg">→</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom decoration */}
        <div className="flex justify-center mt-16 animate-fade-in" style={{ animationDelay: "0.8s" }}>
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-card border border-border shadow-sm">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-card flex items-center justify-center text-xs font-bold text-white"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              Суралцагчид биднийг сонгосон
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
