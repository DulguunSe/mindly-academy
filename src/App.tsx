import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Dashboard from "./pages/Dashboard";
import CoursePlayer from "./pages/CoursePlayer";
import Admin from "./pages/Admin";
import AdminCourses from "./pages/AdminCourses";
import AdminCourseForm from "./pages/AdminCourseForm";
import AdminCourseLessons from "./pages/AdminCourseLessons";
import AdminInstructors from "./pages/AdminInstructors";
import AdminPayments from "./pages/AdminPayments";
import AdminSettings from "./pages/AdminSettings";
import AdminPromoCodes from "./pages/AdminPromoCodes";
import AdminUserProgress from "./pages/AdminUserProgress";
import AdminCourseRevenue from "./pages/AdminCourseRevenue";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/courses/:courseId" element={<CoursePlayer />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/courses/new" element={<AdminCourseForm />} />
          <Route path="/admin/courses/:id/edit" element={<AdminCourseForm />} />
          <Route path="/admin/courses/:courseId/lessons" element={<AdminCourseLessons />} />
          <Route path="/admin/instructors" element={<AdminInstructors />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/promo-codes" element={<AdminPromoCodes />} />
          <Route path="/admin/user-progress" element={<AdminUserProgress />} />
          <Route path="/admin/course-revenue" element={<AdminCourseRevenue />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/profile" element={<Profile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
