import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import FeaturedCoursesSection from "@/components/home/FeaturedCoursesSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturedCoursesSection />
      <FeaturesSection />
      <CategoriesSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
